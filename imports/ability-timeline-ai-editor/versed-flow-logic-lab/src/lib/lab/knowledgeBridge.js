// 知识层桥接 —— 实验室引擎 ⇄ 统一知识层（core/knowledge.js + core/belief.js）。
//
// 引擎热路径不变：传感器照旧写 u.blackboard 四键（perceived/memory/lastHit/control）。
// 本模块在每 tick 传感器阶段后做一层"镜像同步"，把同一份客观数据映射进统一知识包：
//   BB  键镜像（引用同一快照，零拷贝）+ 派生计数（perceivedEnemy/perceivedAlly）
//   Mem 客观事件记录（spotted / lost_sight / attacked / stance_changed / ability_cast）
//   WS  位开关（规划器风格的事实词汇：engaged / has_memory / casting / has_orders / anchored）
//   Belief 主观标量（统一打分管线派生：threat / alertness / confidence —— 链式引用）
//
// 主客观分离在这一层可见：BT/FSM/Utility/GOAP/HTN 与实验室引擎读的是同一套词汇。
import { createKnowledge, MemClock } from '../ai/core/knowledge.js';
import { bakeBeliefs, evaluateBeliefs, beliefGet } from '../ai/core/belief.js';

export const LAB_BITS = ['engaged', 'has_memory', 'casting', 'has_orders', 'anchored'];

// 实验室默认主观集（数据，非代码）：source 词汇 = bb:路径 / mem:类型:窗口秒 / belief:键（链式）
export const LAB_BELIEFS = [
  { key: 'threat', source: 'mem:attacked:4', norm: { type: 'range', min: 0, max: 3 }, curve: { type: 'logistic', slope: 1, xShift: 0, yShift: 1 }, smoothing: 0.3 },
  { key: 'alertness', source: 'bb:perceivedEnemy', norm: { type: 'range', min: 0, max: 4 }, curve: { type: 'linear', slope: 1, yShift: 0 } },
  { key: 'confidence', source: 'belief:threat', norm: { type: 'range', min: 0, max: 1 }, curve: { type: 'linear', slope: -1, yShift: 1 } },
];

export function createLabKnowledge() {
  return { ...createKnowledge({ bits: LAB_BITS }), beliefs: bakeBeliefs(LAB_BELIEFS) };
}

// 每 tick 调用（传感器阶段后）：unit.blackboard → unit.knowledge 镜像 + WS 位 + Belief 求值
export function syncKnowledge(u, state) {
  const k = u.knowledge;
  if (!k) return;
  const bb = u.blackboard;
  const prev = k.bb.get('perceived') || [];
  const next = bb.perceived || [];
  // Mem：进入/离开视野的客观记录（与 core/sensors.js vision 传感器同词汇）
  if (prev !== next) {
    const prevIds = k._prevIds || (k._prevIds = new Set());
    const nextIds = new Set(next.map((s) => s.id));
    for (const s of next) if (!prevIds.has(s.id)) k.mem.add('spotted', { id: s.id, team: s.team }, state.time);
    for (const id of prevIds) if (!nextIds.has(id)) k.mem.add('lost_sight', { id }, state.time);
    k._prevIds = nextIds;
  }
  const enemy = next.filter((s) => s.team !== u.team).length;
  k.bb.set('perceived', next);
  k.bb.set('perceivedEnemy', enemy);
  k.bb.set('perceivedAlly', next.length - enemy);
  k.bb.set('memory', bb.memory);
  k.bb.set('lastHit', bb.lastHit);
  k.bb.set('control', bb.control);
  // WS：事实位（规划器词汇）
  k.ws.set('engaged', enemy > 0);
  k.ws.set('has_memory', Object.keys(bb.memory || {}).length > 0);
  k.ws.set('casting', !!u.ability);
  k.ws.set('has_orders', (u.queue?.length || 0) > 0);
  k.ws.set('anchored', !!u.anchor);
  // Belief：主观派生（统一管线；mem 计数时钟 = 引擎时间）
  evaluateBeliefs(k.beliefs, { bb: k.bb, mem: k.mem, ws: k.ws });
}

// 受击事实记录（effects.applyDamage 调用，一次性事件，不走镜像）
export function recordHit(u, by, time) {
  if (!u.knowledge) return;
  u.knowledge.mem.add('attacked', { by }, time);
  u.knowledge.bb.set('lastHit', { by, at: time });
}

// 任意客观事件记录（姿态切换、施法激活等）
export function recordEvent(u, type, data, time) {
  u.knowledge?.mem.add(type, data, time);
}

export { beliefGet, MemClock };
