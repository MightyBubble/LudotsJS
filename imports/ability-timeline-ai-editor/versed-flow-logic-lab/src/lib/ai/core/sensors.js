// 传感器层 —— 世界 → 黑板/记忆 的唯一写入通道（决策绝不直接读世界）。
// 契约：传感器只写客观层（bb 快照 / mem 记录 / ws 位），主观值由 belief 曲线派生。
// BT、FSM、Utility、GOAP、HTN 全部读同一份知识包 —— 复用在数据层完成，不在代码层。

// 通用传感器注册表：{ type: handler(world, agent, cfg) }
const SENSORS = {};
export function registerSensor(type, handler) { SENSORS[type] = handler; }

// 每 tick 为 agent 跑一遍其声明的传感器列表（顺序即写入顺序）
export function runSensors(world, agent) {
  const defs = agent.sensors || [];
  for (let i = 0; i < defs.length; i++) {
    const h = SENSORS[defs[i].type];
    if (h) h(world, agent, defs[i]);
  }
}

// 内置：视野传感器 —— 把 world.queryVisible(agent) 的列表快照进 bb.perceived，
// 消失的转入 mem（'lost_sight' 记录），新出现的写 mem（'spotted'）。
registerSensor('vision', (world, agent, cfg) => {
  const bb = agent.knowledge.bb;
  const prev = bb.get('perceived') || [];
  const next = world.queryVisible(agent, cfg) || [];
  const prevIds = new Set(prev.map((s) => s.id));
  const nextIds = new Set(next.map((s) => s.id));
  for (const s of next) if (!prevIds.has(s.id)) agent.knowledge.mem.add('spotted', { id: s.id, kind: s.kind }, world.time);
  for (const s of prev) if (!nextIds.has(s.id)) agent.knowledge.mem.add('lost_sight', { id: s.id, last: s }, world.time);
  bb.set('perceived', next);
  bb.set('perceivedCount', next.length);
});

// 内置：受击传感器 —— world.drainHits(agent) 取出本 tick 受击事实，写 bb.lastHit + mem
registerSensor('hits', (world, agent) => {
  const hits = world.drainHits?.(agent) || [];
  if (hits.length) {
    agent.knowledge.bb.set('lastHit', hits[hits.length - 1]);
    for (const h of hits) agent.knowledge.mem.add('attacked', h, world.time);
  }
});

// 内置：WorldState 同步器 —— 把声明的世界事实写成位（规划器事实来源）
registerSensor('wsSync', (world, agent, cfg) => {
  const ws = agent.knowledge.ws;
  for (const bit in cfg.map || {}) {
    ws.set(bit, !!cfg.map[bit](world, agent));
  }
});
