// 引擎 —— 世界状态 + Controller（指挥者意图）+ 指令队列 + 施法激活 + tick 推进。
// 领域只 emit 事件（events.js 里的适配器负责日志/fx/飘字/统计）。
//
// 核心原则：
// 1. Order payload 与输入分层：cmd.params = { kind: unit|point|direction|none, ... }
//    全部参数在"下达指令瞬间"决议快照（含方向）。指挥意图（aim/悬停/选中/按住）
//    每 tick 快照进受控单位黑板 bb.control —— 决议与执行的一切意图读取只看黑板，
//    引擎内部从不直接读 controller（AI 单位向 bb.control 写意图即可驱动同一套逻辑）。
// 2. 传感器 → 黑板契约（sensors.js 是词汇表）：传感器只写黑板键（bb.perceived / bb.memory /
//    bb.lastHit / bb.control），决策与执行只读黑板键，从不引用活对象或回读 controller。
// 3. 状态去语义化：不问 alive，问标签过滤器（tags.js）；冷却=限时标签，门禁复用 blockedBy。
import { ABILITY_DEFS, ACTION_BINDINGS, ATTACK_RANGE, MOVE_SPEED, MAX_QUEUE, MEMORY_TTL, RETALIATE_WINDOW, DEFAULT_ATTACK, FREEZE_TAGS, FOLLOW_GAP, ARRIVE_EPS } from './abilityDefs';
import { resolveRoute } from './contextRouting';
import { emit } from './events';
import { executeEffect, applyDamage, EFFECT_META } from './effects';
import { effectiveTags, grantTimedTag, matchesFilter } from './tags';
import { evaluateSelector, scoreCandidates, defaultSelector, resolveSelector, AIM_CONSIDERATIONS } from './targetSelector';
import { stanceEvent, stanceMachineOf, hfsmLeafOf } from './stances';
import { stanceBehaviorOf } from './stanceBehavior';
import { labGraphCtx } from './abilityTemplates';
import { obtainRun, releaseRun, startRun, tickRun } from '@/lib/ai/graph/graphvm.js';
import { createLabKnowledge, syncKnowledge, recordHit, recordEvent, MemClock } from './knowledgeBridge';

export function createLabState() {
  const mkUnit = (id, team, x, z, unitTags = [], stance = 'HoldFire') => ({
    id, team, x, z, fx: team === 1 ? 1 : -1, fz: 0,
    health: 100, maxHealth: 100, alive: true, // alive 仅供渲染；引擎判定走 State.Dead 标签
    sight: 7,
    unitTags, timedTags: [],
    stance, // 姿态 FSM 当前状态
    // 黑板：全部由传感器写入（视野→perceived · 记忆→memory · 受击→lastHit · 指挥→control）——一切决策的唯一来源
    blackboard: { perceived: [], memory: {}, lastHit: null },
    // 统一知识包（BB 镜像 + Mem 记录 + WS 位 + Belief 主观派生）—— 与 4X/BT/FSM/GOAP/HTN 同一套词汇
    knowledge: createLabKnowledge(),
    queue: [], ability: null, buffer: [], tags: [], skillTargets: {},
  });
  return {
    time: 0,
    // 敌方默认「还击」姿态（autocast 验证：AI 与玩家共用同一 order 管道）；玩家单位默认静默
    units: [mkUnit('P1', 1, -5, -2), mkUnit('P2', 1, -5, 2, ['Role.Healer']), mkUnit('E1', 2, 5, -2, [], 'ReturnFire'), mkUnit('E2', 2, 5, 2, [], 'ReturnFire')],
    // Controller：指挥者意图。aim 是统一瞄准点（鼠标地面点/摇杆推杆方向落点皆写这里）
    // pending：③确认层的待确认施法（Armed 态，commit 前不进入缓冲/队列/引擎）
    controller: { controlledId: 'P1', selectedTargetId: null, hoverTargetId: null, aim: { x: 4, z: 0 }, heldInputs: [], pending: null, pendingOrder: null },
    prefs: Object.fromEntries(Object.entries(ABILITY_DEFS).map(([k, d]) => [
      k,
      { ...d.cast, rebind: { ...(d.cast?.rebind || {}) }, ...(d.acquire ? { acquireRange: d.acquire.range, acquirePick: d.acquire.pick, selector: JSON.parse(JSON.stringify(d.acquire.selector || defaultSelector(d.acquire.pick))) } : {}) },
    ])),
    projectiles: [],
    fx: [],
    notices: [], // 世界内飘字（拒绝反馈等），events.js 适配器写入
    events: [],
    stats: { executed: 0, buffered: 0, dropped: 0 },
    selectorAssets: {}, // 选目标器命名资产（UtilitySet blob selectors 区，实验室加载后挂载；{ref} 引用经 resolveSelector 解析）
  };
}

export const getUnit = (state, id) => state.units.find((u) => u.id === id);
export const getControlled = (state) => getUnit(state, state.controller.controlledId);
const isActive = (state, u) => matchesFilter(u, state.time);
const validHostile = (state, u, id) => {
  const v = getUnit(state, id);
  return v && v.team !== u.team && isActive(state, v) ? v : null;
};
const isBlocked = (state, u, def) => {
  const tags = effectiveTags(u, state.time);
  return def.blockedBy?.some((t) => tags.includes(t));
};
// rebind：参数重绑定策略（commit=下达定格 | tick=逐帧 | onInvalid=失效重取；round 由 channel:'repeat' 结构承担）
const rebindOf = (prof, param) => prof?.rebind?.[param] || 'commit';
// targetFilter：技能目标阵营声明（enemy 默认 / ally）—— 感知是全阵营的，阵营过滤在使用侧
const factionOk = (u, prof) => (s) => (prof?.targetFilter === 'ally' ? s.team === u.team : s.team !== u.team);

// ── 轨道（Track）──
// 互斥槽是数据：引擎只认轨道 ID，不认语义。同轨互斥、异轨并行（边走边打）；
// 跨轨约束不进引擎 —— 走标签门禁。"施法中"由轨道占用承担（blockedBy 不再含 State.Ability）。
// 占用集是阶段函数：接近/追忆阶段追加 legs，进入出手阶段释放。
const abilityTracks = (id) => ABILITY_DEFS[id].cast?.tracks || ['legs', 'arms'];
export const cmdTracks = (cmd) => {
  if (cmd.type === 'move' || cmd.type === 'follow') return ['legs'];
  if (cmd.type === 'ability') {
    const t = abilityTracks(cmd.id);
    return cmd._approaching || cmd._chasingMemory ? [...new Set(['legs', ...t])] : t;
  }
  return ['legs', 'arms']; // attack / attackmove / patrol：含追击的复合指令
};
const overlap = (a, b) => a.some((t) => b.includes(t));
const castTracks = (u) => (u.ability ? abilityTracks(u.ability.id) : []);

// UI：轨道占用视图 —— 每条轨道当前被谁占用（施法 / 执行中的计划队首）
export function getTrackUsage(u) {
  const usage = { legs: null, arms: null };
  if (!u) return usage;
  if (u.ability) for (const t of abilityTracks(u.ability.id)) usage[t] = { kind: 'cast', label: ABILITY_DEFS[u.ability.id].label };
  const head = u.queue?.[0];
  if (head && !(u.ability && overlap(cmdTracks(head), castTracks(u)))) {
    for (const t of cmdTracks(head)) if (!usage[t]) usage[t] = { kind: 'cmd', label: head.type === 'ability' ? ABILITY_DEFS[head.id].label : head.type };
  }
  return usage;
}

// ── Controller ──
export function switchControl(state, id) {
  const u = getUnit(state, id);
  if (!u || !isActive(state, u) || state.controller.controlledId === id) return;
  cancelPending(state, '切换控制');
  state.controller.controlledId = id;
  if (state.controller.selectedTargetId && !validHostile(state, u, state.controller.selectedTargetId)) {
    state.controller.selectedTargetId = null;
  }
  emit(state, 'control_switched', { unitId: id, team: u.team });
}

export function cycleControl(state) {
  const pool = state.units.filter((u) => isActive(state, u));
  if (pool.length === 0) return;
  const i = pool.findIndex((u) => u.id === state.controller.controlledId);
  switchControl(state, pool[(i + 1) % pool.length].id);
}

export function selectTarget(state, id) {
  const u = getControlled(state);
  if (!u || !isActive(state, u) || !validHostile(state, u, id)) return;
  state.controller.selectedTargetId = id;
  emit(state, 'target_selected', { targetId: id });
}

export function bindSkillTarget(state, id) {
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  const c = state.controller;
  const t = validHostile(state, u, c.hoverTargetId) || validHostile(state, u, c.selectedTargetId);
  u.skillTargets[id] = t ? t.id : null;
  emit(state, 'skill_bound', { unitId: u.id, abilityId: id, targetId: t ? t.id : null });
}

// 统一瞄准接口：意图已快照进黑板（bb.control），首帧前回退 controller
export const getAim = (state) => getControlled(state)?.blackboard.control?.aim || state.controller.aim;
export function getAimDir(state, u) {
  const a = u.blackboard.control?.aim || state.controller.aim;
  const dx = a.x - u.x, dz = a.z - u.z;
  const d = Math.hypot(dx, dz) || 1;
  return { dx: dx / d, dz: dz / d };
}

// ── Command Queue (RTS shift-queue) ──
// queueMode：'replace' 清空队列；'interleave' 插入队首、保留原队列（SC2 式穿插，per 技能偏好）
// 打断策略（onInterrupt，per 技能）：非 shift 新指令到来时若正在施法 ——
//   'none' 不可打断（默认，新指令排在施法后）| 'drop' 打断丢弃 | 'restart' 打断后重来 | 'resume' 打断后续跑
function suspendAbility(state, u, policy, silent) {
  const a = u.ability;
  if (!silent) emit(state, 'ability_interrupted', { unitId: u.id, abilityId: a.id, policy });
  endAbility(u);
  if (policy === 'drop') return null;
  const params = a.targetId ? { kind: 'unit', targetId: a.targetId, origin: 'explicit' }
    : a.point ? { kind: 'point', x: a.point.x, z: a.point.z }
      : a.dir ? { kind: 'direction', dx: a.dir.dx, dz: a.dir.dz }
        : { kind: 'none' };
  // noGate：续跑/重来不再过门禁（原激活已付过冷却）；resume 携带进度快照
  const cmd = { type: 'ability', id: a.id, source: 'resumed', prof: a.prof, inputTag: a.inputTag, hintId: a.hintId, params, noGate: true };
  if (policy === 'resume') cmd.resume = { stage: a.stage, elapsed: a.elapsed, fired: [...a.fired] };
  return cmd;
}

// 异轨并行直接开火：目标/参数已决议、在射程内（无需接近）→ 立即激活，不进计划队列
function tryStartNow(state, u, cmd) {
  const def = ABILITY_DEFS[cmd.id];
  if (isBlocked(state, u, def) && !cmd.noGate) return false;
  const P = cmd.params;
  if (P.kind === 'unit') {
    const seen = perceivedSnap(u, P.targetId);
    if (!seen || (def.cast?.range && dist2d(u, seen) > def.cast.range)) return false;
    faceToward(u, seen.x, seen.z);
    startAbility(state, u, cmd.id, cmd.source, P.targetId, undefined, undefined, cmd.prof, cmd.hintId, cmd.inputTag);
    return true;
  }
  if (P.kind === 'point') {
    if (def.cast?.range && Math.hypot(P.x - u.x, P.z - u.z) > def.cast.range) return false;
    faceToward(u, P.x, P.z);
    startAbility(state, u, cmd.id, cmd.source, undefined, { x: P.x, z: P.z }, undefined, cmd.prof, cmd.hintId, cmd.inputTag);
    return true;
  }
  if (P.kind === 'direction') {
    u.fx = P.dx; u.fz = P.dz;
    startAbility(state, u, cmd.id, cmd.source, undefined, undefined, { dx: P.dx, dz: P.dz }, cmd.prof, cmd.hintId, cmd.inputTag);
    return true;
  }
  startAbility(state, u, cmd.id, cmd.source, undefined, undefined, undefined, cmd.prof, cmd.hintId, cmd.inputTag);
  return true;
}

function pushCmd(state, u, cmd, shift, queueMode = 'replace') {
  u.anchor = null; // 玩家显式指令作废警戒锚点
  // 计划模式（按住 Z）：只入队不执行、不打断、永不清空 —— 入队位置仍由 per 技能 queueMode 裁决：
  // interleave 插队首；replace/普通指令降级为排队尾（计划里没有"替换"）；显式 Shift 始终排队尾
  if (state.controller.planMode && u.id === state.controller.controlledId) {
    if (u.queue.length >= MAX_QUEUE) { emit(state, 'queue_full', { unitId: u.id, cmd }); return; }
    if (!shift && queueMode === 'interleave') {
      u.queue.unshift(cmd);
      emit(state, 'command_inserted', { unitId: u.id, cmd, queueLen: u.queue.length });
    } else {
      u.queue.push(cmd);
      emit(state, 'command_queued', { unitId: u.id, cmd, queueLen: u.queue.length });
    }
    return;
  }
  // 异轨并行（直接下达）：施法订单与当前计划占用不相交且无需接近 → 立即开火，不动计划队列
  if (!shift && cmd.type === 'ability' && !u.ability && u.queue.length > 0 &&
      !overlap(cmdTracks(cmd), cmdTracks(u.queue[0])) && tryStartNow(state, u, cmd)) {
    return;
  }
  // 容量裁决先于打断：入队注定失败时不得白白打断当前施法（否则 resume/restart 快照直接丢失）
  if ((shift || queueMode === 'interleave') && u.queue.length >= MAX_QUEUE) {
    emit(state, 'queue_full', { unitId: u.id, cmd });
    return;
  }
  let resumeCmd = null;
  // 同轨才打断：占用不相交的新指令与施法并行（如射击中下达移动 —— 施法照常，计划替换）
  if (!shift && u.ability && overlap(cmdTracks(cmd), castTracks(u))) {
    const policy = u.ability.prof?.onInterrupt || 'none';
    if (policy !== 'none') resumeCmd = suspendAbility(state, u, policy);
  }
  if (shift) {
    u.queue.push(cmd);
    emit(state, 'command_queued', { unitId: u.id, cmd, queueLen: u.queue.length });
  } else if (queueMode === 'interleave') {
    u.queue.unshift(cmd);
    if (resumeCmd) u.queue.splice(1, 0, resumeCmd);
    emit(state, 'command_inserted', { unitId: u.id, cmd, queueLen: u.queue.length });
  } else {
    u.queue = resumeCmd ? [cmd, resumeCmd] : [cmd];
    emit(state, 'command_replaced', { unitId: u.id, cmd });
  }
}

export function issueMove(state, x, z, shift) {
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  pushCmd(state, u, { type: 'move', x, z }, shift);
}

export function issueAttack(state, targetId, shift) {
  const u = getControlled(state);
  if (!u || !isActive(state, u) || !validHostile(state, u, targetId)) return;
  pushCmd(state, u, { type: 'attack', targetId }, shift);
}

// A-move（攻击移动）：持续指令 —— 移动 + 沿途接战，清场后继续行进
export function issueAttackMove(state, x, z, shift) {
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  pushCmd(state, u, { type: 'attackmove', x, z }, shift);
}

// 巡逻：持续循环指令（点间往返 + 沿途接战），永不自行完成。连点扩展路线（队尾仍是巡逻时追加路点）
export function issuePatrol(state, x, z) {
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  const last = u.queue[u.queue.length - 1];
  if (last?.type === 'patrol') {
    last.points.push({ x, z });
    emit(state, 'patrol_point_added', { count: last.points.length });
    return;
  }
  pushCmd(state, u, { type: 'patrol', points: [{ x: u.x, z: u.z }, { x, z }], idx: 1 }, false);
}

// 显式切换姿态 = 最高优先级转移（玩家意图永远盖过事件转移）；复合态自动下沉初始叶
export function setStance(state, unitId, stance) {
  const u = getUnit(state, unitId);
  const m = stanceMachineOf(state);
  const leaf = hfsmLeafOf(m, stance);
  if (!u || !m.states[leaf] || u.stance === leaf) return;
  u.stance = leaf;
  u.anchor = null;
  recordEvent(u, 'stance_changed', { stance: leaf, source: 'manual' }, state.time);
  emit(state, 'stance_changed', { unitId: u.id, stance: leaf, source: 'manual' });
}

// 受迫打断缺省声明（技能可用 def.interrupt 覆盖）：缺省触发 = 冻结标签（FREEZE_TAGS）
const DEFAULT_INTERRUPT = { by: FREEZE_TAGS, policy: 'drop' };

// 候选偏好：技能默认 + 候选级 selector 覆盖（内联或 {ref} 资产引用 ——
// 姿态内建 utility 与 Utility 资产库 selectors 区打通的入口；引擎三处消费统一走这里）
function candPrefs(state, cand) {
  const prof = { ...getPrefs(state, cand.ability) };
  if (cand.selector) prof.selector = cand.selector;
  return prof;
}

// autocast 候选取目标（只读黑板键）：'seen' 读 bb.perceived 走选目标 graph；
// 'damaged' 读 bb.lastHit（受击传感器）—— 还击窗口内且攻击者仍在 bb.perceived，且过硬门
function autocastTarget(state, u, cand) {
  if (cand.trigger === 'damaged') {
    const h = u.blackboard.lastHit;
    if (!h || state.time - h.at > (cand.within ?? RETALIATE_WINDOW)) return null;
    const snap = u.blackboard.perceived.find((s) => s.id === h.by);
    if (!snap || snap.team === u.team) return null;
    // 还击目标同样过候选 selector 硬门（与 seen 路径同一套选目标语义）
    const prof = candPrefs(state, cand);
    const sel = resolveSelector(prof.selector, state.selectorAssets);
    if (sel && !evaluateSelector([snap], sel, { self: u, range: ABILITY_DEFS[cand.ability].cast?.range || ATTACK_RANGE })) return null;
    return snap;
  }
  return getAutoTarget(state, u, candPrefs(state, cand));
}

// ── 姿态行为图执行上下文（GraphVM ctx）──
// 统一知识层词汇（bb/mem/ws/beliefs，labGraphCtx）+ 实验室决策原语门面（ctx.lab）。
// 图节点只能经这组词汇触碰世界；每单位缓存一份（0GC），time 每 tick 刷新。
function stanceCtxOf(state, u) {
  if (!u._stanceCtx) {
    const base = labGraphCtx(state, u, null);
    base.lab = {
      // 执行闸门：无施法且队列空=可自主接战；无施法但队列非空=可异轨并行出手
      gates: () => ({ idle: !u.ability && u.queue.length === 0, busyQueue: !u.ability && u.queue.length > 0 }),
      // 锚点归位（警戒缰绳脱战后的「返回」）：归位途中抑制接战
      anchorReturn: (dt) => {
        if (!u.ability && u.queue.length === 0 && u.anchor) {
          if (!moveToward(u, u.anchor.x, u.anchor.z, dt)) return 'returning';
          u.anchor = null;
          emit(state, 'guard_returned', { unitId: u.id });
        }
        return 'idle';
      },
      // 候选索敌：'seen' 走选目标 graph；'damaged' 读受击黑板（还击窗口内攻击者在感知内且过硬门）
      candTarget: (cand) => {
        const t = autocastTarget(state, u, cand);
        return t ? { found: true, target: t, dist: dist2d(u, t) } : { found: false, target: null, dist: -1 };
      },
      range: (aid) => ABILITY_DEFS[aid]?.cast?.range || ATTACK_RANGE,
      // 转移条件蓝图词汇（只读事实，无副作用）：锚点信息 / 当前姿态有效缰绳
      anchor: () => (u.anchor ? { has: true, dist: dist2d(u, u.anchor) } : { has: false, dist: 0 }),
      stanceLeash: () => stanceMachineOf(state).states[u.stance]?.leash || 0,
      // 接战：产标准 attack 指令进队列（AI 与玩家共用管道），leash>0 落锚
      engage: (cand, tgt, leash) => {
        if (leash > 0 && !u.anchor) u.anchor = { x: u.x, z: u.z };
        u.queue.push({ type: 'attack', targetId: tgt.id, auto: true, ability: cand.ability, selector: cand.selector });
        emit(state, 'autocast_engaged', { unitId: u.id, ability: cand.ability, targetId: tgt.id, stance: u.stance, trigger: cand.trigger });
      },
      // 异轨并行出手：候选轨道与计划队首不相交、目标已在射程内 → 原地施法，不追击、不动计划
      tryParallel: (cand) => {
        if (u.ability || u.queue.length === 0) return false;
        if (overlap(abilityTracks(cand.ability), cmdTracks(u.queue[0]))) return false;
        const tgt = autocastTarget(state, u, cand);
        if (!tgt) return false;
        const rng = ABILITY_DEFS[cand.ability].cast?.range || ATTACK_RANGE;
        if (dist2d(u, tgt) > rng) return false;
        if (isBlocked(state, u, ABILITY_DEFS[cand.ability])) return false;
        const prof = candPrefs(state, cand);
        const psel = resolveSelector(prof.selector, state.selectorAssets);
        if (psel && !evaluateSelector([tgt], psel, { self: u, range: rng })) return false;
        faceToward(u, tgt.x, tgt.z);
        startAbility(state, u, cand.ability, 'autocast', tgt.id, undefined, undefined, prof);
        emit(state, 'autocast_engaged', { unitId: u.id, ability: cand.ability, targetId: tgt.id, stance: u.stance, trigger: cand.trigger, parallel: true });
        return true;
      },
    };
    u._stanceCtx = base;
  }
  u._stanceCtx.time = state.time;
  return u._stanceCtx;
}

// 转移条件求值：条件 = 条件蓝图（GraphDef/模板名），GraphVM 同步求值 ——
// success 且 flow.exit 输出真值 = 命中（与 fsm.js 统一 FSM 运行时同一语义）。
// 多条件数组 = AND。未知模板名 = 不命中（条件蓝图缺失时显式不转移，不做隐式兜底）。
function stanceCondHit(state, u, names) {
  const lib = state.tplLib;
  if (!lib) return false;
  return names.every((n) => {
    const tpl = lib.templates[n];
    if (!tpl) return false;
    const r = obtainRun(tpl.compiled);
    startRun(r, {});
    const st = tickRun(r, stanceCtxOf(state, u), 0);
    const ok = st === 'success' && !!r.output;
    releaseRun(r);
    return ok;
  });
}

export function stopUnit(state) {
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  u.queue = [];
  u.buffer = [];
  if (u.ability) {
    emit(state, 'ability_cancelled', { unitId: u.id, abilityId: u.ability.id });
    endAbility(u);
  }
  emit(state, 'stopped', { unitId: u.id });
}

// ── Targeting ──
export function getPrefs(state, id) {
  return state.prefs?.[id] || ABILITY_DEFS[id].cast || {};
}

function faceToward(u, x, z) {
  const dx = x - u.x, dz = z - u.z;
  const d = Math.hypot(dx, dz);
  if (d > 0.01) { u.fx = dx / d; u.fz = dz / d; }
}

// ── 传感器阶段（每 tick 先行）：视野/记忆传感器写 bb.perceived / bb.memory ──
const dist2d = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const distToSegment = (a, b, p) => {
  const dx = b.x - a.x, dz = b.z - a.z;
  const L2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2));
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t));
};

function runSensors(state) {
  for (const u of state.units) {
    const bb = u.blackboard;
    if (!isActive(state, u)) { bb.perceived = []; bb.memory = {}; continue; }
    bb.perceived = [];
    for (const v of state.units) {
      if (v === u) continue; // 敌我皆感知（阵营过滤在使用侧按 targetFilter 声明）
      if (dist2d(u, v) > u.sight) continue;
      if (isActive(state, v)) {
        const snap = { id: v.id, team: v.team, x: v.x, z: v.z, health: v.health, maxHealth: v.maxHealth, tags: effectiveTags(v, state.time), seenAt: state.time };
        bb.perceived.push(snap);
        bb.memory[v.id] = snap;
      } else {
        delete bb.memory[v.id]; // 亲眼所见失效 → 记忆立即作废
      }
    }
    for (const [id, snap] of Object.entries(bb.memory)) {
      if (state.time - snap.seenAt > MEMORY_TTL) delete bb.memory[id];
    }
    // 统一知识层镜像（BB/Mem/WS/Belief）—— 传感器阶段末尾同步一次
    syncKnowledge(u, state);
  }
}

const perceivedSnap = (u, id) => (id ? u.blackboard.perceived.find((s) => s.id === id) || null : null);
const isPerceived = (u, id) => !!perceivedSnap(u, id);

// 悬停对象（黑板意图快照）——必须在该单位感知快照内才有效
function hoveredPerceived(u) {
  return perceivedSnap(u, u.blackboard.control?.hoverId);
}

// 自动取目标 = 选目标 graph 求值（targetSelector.js）：候选源（感知快照 ∩ acquireRange）是引擎固定的，
// 硬过滤 + utility 曲线是数据（prof.selector）；悬停施法时评分换 aimDistance（意图胜过 utility），硬过滤照常生效
function autoSelection(state, u, prof) {
  const range = prof.acquireRange;
  if (!range) return null;
  const okF = factionOk(u, prof);
  const cands = u.blackboard.perceived.filter((s) => okF(s) && dist2d(u, s) <= range);
  const hov = prof.hoverCast ? hoveredPerceived(u) : null;
  if (hov && okF(hov) && !cands.includes(hov)) cands.push(hov);
  const base = resolveSelector(prof.selector, state.selectorAssets) || defaultSelector(prof.acquirePick);
  const aim = u.blackboard.control?.aim;
  const sel = prof.hoverCast && aim ? { filters: base.filters, considerations: AIM_CONSIDERATIONS } : base;
  return { cands, sel, ctx: { self: u, aim, range } };
}

export function getAutoTarget(state, u, prof) {
  const a = autoSelection(state, u, prof);
  return a ? evaluateSelector(a.cands, a.sel, a.ctx) : null;
}

// 调试视图：每个候选的 utility 总分/分量/是否被硬过滤（评分面板用）
export function getAutoScores(state, u, prof) {
  const a = autoSelection(state, u, prof);
  return a ? scoreCandidates(a.cands, a.sel, a.ctx) : [];
}

// 候选决议（unit 模式）：悬停 > per 技能绑定 > 全局选中（explicit）> 自动取目标（auto）
function resolveTarget(state, u, abilityId, prof) {
  const okF = factionOk(u, prof);
  if (prof.hoverCast) {
    const h = hoveredPerceived(u);
    if (h && okF(h)) return { snap: h, origin: 'explicit' };
  }
  const bound = perceivedSnap(u, u.skillTargets?.[abilityId]);
  if (bound && okF(bound)) return { snap: bound, origin: 'explicit' };
  const sel = perceivedSnap(u, u.blackboard.control?.selectedId);
  if (sel && okF(sel)) return { snap: sel, origin: 'explicit' };
  const auto = prof.autoAcquire ? getAutoTarget(state, u, prof) : null;
  return auto ? { snap: auto, origin: 'auto' } : null;
}

// 首个触发效果的目标需求：'unit' = payload 必须要求对象；其余可降级为点
// beam 通道逐 tick 作用于对象，不走时间线 —— 本身即'unit'需求（否则空时间线被误判为无需目标）
const firstEffectNeeds = (def) => {
  const s = def.stages[0];
  if (s.beam) return 'unit';
  return EFFECT_META[s.timeline[0]?.effect.type]?.needs || 'none';
};

// 构建施法指令：所有参数（含方向）在此刻决议快照进 cmd.params —— 执行期不回读 controller
function buildAbilityCmd(state, u, id, source, inputTag, forceTargetId) {
  const def = ABILITY_DEFS[id];
  const prof = { ...getPrefs(state, id) };
  const cmd = { type: 'ability', id, source, prof, inputTag, params: { kind: 'none' } };
  if (def.cast?.targeted) {
    cmd.hintId = hoveredPerceived(u)?.id || null;
    // 显式指定目标（确认层点击 / 上下文路由）：阵营匹配且在感知快照内 → 直接定格
    if (forceTargetId) {
      const fs = perceivedSnap(u, forceTargetId);
      if (fs && factionOk(u, prof)(fs)) {
        cmd.params = { kind: 'unit', targetId: fs.id, origin: 'explicit' };
        return cmd;
      }
    }
    const mode = prof.targetMode || 'unit';
    if (rebindOf(prof, 'direction') === 'tick' && def.cast.channel) {
      // steerable 通道：执行期实时读 controller.aim（引导原型的合法例外），下达时只快照初始方向
      const d = getAimDir(state, u);
      cmd.params = { kind: 'direction', dx: d.dx, dz: d.dz };
    } else if (mode === 'unit') {
      const r = resolveTarget(state, u, id, prof);
      if (r) {
        cmd.params = { kind: 'unit', targetId: r.snap.id, origin: r.origin };
      } else if (firstEffectNeeds(def) === 'unit') {
        emit(state, 'needs_unit_drop', { unitId: u.id, abilityId: id });
        return null;
      } else {
        const a = getAim(state);
        cmd.params = { kind: 'point', x: a.x, z: a.z };
        emit(state, 'point_fallback', { abilityId: id });
      }
    } else if (mode === 'point') {
      const a = getAim(state);
      cmd.params = { kind: 'point', x: a.x, z: a.z };
    } else {
      const d = getAimDir(state, u);
      cmd.params = { kind: 'direction', dx: d.dx, dz: d.dz };
    }
  }
  return cmd;
}

export function orderAbility(state, id, shift, source, inputTag, forceTargetId) {
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  const cmd = buildAbilityCmd(state, u, id, source, inputTag, forceTargetId);
  if (cmd) pushCmd(state, u, cmd, shift, cmd.prof.queueMode);
}

// ── ③确认层（Arming）──
// castMode 声明 commit 边沿：instant=按下 | onRelease=抬起 | confirm=下一次点击。
// Armed 态是 controller 层状态（场景画指示器预览），commit 前不进入缓冲/队列/引擎。
export function cancelPending(state, reason) {
  const p = state.controller.pending;
  if (!p) return;
  state.controller.pending = null;
  emit(state, 'cast_cancelled', { abilityId: p.id, reason });
}

export function commitPending(state, override = {}) {
  const p = state.controller.pending;
  if (!p) return;
  state.controller.pending = null;
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  if (override.aim) {
    // 确认瞬间的点击点即施法参数：同步进意图快照（commit 时刻定格）
    state.controller.aim = { ...override.aim };
    if (u.blackboard.control) u.blackboard.control.aim = { ...override.aim };
  }
  emit(state, 'cast_committed', { abilityId: p.id });
  dispatchOrder(state, u, p.id, p.inputTag, override.targetId);
}

// ── 上下文路由（Input.Smart：RTS 右键 / 开放世界万能交互键）──
// 同一输入按 [目标关系 × 自身标签 × 目标状态] 查声明式路由表，动态决议出真正指令。
export function smartOrder(state, pick, shift) {
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  const t = pick.targetId && pick.targetId !== u.id ? getUnit(state, pick.targetId) : null;
  const live = t && isActive(state, t) ? t : null;
  const ctx = {
    targetKind: live ? (live.team === u.team ? 'ally' : 'enemy') : 'ground',
    selfTags: effectiveTags(u, state.time),
    targetTags: live ? effectiveTags(live, state.time) : [],
    targetHpRatio: live ? live.health / live.maxHealth : 1,
  };
  // 路由表 = RouteTable 库中资产（载入时注入 state.routes）—— 无内置兜底，未注入即不路由
  const route = resolveRoute(state.routes?.['Input.Smart'], ctx);
  if (!route) return;
  emit(state, 'smart_routed', { unitId: u.id, kind: ctx.targetKind, decision: route.type, ability: route.ability });
  if (route.type === 'move') {
    const x = pick.x ?? live?.x, z = pick.z ?? live?.z;
    if (x != null) issueMove(state, x, z, shift);
  } else if (route.type === 'attack') {
    issueAttack(state, live.id, shift);
  } else if (route.type === 'follow') {
    pushCmd(state, u, { type: 'follow', targetId: live.id }, shift);
  } else if (route.type === 'ability') {
    orderAbility(state, route.ability, shift, 'smart', null, live?.id);
  }
}

// ── Ability activation (tag-gated) ──
function startAbility(state, u, id, source, targetId, point, dir, prof, hintId, inputTag, resume) {
  const def = ABILITY_DEFS[id];
  // inputTag：激活该施法的输入 —— release 路由的依据；排队/缓冲激活时输入若早已松开，引导自然走完全程
  // resume：打断挂起的进度快照（onInterrupt:'resume'）—— 从中断处续跑，不重付冷却
  const st = resume?.stage ?? 0;
  u.ability = { id, stage: st, elapsed: resume?.elapsed ?? 0, fired: resume ? [...resume.fired] : [], comboQueued: false, targetId, point, dir, prof, hintId, inputTag };
  u.tags = [...def.stages[st].grantedTags];
  if (def.cooldown && !resume) grantTimedTag(u, `Cooldown.${id}`, state.time + def.cooldown);
  recordEvent(u, 'ability_cast', { id, source }, state.time);
  emit(state, 'ability_activated', { unitId: u.id, abilityId: id, source });
}

function endAbility(u) {
  u.ability = null;
  u.tags = [];
}

// ── 输入分派 ──
// 设备层已把物理输入翻译成 InputTag；这里只认 InputTag（键盘/按钮/摇杆同一入口）。
export function pressInput(state, inputTag, config, shift) {
  if (config) state.config = config;
  const c = state.controller;
  if (!c.heldInputs.includes(inputTag)) c.heldInputs.push(inputTag);
  const act = ACTION_BINDINGS[inputTag];
  if (!act) return;
  if (act.action === 'cancel') { c.pendingOrder = null; cancelPending(state, '手动取消'); return; }
  if (act.action === 'stop') { c.pendingOrder = null; cancelPending(state, '停止'); stopUnit(state); return; }
  if (act.action === 'attackmove') {
    // A-move 待确认：下一次点击地面 = 下达攻击移动（controller 层状态，同 Armed 态思路）
    cancelPending(state, 'A-move');
    c.pendingOrder = 'attackmove';
    emit(state, 'attackmove_armed', {});
    return;
  }
  if (act.action === 'patrol') {
    cancelPending(state, '巡逻');
    c.pendingOrder = 'patrol';
    emit(state, 'patrol_armed', {});
    return;
  }
  if (act.action === 'plan') {
    // 计划模式（RA2 路径点计划）：按住期间指令强制入队且执行冻结，松开按序执行
    if (!c.planMode) { c.planMode = true; emit(state, 'plan_started', {}); }
    return;
  }
  if (act.action !== 'order') return;
  const u = getControlled(state);
  if (!u || !isActive(state, u)) return;
  const id = act.ability;
  const def = ABILITY_DEFS[id];
  const a = u.ability;

  if (shift) {
    orderAbility(state, id, true, 'from-queue', inputTag);
    return;
  }

  // Combo continuation
  if (a && a.id === id && def.stages.length > 1 && a.stage < def.stages.length - 1) {
    const win = def.stages[a.stage].comboWindow;
    if (win && a.elapsed >= win.open && a.elapsed <= win.close) {
      if (!a.comboQueued) {
        a.comboQueued = true;
        emit(state, 'combo_queued', { abilityId: id, stage: a.stage + 2 });
      }
      return;
    }
  }

  // ③确认层：castMode ≠ instant → 按下只进入待确认态（commit 边沿由模式声明；Shift 直排队绕过确认）
  const mode = getPrefs(state, id).castMode || 'instant';
  if (mode !== 'instant') {
    if (c.pending && c.pending.id !== id) cancelPending(state, '切换技能');
    c.pending = { id, inputTag };
    emit(state, 'cast_armed', { unitId: u.id, abilityId: id, mode });
    return;
  }
  if (c.pending) cancelPending(state, '切换技能');
  dispatchOrder(state, u, id, inputTag);
}

// ⑤裁决入口：确认后的施法请求统一走这里（门禁 → 立即下达 / 进缓冲）
function dispatchOrder(state, u, id, inputTag, forceTargetId) {
  const busy = u.ability && overlap(abilityTracks(id), castTracks(u)); // 同轨施法中 = 结构性互斥
  if (!busy && !isBlocked(state, u, ABILITY_DEFS[id])) {
    orderAbility(state, id, false, 'instant', inputTag, forceTargetId);
    return;
  }
  const cap = state.config?.bufferSize ?? 3;
  if (u.buffer.length >= cap) {
    emit(state, 'buffer_full_drop', { unitId: u.id, abilityId: id });
    return;
  }
  u.buffer.push({ key: id, at: state.time, inputTag, forceTargetId });
  emit(state, 'input_buffered', { abilityId: id });
}

// release 语义不在绑定表里：匹配"激活当前施法的 InputTag"，按技能引导原型路由
export function releaseInput(state, inputTag) {
  const c = state.controller;
  c.heldInputs = c.heldInputs.filter((t) => t !== inputTag);
  if (ACTION_BINDINGS[inputTag]?.action === 'plan' && c.planMode) {
    c.planMode = false;
    emit(state, 'plan_executed', { count: getControlled(state)?.queue.length || 0 });
    return;
  }
  // ③确认层：onRelease 模式的 commit 边沿
  const p = c.pending;
  if (p && p.inputTag === inputTag && getPrefs(state, p.id).castMode === 'onRelease') {
    commitPending(state);
    return;
  }
  const u = getControlled(state);
  const a = u?.ability;
  if (!a || a.inputTag !== inputTag) return;
  const kind = ABILITY_DEFS[a.id].cast?.channel;
  if (kind === 'repeat') {
    // 松开 = 打完当前轮后停止（非立即中断）
    if (!a.released) {
      a.released = true;
      emit(state, 'repeat_released', { unitId: u.id, abilityId: a.id });
    }
  } else if (a.prof?.hold) {
    // burst（可配 hold）/ beam：松开立即结束
    emit(state, 'channel_released', { unitId: u.id, abilityId: a.id, elapsed: a.elapsed });
    endAbility(u);
  }
}

function fireEvent(state, ev, caster) {
  const a = caster.ability;
  let target = null;
  if (a.targetId) {
    const t = getUnit(state, a.targetId);
    if (t && isPerceived(caster, t.id)) target = t; // 感知快照内才可作用
  }
  // 追踪吸附 = 效果层补正：无对象参数且开启追踪时，吸附到施法瞬间快照的悬停对象
  if (!target && a.prof?.track && a.hintId) {
    const hint = getUnit(state, a.hintId);
    if (hint && isPerceived(caster, hint.id)) {
      target = hint;
      if (!a._snapLogged) {
        a._snapLogged = true;
        emit(state, 'track_snapped', { abilityId: a.id, targetId: hint.id });
      }
    }
  }
  executeEffect(state, caster, ev.effect, {
    abilityId: a.id,
    prof: a.prof,
    target,
    point: a.point || null,
  });
}

// ── Tick ──
function tickUnit(state, u, dt, config) {
  // 0. 受迫打断（tag 语义）：打断者只打标签；引擎每 tick 检查执行中技能的持续条件（interrupt.by 过滤器）。
  //    善后与主动打断共用同一策略词（drop/restart/resume），汇合在 suspendAbility 一个出口。
  const ccTags = effectiveTags(u, state.time);
  if (u.ability) {
    const itr = ABILITY_DEFS[u.ability.id].interrupt || DEFAULT_INTERRUPT;
    const hitTag = itr.by.find((t) => ccTags.includes(t));
    if (hitTag) {
      emit(state, 'forced_interrupt', { unitId: u.id, abilityId: u.ability.id, policy: itr.policy, tag: hitTag });
      const rc = suspendAbility(state, u, itr.policy, true);
      if (rc) u.queue.unshift(rc);
    }
  }
  // 硬控 = 执行槽整体冻结：不施法、不走队列、不弹缓冲（缓冲窗口照常流逝）。冻结标签是数据（FREEZE_TAGS）
  if (FREEZE_TAGS.some((t) => ccTags.includes(t))) return;

  // 1. Active ability
  if (u.ability) {
    const a = u.ability;
    const def = ABILITY_DEFS[a.id];
    const stage = def.stages[a.stage];
    a.elapsed += dt;
    // steerable 通道：黑板有意图快照（bb.control）时逐帧面向瞄准点 —— 不直接读 controller
    const steering = rebindOf(a.prof, 'direction') === 'tick' && def.cast?.channel && !!u.blackboard.control;
    if (steering) {
      const d = getAimDir(state, u);
      u.fx = d.dx; u.fz = d.dz;
    } else if (a.targetId && a.prof?.track) {
      const s = perceivedSnap(u, a.targetId);
      if (s) faceToward(u, s.x, s.z);
    }
    stage.timeline.forEach((ev, i) => {
      if (a.elapsed >= ev.t && !a.fired.includes(i)) {
        a.fired.push(i);
        fireEvent(state, ev, u);
      }
    });
    // beam：逐 tick 连续作用 —— 目标实时追踪（感知快照），失联可重取，脱离范围则光束中断不伤害
    if (stage.beam && steering) {
      // 跟随鼠标：光束=朝瞄准方向的射线，命中线段附近（感知快照内）的所有敌人
      const len = stage.beam.range || 6;
      a.beamPoint = { x: u.x + u.fx * len, z: u.z + u.fz * len };
      a.beamAcc = (a.beamAcc || 0) + dt;
      while (a.beamAcc >= stage.beam.tick) {
        a.beamAcc -= stage.beam.tick;
        for (const s of u.blackboard.perceived) {
          if (s.team !== u.team && distToSegment(u, a.beamPoint, s) < 0.6) {
            const t = getUnit(state, s.id);
            if (t && isActive(state, t)) applyDamage(state, t, stage.beam.damagePerTick, a.id, u.id);
          }
        }
      }
    } else if (stage.beam) {
      let snap = perceivedSnap(u, a.targetId);
      if (!snap && rebindOf(a.prof, 'target') === 'onInvalid') {
        const t2 = getAutoTarget(state, u, a.prof);
        if (t2) { a.targetId = t2.id; snap = t2; }
      }
      if (snap && dist2d(u, snap) <= (stage.beam.range || Infinity)) {
        faceToward(u, snap.x, snap.z);
        a.beamPoint = { x: snap.x, z: snap.z };
        a.beamAcc = (a.beamAcc || 0) + dt;
        while (a.beamAcc >= stage.beam.tick) {
          a.beamAcc -= stage.beam.tick;
          const t = getUnit(state, a.targetId);
          if (t && isActive(state, t)) applyDamage(state, t, stage.beam.damagePerTick, a.id, u.id);
        }
      } else {
        a.beamPoint = null;
        a.beamAcc = 0;
      }
    }
    if (!isActive(state, u)) return;
    if (a.elapsed >= stage.duration) {
      if (a.comboQueued && a.stage < def.stages.length - 1) {
        a.stage++;
        a.elapsed = 0;
        a.fired = [];
        a.comboQueued = false;
        u.tags = [...def.stages[a.stage].grantedTags];
        emit(state, 'stage_advanced', { abilityId: a.id, stageName: def.stages[a.stage].name });
      } else if (
        def.cast?.channel === 'repeat' && !a.released && a.inputTag &&
        u.blackboard.control?.held.includes(a.inputTag)
      ) {
        // repeat：按住期间每轮都是一次全新的微型目标决议
        let tid;
        let ok = true;
        if (def.cast?.targeted && rebindOf(a.prof, 'direction') !== 'tick' && (a.prof.targetMode || 'unit') === 'unit') {
          const r = resolveTarget(state, u, a.id, a.prof);
          if (r) { tid = r.snap.id; faceToward(u, r.snap.x, r.snap.z); }
          else if (firstEffectNeeds(def) === 'unit') ok = false;
        }
        if (ok) {
          a.elapsed = 0;
          a.fired = [];
          a.targetId = tid;
          a._snapLogged = false;
          a.hintId = hoveredPerceived(u)?.id || null;
          emit(state, 'cycle_repeated', { unitId: u.id, abilityId: a.id, targetId: tid });
        } else {
          emit(state, 'ability_ended', { unitId: u.id, abilityId: a.id });
          endAbility(u);
        }
      } else {
        emit(state, 'ability_ended', { unitId: u.id, abilityId: a.id });
        endAbility(u);
      }
    }
  }

  // 2. Input buffer（解锁时构建指令，按该技能 queueMode 入队 —— 与直接按键语义一致）
  u.buffer = u.buffer.filter((b) => {
    if (state.time - b.at > config.bufferWindow) {
      emit(state, 'buffer_expired', { abilityId: b.key });
      return false;
    }
    return true;
  });
  if (u.buffer.length > 0) {
    const next = u.buffer[0];
    if (!isBlocked(state, u, ABILITY_DEFS[next.key]) && !(u.ability && overlap(abilityTracks(next.key), castTracks(u)))) {
      u.buffer.shift();
      const bc = buildAbilityCmd(state, u, next.key, 'from-buffer', next.inputTag, next.forceTargetId);
      if (bc) pushCmd(state, u, bc, false, bc.prof.queueMode);
    }
  }

  // 2.5 姿态 HFSM：复合态自动下沉初始叶；事件驱动转移沿祖先链冒泡（damaged 读 bb.lastHit；
  //     显式 setStance = 最高优先级转移）
  const machine = stanceMachineOf(state);
  if (!machine.states[u.stance]?.isLeaf) {
    const leaf = hfsmLeafOf(machine, u.stance);
    u.stance = machine.states[leaf]?.isLeaf ? leaf : hfsmLeafOf(machine, machine.initial);
  }
  const hit = u.blackboard.lastHit;
  if (hit && hit.at > (u._stanceHitSeen ?? -1)) {
    u._stanceHitSeen = hit.at;
    const to = stanceEvent(machine, u.stance, 'damaged');
    if (to && to !== u.stance) {
      u.stance = to;
      recordEvent(u, 'stance_changed', { stance: to, source: 'transition' }, state.time);
      emit(state, 'stance_changed', { unitId: u.id, stance: to, source: 'transition' });
    }
  }

  // 2.55 条件转移：转移条件 = 条件蓝图（GraphVM 求值），叶→祖先冒泡，首条命中即转移 ——
  //      子状态流转（Idle→索敌→接战→返回）由蓝图上的转移数据 + 条件图驱动，无硬编码分支
  if (state.tplLib) {
    let cp = u.stance;
    condLoop: for (let g = 0; cp && g < 16; g++) {
      const cst = machine.states[cp];
      if (!cst) break;
      for (const t of cst.transitions || []) {
        if (!t.cond || !stanceCondHit(state, u, t.cond)) continue;
        const to = hfsmLeafOf(machine, t.to);
        if (machine.states[to] && to !== u.stance) {
          u.stance = to;
          recordEvent(u, 'stance_changed', { stance: to, source: 'condition' }, state.time);
          emit(state, 'stance_changed', { unitId: u.id, stance: to, source: 'condition' });
        }
        break condLoop;
      }
      cp = cst.parent;
    }
  }

  // 2.6 姿态行为 = 叶状态行为图实执行（GraphVM）：锚点归位 / 自主接战 / 异轨并行全部以
  //     图节点表达（判定链=图结构，候选/缰绳=图参数，改配置即改图）；图只产标准 order
  //     进队列 —— 追击/脱战/缰绳退战仍由 order 管道按该姿态有效配置执行（决策与实现分离）。
  //     同步完成的图每 tick 从池重取（0GC）；含异步节点的手编图跨 tick 挂起恢复。
  //     模板库（tplLib）未载入 = 资产载入中，不执行；载入后图资产缺失 = 显式抛错（无生成兜底）。
  const leafSt = machine.states[u.stance];
  if (leafSt?.isLeaf && state.tplLib) {
    if (u._stanceRunKey !== u.stance) {
      if (u._stanceRun) { releaseRun(u._stanceRun); u._stanceRun = null; }
      u._stanceRunKey = u.stance;
    }
    const compiled = stanceBehaviorOf(leafSt, state.tplLib?.resolve);
    if (!u._stanceRun) {
      u._stanceRun = obtainRun(compiled);
      startRun(u._stanceRun, leafSt.behaviorInputs || undefined);
    }
    const bst = tickRun(u._stanceRun, stanceCtxOf(state, u), dt);
    if (bst !== 'running') { releaseRun(u._stanceRun); u._stanceRun = null; }
  }

  // 3. 计划队列（顺序性属于计划，并行性属于轨道）：队首与施法占用轨道相交才等待
  if (u.queue.length === 0) return;
  if (u.ability && (overlap(cmdTracks(u.queue[0]), castTracks(u)) || u.queue[0].type === 'ability')) return;
  // 计划模式：按住 Z 期间受控单位队列冻结（布置计划），松开统一执行
  if (state.controller.planMode && u.id === state.controller.controlledId) return;

  const cmd = u.queue[0];
  if (cmd.type === 'ability') {
    const def = ABILITY_DEFS[cmd.id];
    const prof = cmd.prof;
    if (isBlocked(state, u, def) && !cmd.noGate) return; // 冷却中：原地等待队首解锁（续跑/重来免门禁）
    const P = cmd.params;

    if (P.kind === 'unit') {
      const seen = perceivedSnap(u, P.targetId);
      if (seen) {
        const d = dist2d(u, seen);
        if (def.cast?.range && d > def.cast.range) {
          if (prof.approach) {
            if (!cmd._approaching) { cmd._approaching = true; emit(state, 'approach_started', { abilityId: cmd.id, ref: ` ${seen.id} ` }); }
            moveToward(u, seen.x, seen.z, dt);
            return;
          }
          u.queue.shift();
          emit(state, 'out_of_range_drop', { unitId: u.id, abilityId: cmd.id });
          return;
        }
        u.queue.shift();
        faceToward(u, seen.x, seen.z);
        startAbility(state, u, cmd.id, cmd.source || 'from-queue', P.targetId, undefined, undefined, prof, cmd.hintId, cmd.inputTag, cmd.resume);
        return;
      }
      // 不可见：追往记忆快照（最后目击点）；到达仍不见 → 记忆作废
      const mem = u.blackboard.memory[P.targetId];
      if (mem && prof.approach) {
        if (!cmd._chasingMemory) { cmd._chasingMemory = true; emit(state, 'memory_chase', { abilityId: cmd.id, targetId: P.targetId }); }
        if (!moveToward(u, mem.x, mem.z, dt)) return;
        delete u.blackboard.memory[P.targetId];
      }
      // 目标失效：重决议（自动来源 + 偏好开）→ 降级点施（payload 不要求对象）→ 丢弃
      if (P.origin === 'auto' && rebindOf(prof, 'target') === 'onInvalid') {
        const t2 = getAutoTarget(state, u, prof);
        if (t2) {
          P.targetId = t2.id;
          delete cmd._chasingMemory;
          emit(state, 'reacquired', { abilityId: cmd.id, targetId: t2.id });
          return;
        }
      }
      if (firstEffectNeeds(def) !== 'unit' && mem) {
        cmd.params = { kind: 'point', x: mem.x, z: mem.z };
        emit(state, 'point_fallback', { abilityId: cmd.id });
        return;
      }
      u.queue.shift();
      emit(state, 'target_lost', { unitId: u.id, abilityId: cmd.id });
      return;
    }

    if (P.kind === 'point') {
      const d = Math.hypot(P.x - u.x, P.z - u.z);
      if (def.cast?.range && d > def.cast.range && prof.approach) {
        if (!cmd._approaching) { cmd._approaching = true; emit(state, 'approach_started', { abilityId: cmd.id, ref: '目标点' }); }
        moveToward(u, P.x, P.z, dt);
        return;
      }
      u.queue.shift();
      faceToward(u, P.x, P.z);
      startAbility(state, u, cmd.id, cmd.source || 'from-queue', undefined, { x: P.x, z: P.z }, undefined, prof, cmd.hintId, cmd.inputTag, cmd.resume);
      return;
    }

    if (P.kind === 'direction') {
      // 方向 = 下达瞬间的快照（跨设备：鼠标/摇杆统一经 controller.aim 决议）
      u.queue.shift();
      u.fx = P.dx; u.fz = P.dz;
      startAbility(state, u, cmd.id, cmd.source || 'from-queue', undefined, undefined, { dx: P.dx, dz: P.dz }, prof, cmd.hintId, cmd.inputTag, cmd.resume);
      return;
    }

    // 无参数（自身型）
    u.queue.shift();
    startAbility(state, u, cmd.id, cmd.source || 'from-queue', undefined, undefined, undefined, prof, cmd.hintId, cmd.inputTag, cmd.resume);
  } else if (cmd.type === 'attackmove') {
    // A-move：持续指令 = 移动 + 沿途接战（A-move 本身就是接战意图，不看姿态）。
    // 接战技能来自指令声明（cmd.ability），未声明兜底 DEFAULT_ATTACK —— 候选走该技能的选目标 graph
    const aid = cmd.ability || DEFAULT_ATTACK;
    const tgt = getAutoTarget(state, u, { ...getPrefs(state, aid) });
    if (tgt) {
      if (dist2d(u, tgt) > (ABILITY_DEFS[aid].cast?.range || ATTACK_RANGE)) { moveToward(u, tgt.x, tgt.z, dt); return; }
      if (!isBlocked(state, u, ABILITY_DEFS[aid])) {
        faceToward(u, tgt.x, tgt.z);
        startAbility(state, u, aid, 'autocast', tgt.id, undefined, undefined, { ...getPrefs(state, aid) });
      }
      return;
    }
    if (moveToward(u, cmd.x, cmd.z, dt)) {
      u.queue.shift();
      emit(state, 'attackmove_arrived', { unitId: u.id, x: cmd.x, z: cmd.z });
    }
  } else if (cmd.type === 'patrol') {
    // 巡逻：循环持续指令 —— 路点间往返 + 沿途接战，永不自行完成。
    // 接战性格由姿态声明（与文档一致）：候选来自姿态 autocast（含 damaged 还击触发），
    // chase=false 射程外不接战、超出缰绳即放弃追击回巡逻路线；HoldFire 巡逻 = 只走路不接战。
    const stDef = stanceMachineOf(state).states[u.stance];
    let cand = null, tgt = null;
    for (const c of stDef?.autocast || []) {
      const t = autocastTarget(state, u, c);
      if (t) { cand = c; tgt = t; break; }
    }
    const rng = cand ? (ABILITY_DEFS[cand.ability].cast?.range || ATTACK_RANGE) : ATTACK_RANGE; // 射程投影：候选技能 cast.range
    const far = tgt ? dist2d(u, tgt) > rng : false;
    const overLeash = stDef?.leash && cmd._anchor && dist2d(u, cmd._anchor) > stDef.leash;
    if (tgt && !(far && (stDef.chase === false || overLeash))) {
      if (stDef.leash && !cmd._anchor) cmd._anchor = { x: u.x, z: u.z }; // 接战瞬间记录离开路线的锚点
      if (far) { moveToward(u, tgt.x, tgt.z, dt); return; }
      if (!isBlocked(state, u, ABILITY_DEFS[cand.ability])) {
        faceToward(u, tgt.x, tgt.z);
        startAbility(state, u, cand.ability, 'autocast', tgt.id, undefined, undefined, candPrefs(state, cand));
      }
      return;
    }
    if (!tgt) cmd._anchor = null; // 脱战清锚
    const pt = cmd.points[cmd.idx];
    if (moveToward(u, pt.x, pt.z, dt)) cmd.idx = (cmd.idx + 1) % cmd.points.length;
  } else if (cmd.type === 'move') {
    // 朝向是写权槽：并行施法期间由施法独占朝向，移动只产生位移（strafe）
    if (moveToward(u, cmd.x, cmd.z, dt, !u.ability)) {
      u.queue.shift();
      emit(state, 'move_arrived', { unitId: u.id, x: cmd.x, z: cmd.z });
    }
  } else if (cmd.type === 'attack') {
    // autocast 接战性格由姿态声明：chase=false 脱离射程即脱战；leash（警戒）追击距锚点超出缰绳即脱战归位
    const stDef = stanceMachineOf(state).states[u.stance];
    const noChase = cmd.auto && stDef?.chase === false;
    const overLeash = cmd.auto && stDef?.leash && u.anchor && dist2d(u, u.anchor) > stDef.leash;
    // 射程投影（技能 scope）：接战射程 = 指令携带技能的 cast.range ——
    // 投影链：姿态.autocast 候选 → cmd.ability → ABILITY_DEFS[技能].cast.range（未声明回退普攻/ATTACK_RANGE）
    const aid = cmd.ability || DEFAULT_ATTACK;
    const rng = ABILITY_DEFS[aid].cast?.range || ATTACK_RANGE;
    const seen = perceivedSnap(u, cmd.targetId);
    if (seen) {
      if (dist2d(u, seen) > rng) {
        if (noChase || overLeash) { u.queue.shift(); return; }
        moveToward(u, seen.x, seen.z, dt); return;
      }
      // 自主意图有效性：autocast 产生的指令每次出手前重过该技能的硬过滤门
      // （如治疗的 hpBelow —— 队友被奶满即意图过期，弹出指令让位给下一候选）；玩家显式指令不受此限
      // cmd.selector = 姿态候选级覆盖（资产引用或内联），随指令携带保证决议/重估同一套门
      const prof = { ...getPrefs(state, aid) };
      if (cmd.selector) prof.selector = cmd.selector;
      const asel = resolveSelector(prof.selector, state.selectorAssets);
      if (cmd.auto && asel && !evaluateSelector([seen], asel, { self: u, range: rng })) {
        u.queue.shift();
        return;
      }
      if (!isBlocked(state, u, ABILITY_DEFS[aid])) {
        startAbility(state, u, aid, 'auto', cmd.targetId, undefined, undefined, prof);
      }
      return; // 冷却中：原地等待
    }
    const mem = u.blackboard.memory[cmd.targetId];
    if (mem && !noChase && !overLeash) {
      if (!moveToward(u, mem.x, mem.z, dt)) return; // 追往最后目击点
      delete u.blackboard.memory[cmd.targetId];
    }
    u.queue.shift();
    emit(state, 'attack_done', { targetId: cmd.targetId });
  } else if (cmd.type === 'follow') {
    // 跟随：持续指令 —— 目标可感知/有记忆就贴近，彻底失联才完成
    const ref = perceivedSnap(u, cmd.targetId) || u.blackboard.memory[cmd.targetId];
    if (!ref) {
      u.queue.shift();
      emit(state, 'follow_done', { targetId: cmd.targetId });
      return;
    }
    if (dist2d(u, ref) > (cmd.gap ?? FOLLOW_GAP)) moveToward(u, ref.x, ref.z, dt);
  }
}

// 死亡是引擎级状态转移（效果层只扣血）：每阶段结束后扫描 health<=0 做统一清理
function processDeaths(state) {
  for (const v of state.units) {
    if (v.health <= 0 && !(v.unitTags || []).includes('State.Dead')) {
      v.alive = false; // alive 仅供渲染
      v.unitTags.push('State.Dead');
      v.ability = null;
      v.tags = [];
      v.queue = [];
      v.buffer = [];
      if (v._stanceRun) { releaseRun(v._stanceRun); v._stanceRun = null; v._stanceRunKey = null; }
      emit(state, 'unit_downed', { unitId: v.id });
    }
  }
}

export function tick(state, dt, config) {
  state.config = config;
  state.time += dt;
  MemClock.time = state.time; // 统一知识层 mem 计数窗口的时钟 = 引擎时间
  runSensors(state);
  // 指挥传感器：控制器意图 → 受控单位 bb.control（决议/执行期唯一合法的意图来源）
  for (const u of state.units) u.blackboard.control = null;
  const cu = getControlled(state);
  if (cu && isActive(state, cu)) {
    const c = state.controller;
    cu.blackboard.control = { aim: { ...c.aim }, hoverId: c.hoverTargetId, selectedId: c.selectedTargetId, held: [...c.heldInputs] };
  }
  state.notices = state.notices.filter((n) => state.time - n.at < 1.4);

  for (const u of state.units) {
    if (isActive(state, u)) tickUnit(state, u, dt, config);
  }
  processDeaths(state);

  // Projectiles（带阵营，只命中敌方）
  state.projectiles = state.projectiles.filter((p) => {
    if (p.straight) {
      const step = p.speed * dt;
      p.x += p.dx * step; p.z += p.dz * step; p.traveled += step;
      const hit = state.units.find((v) => v.team !== p.team && matchesFilter(v, state.time) && Math.hypot(v.x - p.x, v.z - p.z) < 0.5);
      if (hit) {
        applyProjectileHit(state, hit, p);
        return false;
      }
      if (p.traveled >= p.maxDist) { emit(state, 'projectile_missed', { abilityId: p.abilityId }); return false; }
      return true;
    }
    const target = getUnit(state, p.targetId);
    if (target && matchesFilter(target, state.time)) { p.tx = target.x; p.tz = target.z; }
    const dx = p.tx - p.x, dz = p.tz - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.35) {
      if (target && matchesFilter(target, state.time)) applyProjectileHit(state, target, p);
      else emit(state, 'projectile_impact', { x: p.tx, z: p.tz });
      return false;
    }
    p.x += (dx / d) * p.speed * dt;
    p.z += (dz / d) * p.speed * dt;
    return true;
  });
  processDeaths(state);
}

function applyProjectileHit(state, victim, p) {
  emit(state, 'projectile_impact', { x: p.x, z: p.z });
  // 弹道携带 casterId：命中时找回真实施法者（可能已死，回退最小上下文）
  const caster = getUnit(state, p.casterId) || { id: p.casterId, team: p.team, x: p.x, z: p.z, fx: p.dx || 0, fz: p.dz || 0 };
  executeEffect(state, caster, { type: 'damage', amount: p.damage }, { abilityId: p.abilityId, target: victim });
}

function moveToward(u, x, z, dt, turn = true) {
  const dx = x - u.x;
  const dz = z - u.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < ARRIVE_EPS) return true;
  const step = Math.min(dist, MOVE_SPEED * dt);
  if (turn) {
    u.fx = dx / dist;
    u.fz = dz / dist;
  }
  u.x += (dx / dist) * step;
  u.z += (dz / dist) * step;
  return false;
}