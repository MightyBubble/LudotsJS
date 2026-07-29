// 姿态转移条件蓝图 —— 转移条件不再是硬编码判断或说明文字，而是真实 GraphDef 条件图资产
// （kind:'condition'）。引擎每 tick 对当前叶状态（含祖先冒泡）的条件转移逐条 GraphVM 同步
// 求值：success 且 flow.exit 的 value 为真 = 命中转移 —— 与 fsm.js 统一 FSM 运行时同一语义。
// 幂等落库后可在 GraphLab 打开编辑，图即真相源（改图 = 改转移语义，无代码分支）。
//
// 词汇：lab.candTarget（索敌事实）/ lab.abilityRange（射程投影）/ lab.anchor（锚点信息）/
//       lab.stanceLeash（当前姿态缰绳）+ data.compare / data.logic 纯数据节点。

const G = (name, extraNodes, extraLinks) => ({
  name, kind: 'condition',
  data: {
    name, kind: 'condition', inputs: [], outputs: [],
    nodes: [
      { id: 's', type: 'flow.start' },
      ...extraNodes,
      { id: 'e', type: 'flow.exit', props: { status: 'success' } },
    ],
    links: [{ from: ['s', 'then'], to: ['e', 'exec'] }, ...extraLinks],
  },
});
const ct = (trigger) => ({ id: 'ct', type: 'lab.candTarget', props: { ability: 'atk', trigger } });

export const STANCE_CONDITION_DEFS = [
  // 视野发现：任一候选索敌命中（selector 硬门 + utility 评分后仍有目标）
  G('cond.stance.seen', [ct('seen')], [
    { from: ['ct', 'found'], to: ['e', 'value'] },
  ]),
  // 受击：还击窗口内攻击者仍在感知内且过候选硬门
  G('cond.stance.damaged', [ct('damaged')], [
    { from: ['ct', 'found'], to: ['e', 'value'] },
  ]),
  // 射程内：索敌命中且距离 ≤ 技能射程
  G('cond.stance.inRange', [
    ct('seen'),
    { id: 'rg', type: 'lab.abilityRange', props: { ability: 'atk' } },
    { id: 'cmp', type: 'data.compare', props: { op: '<=' } },
    { id: 'and', type: 'data.logic', props: { op: 'and' } },
  ], [
    { from: ['ct', 'dist'], to: ['cmp', 'a'] },
    { from: ['rg', 'value'], to: ['cmp', 'b'] },
    { from: ['ct', 'found'], to: ['and', 'a'] },
    { from: ['cmp', 'value'], to: ['and', 'b'] },
    { from: ['and', 'value'], to: ['e', 'value'] },
  ]),
  // 超出射程：索敌命中但距离 > 技能射程
  G('cond.stance.outOfRange', [
    ct('seen'),
    { id: 'rg', type: 'lab.abilityRange', props: { ability: 'atk' } },
    { id: 'cmp', type: 'data.compare', props: { op: '>' } },
    { id: 'and', type: 'data.logic', props: { op: 'and' } },
  ], [
    { from: ['ct', 'dist'], to: ['cmp', 'a'] },
    { from: ['rg', 'value'], to: ['cmp', 'b'] },
    { from: ['ct', 'found'], to: ['and', 'a'] },
    { from: ['cmp', 'value'], to: ['and', 'b'] },
    { from: ['and', 'value'], to: ['e', 'value'] },
  ]),
  // 目标失效/脱离：索敌不再命中
  G('cond.stance.targetLost', [
    ct('seen'),
    { id: 'not', type: 'data.logic', props: { op: 'not' } },
  ], [
    { from: ['ct', 'found'], to: ['not', 'a'] },
    { from: ['not', 'value'], to: ['e', 'value'] },
  ]),
  // 超出缰绳：有锚点、姿态声明了缰绳、且距锚点超出缰绳
  G('cond.stance.overLeash', [
    { id: 'an', type: 'lab.anchor' },
    { id: 'ls', type: 'lab.stanceLeash' },
    { id: 'far', type: 'data.compare', props: { op: '>' } },
    { id: 'hasL', type: 'data.compare', props: { op: '>' } },
    { id: 'a1', type: 'data.logic', props: { op: 'and' } },
    { id: 'a2', type: 'data.logic', props: { op: 'and' } },
  ], [
    { from: ['an', 'dist'], to: ['far', 'a'] },
    { from: ['ls', 'value'], to: ['far', 'b'] },
    { from: ['ls', 'value'], to: ['hasL', 'a'] },
    { from: ['an', 'has'], to: ['a1', 'a'] },
    { from: ['far', 'value'], to: ['a1', 'b'] },
    { from: ['a1', 'value'], to: ['a2', 'a'] },
    { from: ['hasL', 'value'], to: ['a2', 'b'] },
    { from: ['a2', 'value'], to: ['e', 'value'] },
  ]),
  // 到达锚点：锚点已清除（归位完成）
  G('cond.stance.atAnchor', [
    { id: 'an', type: 'lab.anchor' },
    { id: 'not', type: 'data.logic', props: { op: 'not' } },
  ], [
    { from: ['an', 'has'], to: ['not', 'a'] },
    { from: ['not', 'value'], to: ['e', 'value'] },
  ]),
];

// 幂等 seed：批量补齐缺失的条件图 GraphDef 实体（已存在的同名资产不覆盖 —— 图即真相源）
export async function ensureStanceConditionDefs(base44, rows = null) {
  const list = rows || (await base44.entities.GraphDef.list(null, 500).catch(() => [])) || [];
  const existing = new Set(list.map((r) => r.name).filter(Boolean));
  for (const def of STANCE_CONDITION_DEFS) {
    if (existing.has(def.name)) continue;
    try {
      list.push(await base44.entities.GraphDef.create(def));
      existing.add(def.name);
    } catch { /* 并发 seed 或权限问题：下次挂载再补 */ }
  }
  return list;
}