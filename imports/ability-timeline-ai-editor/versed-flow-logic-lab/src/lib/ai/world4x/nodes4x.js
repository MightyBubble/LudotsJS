// 4X 世界节点 —— GraphVM 的世界操作/查询节点（category '世界'）。
// 一切动作实现都落在图节点上：GOAP/HTN/Utility 说"做什么"，这些节点是"怎么做"的原子。
// 异步语义：移动/围攻/建造等跨回合操作都是 latent 节点，每回合推进一格/一次。

import { defineNode } from '../graph/graphvm.js';
import { UNIT_TYPES, BUILDINGS, TERRAIN, MAP_W, MAP_H } from './world.js';
import { treatyEvent } from '../diplomacy/diplomacy.js';

const num = (key, dflt = 0) => ({ key, type: 'number', default: dflt });
const str = (key, dflt = '') => ({ key, type: 'string', default: dflt });
const pure = { execIn: false, execOut: [] };

const U = (ctx) => ctx.world.units;
const unitAlive = (ctx) => ctx.unitIdx != null && ctx.unitIdx >= 0 && U(ctx).alive[ctx.unitIdx];

// 单位朝目标走一步（曼哈顿贪心，被挡则试垂直方向）
function stepUnit(ctx, i, tx, ty) {
  const w = ctx.world, u = w.units;
  const dx = Math.sign(tx - u.x[i]), dy = Math.sign(ty - u.y[i]);
  const tries = dx !== 0 && dy !== 0
    ? [[dx, 0], [0, dy]] : dx !== 0 ? [[dx, 0], [0, 1], [0, -1]] : dy !== 0 ? [[0, dy], [1, 0], [-1, 0]] : [];
  for (const [mx, my] of tries) {
    const nx = u.x[i] + mx, ny = u.y[i] + my;
    if (!w.passable(nx, ny)) continue;
    // 不与友军单位重叠
    let blocked = false;
    for (let k = 0; k < u.alive.length; k++) if (u.alive[k] && k !== i && u.x[k] === nx && u.y[k] === ny) { blocked = true; break; }
    if (blocked) continue;
    u.x[i] = nx; u.y[i] = ny; u.fortified[i] = 0;
    return true;
  }
  return false;
}

defineNode('wx.gotoXY', {
  label: '前往（x,y）', category: '世界', color: '#0ea5e9',
  latent: true,
  dataIn: [num('x'), num('y')],
  enter: (p, api) => {
    if (!unitAlive(api.ctx)) { api.finish(false); return; }
    if ((api.get('x') ?? -1) < 0 || (api.get('y') ?? -1) < 0) { api.finish(false); return; } // 无合法目标点
    api.suspend({ prog: 0 });
  },
  step: (p, api, st) => {
    if (!unitAlive(api.ctx)) { api.finish(false); return; }
    const u = U(api.ctx);
    const tx = api.get('x'), ty = api.get('y');
    if (tx < 0 || ty < 0) { api.finish(false); return; }
    if (u.x[api.ctx.unitIdx] === tx && u.y[api.ctx.unitIdx] === ty) { api.fire('then'); return; }
    const px = u.x[api.ctx.unitIdx], py = u.y[api.ctx.unitIdx];
    stepUnit(api.ctx, api.ctx.unitIdx, tx, ty);
    // 长期无进展（被驻守单位堵死等）：放弃而不是死等
    if (u.x[api.ctx.unitIdx] === px && u.y[api.ctx.unitIdx] === py) {
      st.prog = (st.prog || 0) + 1;
      if (st.prog >= 12) { api.finish(false); return; }
    } else st.prog = 0;
    api.suspend(st);
  },
});

defineNode('wx.foundCity', {
  label: '建立城市', category: '世界', color: '#10b981',
  eval: (p, api) => {
    const ctx = api.ctx, u = U(ctx);
    if (!unitAlive(ctx) || u.type[ctx.unitIdx] !== 'settler') return 'failed';
    if (!ctx.world.passable(u.x[ctx.unitIdx], u.y[ctx.unitIdx])) return 'failed';
    // 距现有城市太近不建
    const c = ctx.world.cities;
    for (let i = 0; i < c.alive.length; i++) {
      if (c.alive[i] && ctx.world.dist(c.x[i], c.y[i], u.x[ctx.unitIdx], u.y[ctx.unitIdx]) < 3) return 'failed';
    }
    const name = ctx.agent.cityName();
    ctx.world.foundCity(ctx.agent.factionIdx, name, u.x[ctx.unitIdx], u.y[ctx.unitIdx]);
    ctx.world.killUnit(ctx.unitIdx);
    return 'then';
  },
  execOut: ['then', 'failed'],
});

defineNode('wx.buildImprovement', {
  label: '建造设施（工人，3回合）', category: '世界', color: '#10b981',
  latent: true,
  dataIn: [str('building', 'farm')],
  enter: (p, api) => api.suspend({ t: 3 }),
  step: (p, api, st) => {
    const ctx = api.ctx, u = U(ctx);
    if (!unitAlive(ctx)) { api.finish(false); return; }
    st.t -= 1;
    if (st.t > 0) { api.suspend(st); return; }
    // 找脚下或相邻的己方城市，加入建筑
    const c = ctx.world.cities;
    let done = false;
    for (let i = 0; i < c.alive.length; i++) {
      if (!c.alive[i] || c.faction[i] !== ctx.agent.factionIdx) continue;
      if (ctx.world.dist(c.x[i], c.y[i], u.x[ctx.unitIdx], u.y[ctx.unitIdx]) <= 1) {
        const b = api.get('building') || 'farm';
        if (!c.buildings[i].includes(b) && c.buildings[i].length < 4) {
          c.buildings[i].push(b);
          ctx.world.log('econ', `${ctx.agent.name} 的 ${c.name[i]} 由工人建成 ${BUILDINGS[b]?.label || b}`, ctx.agent.id);
          done = true;
        }
        break;
      }
    }
    if (done) api.fire('then'); else api.finish(false);
  },
});

defineNode('wx.attackTarget', {
  label: '攻击目标（相邻）', category: '世界', color: '#ef4444',
  eval: (p, api) => {
    const ctx = api.ctx;
    if (!unitAlive(ctx)) return 'failed';
    const t = ctx.target;
    if (!t || t.id === undefined) return 'failed';
    const u = U(ctx);
    const tx = t.kind === 'city' ? ctx.world.cities.x[t.id] : ctx.world.units.x[t.id];
    const ty = t.kind === 'city' ? ctx.world.cities.y[t.id] : ctx.world.units.y[t.id];
    if (ctx.world.dist(u.x[ctx.unitIdx], u.y[ctx.unitIdx], tx, ty) > 1) return 'failed';
    ctx.world.attack(ctx.unitIdx, t.kind, t.id);
    return 'then';
  },
  execOut: ['then', 'failed'],
});

defineNode('wx.besiege', {
  label: '围攻城市（直至破城）', category: '世界', color: '#ef4444',
  latent: true,
  enter: (p, api) => api.suspend({}),
  step: (p, api) => {
    const ctx = api.ctx;
    if (!unitAlive(ctx)) { api.finish(false); return; }
    const t = ctx.target;
    const c = ctx.world.cities;
    if (!t || t.kind !== 'city' || !c.alive[t.id]) { api.fire('then'); return; }
    if (c.faction[t.id] === ctx.agent.factionIdx) { api.fire('then'); return; } // 已破城
    const u = U(ctx);
    if (ctx.world.dist(u.x[ctx.unitIdx], u.y[ctx.unitIdx], c.x[t.id], c.y[t.id]) > 1) {
      stepUnit(ctx, ctx.unitIdx, c.x[t.id], c.y[t.id]);
    } else {
      ctx.world.attack(ctx.unitIdx, 'city', t.id);
    }
    api.suspend({});
  },
});

defineNode('wx.sabotage', {
  label: '破坏（间谍）', category: '世界', color: '#a855f7',
  eval: (p, api) => {
    const ctx = api.ctx, u = U(ctx);
    if (!unitAlive(ctx) || u.type[ctx.unitIdx] !== 'spy') return 'failed';
    const c = ctx.world.cities;
    for (let i = 0; i < c.alive.length; i++) {
      if (!c.alive[i] || c.faction[i] === ctx.agent.factionIdx) continue;
      if (ctx.world.dist(c.x[i], c.y[i], u.x[ctx.unitIdx], u.y[ctx.unitIdx]) <= 2) {
        const b = c.buildings[i];
        const removed = b.length ? b.splice(Math.floor(ctx.world.rng() * b.length), 1)[0] : null;
        c.hp[i] = Math.max(1, c.hp[i] - 5);
        ctx.world.log('covert', `${ctx.agent.name} 的间谍潜入 ${c.name[i]}，破坏了${removed ? BUILDINGS[removed]?.label : '城防设施'}`, ctx.agent.id);
        ctx.agent.knowledge.mem.add('sabotage_done', { city: c.name[i] }, ctx.time);
        return 'then';
      }
    }
    return 'failed';
  },
  execOut: ['then', 'failed'],
});

defineNode('wx.treaty', {
  label: '外交动作', category: '世界', color: '#eab308',
  dataIn: [str('event', 'declare_war'), num('targetFaction', 0)],
  eval: (p, api) => {
    const ctx = api.ctx;
    const tIdx = api.get('targetFaction') | 0;
    const other = ctx.world.factions[tIdx];
    if (!other || tIdx === ctx.agent.factionIdx) return 'failed';
    const ok = treatyEvent(ctx.world.diplomacy, ctx.agent.id, other.id, api.get('event'));
    if (ok) {
      const ev = api.get('event');
      const label = { declare_war: '宣战', accept_alliance: '结盟', make_peace: '议和', betray: '毁约' }[ev] || ev;
      ctx.world.log('diplo', `${ctx.agent.name} 对 ${other.name} ${label}`, ctx.agent.id);
      ctx.agent.knowledge.mem.add(ev, { with: other.id }, ctx.time);
    }
    return ok ? 'then' : 'failed';
  },
  execOut: ['then', 'failed'],
});

defineNode('wx.gift', {
  label: '送礼（金→关系）', category: '世界', color: '#eab308',
  dataIn: [num('targetFaction', -1), num('amount', 20)],
  eval: (p, api) => {
    const ctx = api.ctx;
    const me = ctx.world.factions[ctx.agent.factionIdx];
    // targetFaction < 0 = 自动选择：第一个非己方、非交战的阵营
    let tIdx = api.get('targetFaction') | 0;
    if (tIdx < 0) {
      tIdx = -1;
      for (let i = 0; i < ctx.world.factions.length; i++) {
        if (i !== ctx.agent.factionIdx && !ctx.world.diplomacy.atWar(ctx.agent.id, ctx.world.factions[i].id)) { tIdx = i; break; }
      }
    }
    const other = ctx.world.factions[tIdx];
    if (!other || tIdx === ctx.agent.factionIdx || me.gold < api.get('amount')) return 'failed';
    me.gold -= api.get('amount');
    other.gold += api.get('amount');
    ctx.world.diplomacy.add(ctx.agent.id, other.id, 8);
    ctx.world.log('diplo', `${ctx.agent.name} 向 ${other.name} 赠送了 ${api.get('amount')} 金`, ctx.agent.id);
    return 'then';
  },
  execOut: ['then', 'failed'],
});

defineNode('wx.enqueue', {
  label: '城市队列生产（队满则等待）', category: '世界', color: '#10b981',
  latent: true,
  dataIn: [str('item', 'warrior'), num('cityId', -1)],
  enter: (p, api) => { if (!tryEnqueue(api)) api.suspend({}); },
  step: (p, api) => { if (tryEnqueue(api)) api.fire('then'); else api.suspend({}); },
});

function tryEnqueue(api) {
  const ctx = api.ctx, c = ctx.world.cities;
  let ci = api.get('cityId');
  if (ci < 0) {
    ci = -1;
    // 选队列最短的己方城市
    let bl = 99;
    for (let i = 0; i < c.alive.length; i++) {
      if (c.alive[i] && c.faction[i] === ctx.agent.factionIdx && c.queue[i].length < bl) { bl = c.queue[i].length; ci = i; }
    }
  }
  if (ci < 0 || !c.alive[ci]) { api.finish(false); return true; } // 没有城市 = 真失败
  if (c.queue[ci].length >= 3) return false; // 队满：下回合再试
  c.queue[ci].push(api.get('item'));
  return true;
}

defineNode('wx.fortify', {
  label: '驻防', category: '世界', color: '#64748b',
  eval: (p, api) => {
    if (!unitAlive(api.ctx)) return 'failed';
    U(api.ctx).fortified[api.ctx.unitIdx] = 1;
    return 'then';
  },
  execOut: ['then', 'failed'],
});

defineNode('wx.heal', {
  label: '休整恢复（至满血）', category: '世界', color: '#64748b',
  latent: true,
  enter: (p, api) => api.suspend({}),
  step: (p, api) => {
    const ctx = api.ctx, u = U(ctx);
    if (!unitAlive(ctx)) { api.finish(false); return; }
    const max = UNIT_TYPES[u.type[ctx.unitIdx]].hp;
    u.hp[ctx.unitIdx] = Math.min(max, u.hp[ctx.unitIdx] + 4);
    if (u.hp[ctx.unitIdx] >= max) api.fire('then'); else api.suspend({});
  },
});

// ── 数据查询节点（纯） ──
defineNode('wx.selfX', { label: '自身 X', category: '世界', color: '#64748b', ...pure, dataOut: [num('value')], eval: (p, api) => api.set('value', unitAlive(api.ctx) ? U(api.ctx).x[api.ctx.unitIdx] : -1) });
defineNode('wx.selfY', { label: '自身 Y', category: '世界', color: '#64748b', ...pure, dataOut: [num('value')], eval: (p, api) => api.set('value', unitAlive(api.ctx) ? U(api.ctx).y[api.ctx.unitIdx] : -1) });
defineNode('wx.selfHp', { label: '自身血量', category: '世界', color: '#64748b', ...pure, dataOut: [num('value')], eval: (p, api) => api.set('value', unitAlive(api.ctx) ? U(api.ctx).hp[api.ctx.unitIdx] : 0) });
defineNode('wx.gold', { label: '国库金', category: '世界', color: '#eab308', ...pure, dataOut: [num('value')], eval: (p, api) => api.set('value', api.ctx.world.factions[api.ctx.agent.factionIdx].gold) });
defineNode('wx.cityCount', {
  label: '己方城市数', category: '世界', color: '#10b981', ...pure,
  dataOut: [num('value')],
  eval: (p, api) => {
    const c = api.ctx.world.cities; let n = 0;
    for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.faction[i] === api.ctx.agent.factionIdx) n++;
    api.set('value', n);
  },
});
defineNode('wx.unitCount', {
  label: '己方单位数（按角色）', category: '世界', color: '#64748b', ...pure,
  dataOut: [num('value')],
  propsSchema: { role: { type: 'select', options: ['army', 'expand', 'develop', 'recon', 'covert', 'diplomat', 'trade', 'siege'], default: 'army' } },
  eval: (p, api) => {
    const u = U(api.ctx); let n = 0;
    for (let i = 0; i < u.alive.length; i++) {
      if (u.alive[i] && u.faction[i] === api.ctx.agent.factionIdx && UNIT_TYPES[u.type[i]].role === api.prop('role', 'army')) n++;
    }
    api.set('value', n);
  },
});
defineNode('wx.atWar', {
  label: '与某国交战中？', category: '世界', color: '#ef4444', ...pure,
  dataIn: [num('targetFaction', 0)],
  dataOut: [{ key: 'value', type: 'bool', default: false }],
  eval: (p, api) => {
    const other = api.ctx.world.factions[api.get('targetFaction') | 0];
    api.set('value', other ? api.ctx.world.diplomacy.atWar(api.ctx.agent.id, other.id) : false);
  },
});
defineNode('wx.relation', {
  label: '与某国关系值', category: '世界', color: '#eab308', ...pure,
  dataIn: [num('targetFaction', 0)],
  dataOut: [num('value')],
  eval: (p, api) => {
    const other = api.ctx.world.factions[api.get('targetFaction') | 0];
    api.set('value', other ? api.ctx.world.diplomacy.get(api.ctx.agent.id, other.id) : 0);
  },
});
defineNode('wx.nearestEnemyCity', {
  label: '最近敌城', category: '世界', color: '#ef4444', ...pure,
  dataOut: [num('x'), num('y'), num('id'), num('dist')],
  eval: (p, api) => {
    const ctx = api.ctx, c = ctx.world.cities, u = U(ctx);
    let best = -1, bd = 1e9;
    const sx = unitAlive(ctx) ? u.x[ctx.unitIdx] : (ctx.agent.capital()?.x ?? 0);
    const sy = unitAlive(ctx) ? u.y[ctx.unitIdx] : (ctx.agent.capital()?.y ?? 0);
    for (let i = 0; i < c.alive.length; i++) {
      if (!c.alive[i] || c.faction[i] === ctx.agent.factionIdx) continue;
      const d = ctx.world.dist(sx, sy, c.x[i], c.y[i]);
      if (d < bd) { bd = d; best = i; }
    }
    api.set('x', best >= 0 ? c.x[best] : -1); api.set('y', best >= 0 ? c.y[best] : -1);
    api.set('id', best); api.set('dist', best >= 0 ? bd : 999);
  },
});
defineNode('wx.nearestOwnCity', {
  label: '最近己方城市', category: '世界', color: '#10b981', ...pure,
  dataOut: [num('x'), num('y'), num('id'), num('dist')],
  eval: (p, api) => {
    const ctx = api.ctx, c = ctx.world.cities, u = U(ctx);
    let best = -1, bd = 1e9;
    const sx = unitAlive(ctx) ? u.x[ctx.unitIdx] : 0, sy = unitAlive(ctx) ? u.y[ctx.unitIdx] : 0;
    for (let i = 0; i < c.alive.length; i++) {
      if (!c.alive[i] || c.faction[i] !== ctx.agent.factionIdx) continue;
      const d = ctx.world.dist(sx, sy, c.x[i], c.y[i]);
      if (d < bd) { bd = d; best = i; }
    }
    api.set('x', best >= 0 ? c.x[best] : -1); api.set('y', best >= 0 ? c.y[best] : -1);
    api.set('id', best); api.set('dist', best >= 0 ? bd : 999);
  },
});
defineNode('wx.bestCitySite', {
  label: '最佳建城点', category: '世界', color: '#10b981', ...pure,
  dataOut: [num('x'), num('y'), num('score')],
  eval: (p, api) => {
    // 中观层选址：平原/丘陵 +食物/生产，靠近水源 -敌城 +远离己城过密
    const ctx = api.ctx, w = ctx.world, c = w.cities;
    let bx = -1, by = -1, bs = -1e9;
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (!w.passable(x, y)) continue;
      let s = 2;
      const t = w.tileAt(x, y);
      if (t === TERRAIN.HILL) s += 1.5;
      if (t === TERRAIN.FOREST) s += 1;
      let minOwn = 99, minFoe = 99, occupied = false;
      for (let i = 0; i < c.alive.length; i++) {
        if (!c.alive[i]) continue;
        const d = w.dist(x, y, c.x[i], c.y[i]);
        if (d < 3) { occupied = true; break; }
        if (c.faction[i] === ctx.agent.factionIdx) minOwn = Math.min(minOwn, d);
        else minFoe = Math.min(minFoe, d);
      }
      if (occupied) continue;
      s += Math.min(4, minOwn) * 0.5 + Math.min(6, minFoe) * 0.8;
      if (s > bs) { bs = s; bx = x; by = y; }
    }
    api.set('x', bx); api.set('y', by); api.set('score', bs);
  },
});
