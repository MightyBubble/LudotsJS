// 技能指令化 —— 每个技能声明一条指令（command），指令的实现是一张 GraphVM 模板图。
//
// 决策与实现分离（指令模式）：
//   · 实验室引擎的 stages/timeline 是执行热路径（SoA/0GC，永远不变）；
//   · 模板图是同一条指令的"可追溯参考实现"——表达该指令在知识层上的契约：
//     接收指令 → 记入 Mem → 日志 → 异步节拍 → 校验 WS 前置位 → 写 BB → 返回状态。
//   · GraphLab 里建同名图（如 ability.melee）即覆盖内置默认 —— 模板库同名覆盖机制。
//   · 以 GraphVM 执行时逐节点留下 trace：一切动作可追溯到具体图节点。
//
// 节点词汇 = 全产品统一 GraphVM 节点库（flow / data / kb / curve / ai / act），
// 与 BT、FSM、Utility、GOAP、HTN 复用同一套 —— 不存在"一层概念包一层概念"。
import { ABILITY_DEFS } from './abilityDefs.js';
import { beliefGet } from './knowledgeBridge.js';

// 每技能的前置 WS 位（规划器词汇；知识层桥接每 tick 维护，见 knowledgeBridge.js）
const TEMPLATE_PARAMS = {
  melee: { bit: 'engaged' },
  ranged: { bit: 'engaged' },
  channel: { bit: 'engaged' },
  repeatfire: { bit: 'engaged' },
  beam: { bit: 'engaged' },
  combo: { bit: 'engaged' },
  stun: { bit: 'engaged' },
  atk: { bit: 'engaged' },
  heal: { bit: 'has_memory' }, // 治疗依赖战场认知（记忆快照），不依赖敌情
};

// 指令参考实现图（内置默认，GraphLab 同名覆盖）：
//   start → Mem.Add(command) → log → Delay(1s, 异步) → Branch(WS 前置位)
//     true  → BB.Set(lastCommand) → exit success
//     false → exit failure（前置不满足，指令失败）
function mkAbilityGraph(id) {
  const command = `ability.${id}`;
  const { bit } = TEMPLATE_PARAMS[id] || { bit: 'engaged' };
  return {
    id: command, kind: 'action',
    graph: {
      name: command, kind: 'action', command,
      inputs: [
        { key: 'targetId', type: 'any', default: null },
        { key: 'origin', type: 'string', default: 'lab' },
      ],
      outputs: [],
      nodes: [
        { id: 's', type: 'flow.start' },
        { id: 'nm', type: 'data.const', props: { value: command } },
        { id: 'mem', type: 'kb.memAdd', props: { type: 'command' } },
        { id: 'lg', type: 'act.log' },
        { id: 'dl', type: 'flow.delay' },
        { id: 'ws', type: 'kb.wsGet', props: { bit } },
        { id: 'br', type: 'flow.branch' },
        { id: 'bb', type: 'kb.bbSet', props: { key: 'lastCommand' } },
        { id: 'ok', type: 'flow.exit', props: { status: 'success' } },
        { id: 'no', type: 'flow.exit', props: { status: 'failure' } },
      ],
      links: [
        { from: ['s', 'then'], to: ['mem', 'exec'] },
        { from: ['mem', 'then'], to: ['lg', 'exec'] },
        { from: ['lg', 'then'], to: ['dl', 'exec'] },
        { from: ['dl', 'then'], to: ['br', 'exec'] },
        { from: ['br', 'true'], to: ['bb', 'exec'] },
        { from: ['bb', 'then'], to: ['ok', 'exec'] },
        { from: ['br', 'false'], to: ['no', 'exec'] },
        { from: ['nm', 'value'], to: ['mem', 'data'] },
        { from: ['nm', 'value'], to: ['lg', 'msg'] },
        { from: ['ws', 'value'], to: ['br', 'cond'] },
        { from: ['nm', 'value'], to: ['bb', 'value'] },
      ],
    },
  };
}

// 内置技能指令模板集（createTemplateLibrary 的 builtins 参数形状）
export function buildAbilityTemplates() {
  return Object.keys(ABILITY_DEFS).map(mkAbilityGraph);
}

// GraphVM 执行上下文：绑定受控单位的统一知识层 —— 与引擎传感器/决策读的是同一份
// BB / Mem / WS / Belief（主客观分离：图节点只能经这组词汇触碰世界）。
export function labGraphCtx(state, u, commands) {
  const k = u?.knowledge;
  return {
    time: state.time,
    self: u,
    bb: k?.bb,
    mem: k && { add: (t, d) => k.mem.add(t, d, state.time), count: (t, w) => k.mem.count(t, w) },
    ws: k?.ws,
    beliefs: k && { get: (key) => beliefGet(k.beliefs, key) },
    commands,
    log: (msg) => {
      state.events.unshift({ t: state.time, type: 'cmd', text: `⟨GraphVM⟩ ${msg}` });
      if (state.events.length > 60) state.events.pop();
    },
  };
}
