// 姿态行为图资产化 —— 每个姿态叶状态的行为 = 真实持久化的 GraphDef 图资产。
//
// 反硬编码契约：
//   · buildStanceBehaviorGraph（配置 → 图）只是**一次性模板生成器**，产物落库为
//     GraphDef 实体（kind:'action'，命名约定 stance.behavior.<叶路径>）后，行为真相源就是图本身；
//   · 引擎 stanceBehaviorOf 查找链：显式 behavior/action → 命名约定 GraphDef → 生成兜底；
//   · 落库后改 autocast/chase/leash 不再自动改图（FSM 编辑器可「从配置重新生成」显式刷新），
//     chase/leash 同时保留 order 管道的执行语义（退战/归位）—— 两层关系在编辑器 UI 讲清。
//
// 纯规划函数（无 IO，可自检）+ base44 幂等 seed（浏览器端）两层分离。
import { buildStanceBehaviorGraph } from './stanceBehavior.js';
import { normalizeStanceMachine } from './stances.js';

export const stanceBehaviorName = (key) => `stance.behavior.${key}`;

// 纯规划：姿态机数据 → 需要新建的图资产列表（不落库、不写回）。
// 跳过：非叶状态、已显式挂图（behavior/action，含继承）、已有同名 GraphDef。
export function planStanceBehaviorDefs(machineData, existingNames = new Set()) {
  const norm = normalizeStanceMachine(machineData);
  const out = [];
  if (!norm?.states) return out;
  for (const st of Object.values(norm.states)) {
    if (!st.isLeaf || st.behavior || st.action) continue;
    const name = stanceBehaviorName(st.key);
    if (existingNames.has(name) || out.some((d) => d.name === name)) continue;
    out.push({ name, kind: 'action', data: buildStanceBehaviorGraph(st.key, st) });
  }
  return out;
}

// 单状态资产定义（FSM 编辑器「生成可编辑图 / 从配置重新生成」）：
// 以当前有效配置（含祖先继承）重新推导图；显式挂图的状态返回 null（不覆盖手编引用）。
export function buildStanceBehaviorDef(machineData, pathKey) {
  const norm = normalizeStanceMachine(machineData);
  const st = norm?.states?.[pathKey];
  if (!st?.isLeaf || st.behavior || st.action) return null;
  const name = stanceBehaviorName(st.key);
  return { name, kind: 'action', data: buildStanceBehaviorGraph(st.key, st) };
}

// 幂等 seed（浏览器端；base44 实体 API 需登录会话）：批量补齐缺失的 GraphDef 实体。
// rows 可传入已拉取的列表（复用、避免重复请求）；返回最新 GraphDef 行列表。
export async function ensureStanceBehaviorDefs(base44, machineData, rows = null) {
  const list = rows || (await base44.entities.GraphDef.list(null, 500).catch(() => [])) || [];
  const existing = new Set(list.map((r) => r.name).filter(Boolean));
  for (const def of planStanceBehaviorDefs(machineData, existing)) {
    try {
      list.push(await base44.entities.GraphDef.create(def));
      existing.add(def.name);
    } catch { /* 并发 seed 或权限问题：下次挂载再补 */ }
  }
  return list;
}
