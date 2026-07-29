// Effect 处理器注册表 —— 命中逻辑与 Ability 完全解耦（OCP：加效果类型 = 注册，不改执行器）。
// ctx = { abilityId, prof, target?, point? }：prof 是施法瞬间的偏好快照，
// 效果是 (效果定义, ctx, 世界) 的纯执行，不回查全局可变偏好。
import { emit } from './events';
import { matchesFilter, grantTimedTag } from './tags';
import { recordHit } from './knowledgeBridge';

let projId = 0;

export function searchHostile(state, u, range, ox, oz, pick = 'nearest') {
  let best = null, bestScore = Infinity;
  for (const v of state.units) {
    if (v.team === u.team || !matchesFilter(v, state.time)) continue;
    const d = Math.hypot(v.x - ox, v.z - oz);
    if (d > range) continue;
    const score = pick === 'lowest_hp' ? v.health : d;
    if (score < bestScore) { bestScore = score; best = v; }
  }
  return best;
}

export function applyDamage(state, victim, amount, abilityId, casterId) {
  // 效果层只扣血；死亡状态转移由引擎 processDeaths 统一处理（层次不越权）
  victim.health = Math.max(0, victim.health - amount);
  // 受击传感器：事实写进被击者黑板 bb.lastHit —— 姿态 damaged 触发/事件转移只读此键
  if (casterId && victim.blackboard) {
    victim.blackboard.lastHit = { by: casterId, at: state.time };
    recordHit(victim, casterId, state.time); // 统一知识层 mem 'attacked' 记录（threat 信念的事实源）
  }
  emit(state, 'damage_applied', { abilityId, targetId: victim.id, amount, x: victim.x, z: victim.z });
}

export const EFFECT_HANDLERS = {};
// needs：'unit' = 首效果必须作用于对象（取不到候选就放不出来）
//        'any'  = 对象/地点皆可（开追踪时可在效果层吸附补正到悬停对象）
//        'none' = 不依赖目标参数（自区域等）
export const EFFECT_META = {};
export const registerEffect = (type, handler, needs = 'none') => {
  EFFECT_HANDLERS[type] = handler;
  EFFECT_META[type] = { needs };
};

export function executeEffect(state, caster, effect, ctx) {
  const handler = EFFECT_HANDLERS[effect.type];
  if (handler) handler(state, caster, effect, ctx);
}

// ── 内置效果 ──

// SC2 式搜索：Ability 只给了点/方向时，在参数点（无点则施法者）附近搜索最优对象
registerEffect('search', (state, caster, effect, ctx) => {
  let target = ctx.target && matchesFilter(ctx.target, state.time) ? ctx.target : null;
  if (!target) {
    const ox = ctx.point ? ctx.point.x : caster.x;
    const oz = ctx.point ? ctx.point.z : caster.z;
    target = searchHostile(state, caster, effect.radius, ox, oz, effect.pick);
    if (target) emit(state, 'search_resolved', { abilityId: ctx.abilityId, radius: effect.radius, pick: effect.pick, targetId: target.id });
  }
  executeEffect(state, caster, effect.then, { ...ctx, target });
}, 'any');

registerEffect('projectile', (state, caster, effect, ctx) => {
  const prof = ctx.prof || {};
  const target = ctx.target && matchesFilter(ctx.target, state.time) ? ctx.target : null;
  // 追踪是效果层语义：有对象参数且开启追踪 → 追踪弹道；否则直线
  if (target && prof.track) {
    state.projectiles.push({
      id: projId++, team: caster.team, casterId: caster.id, x: caster.x, z: caster.z,
      tx: target.x, tz: target.z, targetId: target.id,
      speed: effect.speed, damage: effect.damage, abilityId: ctx.abilityId,
    });
    emit(state, 'projectile_fired', { abilityId: ctx.abilityId, kind: 'homing', targetId: target.id });
  } else if (target) {
    const dx = target.x - caster.x, dz = target.z - caster.z;
    const d = Math.hypot(dx, dz) || 1;
    state.projectiles.push({
      id: projId++, team: caster.team, casterId: caster.id, x: caster.x, z: caster.z,
      straight: true, dx: dx / d, dz: dz / d, traveled: 0, maxDist: 13,
      speed: effect.speed, damage: effect.damage, abilityId: ctx.abilityId,
    });
    emit(state, 'projectile_fired', { abilityId: ctx.abilityId, kind: 'straight_at', targetId: target.id });
  } else {
    state.projectiles.push({
      id: projId++, team: caster.team, casterId: caster.id, x: caster.x, z: caster.z,
      straight: true, dx: caster.fx, dz: caster.fz, traveled: 0, maxDist: 13,
      speed: effect.speed, damage: effect.damage, abilityId: ctx.abilityId,
    });
    emit(state, 'projectile_fired', { abilityId: ctx.abilityId, kind: 'straight_facing' });
  }
}, 'any');

registerEffect('swing', (state, caster, effect, ctx) => {
  const target = ctx.target && matchesFilter(ctx.target, state.time) && Math.hypot(ctx.target.x - caster.x, ctx.target.z - caster.z) <= effect.range
    ? ctx.target
    : searchHostile(state, caster, effect.range, caster.x, caster.z);
  const dx = target ? target.x - caster.x : caster.fx;
  const dz = target ? target.z - caster.z : caster.fz;
  emit(state, 'swing_performed', { x: caster.x, z: caster.z, dx, dz, range: effect.range });
  if (target) applyDamage(state, target, effect.damage, ctx.abilityId, caster.id);
  else emit(state, 'swing_missed', { abilityId: ctx.abilityId });
});

// 治疗：作用于友方对象（目标阵营由 Ability 的 targetFilter 声明，效果层只管加血）
registerEffect('heal', (state, caster, effect, ctx) => {
  const t = ctx.target;
  if (t && matchesFilter(t, state.time)) {
    t.health = Math.min(t.maxHealth, t.health + effect.amount);
    emit(state, 'heal_applied', { abilityId: ctx.abilityId, targetId: t.id, amount: effect.amount, x: t.x, z: t.z });
  }
}, 'unit');

registerEffect('damage', (state, caster, effect, ctx) => {
  if (ctx.target && matchesFilter(ctx.target, state.time)) applyDamage(state, ctx.target, effect.amount, ctx.abilityId, caster.id);
}, 'unit');

registerEffect('pulse', (state, caster, effect, ctx) => {
  emit(state, 'pulse_performed', { x: caster.x, z: caster.z, radius: effect.radius });
  for (const v of state.units) {
    if (v.team !== caster.team && matchesFilter(v, state.time) && Math.hypot(v.x - caster.x, v.z - caster.z) <= effect.radius) {
      applyDamage(state, v, effect.damage, ctx.abilityId, caster.id);
    }
  }
});

// 附加标签：硬控/状态全走标签 —— 受迫打断由被打断者技能的 interrupt.by 过滤器命中该标签触发（解耦）
registerEffect('applyTag', (state, caster, effect, ctx) => {
  const t = ctx.target;
  if (t && matchesFilter(t, state.time)) {
    grantTimedTag(t, effect.tag, state.time + effect.duration);
    emit(state, 'tag_applied', { abilityId: ctx.abilityId, targetId: t.id, tag: effect.tag, duration: effect.duration, x: t.x, z: t.z });
  }
}, 'unit');