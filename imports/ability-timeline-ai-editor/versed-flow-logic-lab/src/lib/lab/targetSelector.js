// 选目标 = 蓝图式 graph 函数（④决议层的可配置部分）。
// 意图优先级（悬停 > 绑定 > 选中）仍是引擎词典序，不进图 —— 玩家意图不该被 utility 加权盖过。
// 图节点词汇只有两类，均为注册表可扩展（加节点零改引擎）：
//   FILTER_NODES  硬条件门：tag / 血量阈值 —— 不满足直接出局
//   CURVE_NODES   utility 曲线公式：input（归一化 0..1）→ curve → × weight，加权平均取最高分
//
// 打分管线已统一：曲线公式是 core/scoring.js 统一原语的参数化别名（数值严格等价，
// selftest 有逐项断言），聚合 = scoring.aggregate 的 weightedMean 档。
// INPUT/FILTER 是 lab 领域词汇（读感知快照字段），留在本层。
// selector 支持命名资产引用：{ ref: '资产id或名称' } → resolveSelector 解引用（资产存 UtilitySet blob）。
import { applyCurve, aggregate } from '../ai/core/scoring.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

// 输入节点：候选快照 + ctx（self / aim / range）→ 归一化 0..1
export const INPUT_NODES = {
  distance: (s, ctx) => clamp01(Math.hypot(s.x - ctx.self.x, s.z - ctx.self.z) / ctx.range),
  hp: (s) => clamp01(s.health / (s.maxHealth || 100)),
  aimDistance: (s, ctx) => (ctx.aim ? clamp01(Math.hypot(s.x - ctx.aim.x, s.z - ctx.aim.z) / ctx.range) : 0.5),
};

// 曲线公式节点：0..1 → 0..1（统一管线参数化别名 —— 映射表见 core/scoring.js 头注）
export const CURVE_NODES = {
  linear: (x) => applyCurve(x, 'linear', 1, 1, 0, 0),
  inverse: (x) => applyCurve(x, 'inverse'),
  poly: (x, p) => applyCurve(x, 'exponential', 1, p?.exp ?? 2, 0, 1),
  invpoly: (x, p) => applyCurve(x, 'invpoly', 1, p?.exp ?? 2, 0, 1),
  logistic: (x, p) => applyCurve(x, 'logistic', -(p?.k ?? 10) / 10, 1, (p?.mid ?? 0.5) - 0.5, 1),
  step: (x, p) => applyCurve(x, 'step', 1, 1, p?.at ?? 0.5, 1),
};

// 硬过滤节点（tag 读感知快照，非活引用）
export const FILTER_NODES = {
  requireTag: (s, p) => (s.tags || []).includes(p.tag),
  forbidTag: (s, p) => !(s.tags || []).includes(p.tag),
  hpBelow: (s, p) => s.health / (s.maxHealth || 100) < (p.ratio ?? 1),
  hpAbove: (s, p) => s.health / (s.maxHealth || 100) > (p.ratio ?? 0),
};

const passFilters = (s, filters) => (filters || []).every((f) => FILTER_NODES[f.type]?.(s, f) ?? true);

const score = (s, sel, ctx) => {
  const ys = [], ws = [];
  const parts = {};
  for (const c of sel.considerations || []) {
    const x = INPUT_NODES[c.input]?.(s, ctx) ?? 0;
    const y = (CURVE_NODES[c.curve?.type || 'linear'] || CURVE_NODES.linear)(x, c.curve);
    ys.push(y); ws.push(c.weight ?? 1);
    parts[c.input] = y;
  }
  return { total: aggregate(ys, ws, 'weightedMean'), parts };
};

// selector 资产引用解析：{ ref: '资产id或名称' } → 资产表查找；内联对象原样返回；空 → null（调用方回退默认）
export function resolveSelector(sel, assets) {
  if (sel?.ref) return assets?.[sel.ref] || null;
  return sel || null;
}

// 求值：硬过滤 → utility 评分 → 取最高（平分保留先出现者）
export function evaluateSelector(cands, sel, ctx) {
  let best = null, bestScore = -1;
  for (const s of cands) {
    if (!passFilters(s, sel.filters)) continue;
    const sc = score(s, sel, ctx).total;
    if (sc > bestScore) { best = s; bestScore = sc; }
  }
  return best;
}

// 调试：每个候选的总分与分量（utility 面板用）
export function scoreCandidates(cands, sel, ctx) {
  return cands
    .map((s) => ({ id: s.id, filtered: !passFilters(s, sel.filters), ...score(s, sel, ctx) }))
    .sort((a, b) => (a.filtered - b.filtered) || (b.total - a.total));
}

// acquire.pick 只是默认 selector 的糖
export function defaultSelector(pick) {
  return { considerations: [{ input: pick === 'lowest_hp' ? 'hp' : 'distance', curve: { type: 'inverse' }, weight: 1 }] };
}

// 悬停施法：评分换鼠标距离（意图仍胜过 utility），硬过滤照常生效
export const AIM_CONSIDERATIONS = [{ input: 'aimDistance', curve: { type: 'inverse' }, weight: 1 }];