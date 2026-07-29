// 统一打分管线（Scoring）—— 全项目唯一的"归一化 × 响应曲线 × 聚合"原语库。
//
// 一切打分都走同一条管线：source → normalize(0..1) → curve(0..1→0..1) → aggregate(总分)。
// 三个消费者共用这一套原语，语义各选一档：
//   · Belief 主观映射（core/belief.js）        —— 归一化 × 曲线（EMA 平滑，无聚合）
//   · Utility 决策评分（utility/utility.js）    —— 乘积 / 补偿因子 / 几何平均（热路径内联，等价本库）
//   · 选目标 selector（lab/targetSelector.js）  —— 硬过滤门 + 加权平均
//
// 曲线类型码（烘焙进 SoA Uint8Array，码值恒定不可改）：
//   0 linear      y = clamp01(x·slope + yShift)                （默认 slope=1, yShift=0 → 恒等）
//   1 exponential y = clamp01(x^exponent)                      （= 旧 selector 的 poly）
//   2 logistic    y = yShift / (1 + e^(slope·10·(x-0.5-xShift)))
//   3 inverse     y = 1 - x                                    （"越小越好"首选）
//   4 invpoly     y = 1 - x^exponent                           （= 旧 selector 的 invpoly）
//   5 step        y = x < xShift ? 1 : 0                       （阈值门）
//
// 旧 selector 词汇 → 统一参数映射（数值严格等价，selftest 有断言）：
//   linear(x)              = linear(slope=1, yShift=0)
//   inverse(x)             = inverse
//   poly(x,exp)            = exponential(exponent=exp)
//   invpoly(x,exp)         = invpoly(exponent=exp)
//   logistic(x,{k,mid})    = logistic(slope=-k/10, xShift=mid-0.5, yShift=1)
//   step(x,{at})           = step(xShift=at)

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ── 归一化（0..1）── 类型码：range:0 divide:1 gte:2 lte:3 in_range:4 bool:5
export const NORM_TYPES = ['range', 'divide', 'gte', 'lte', 'in_range', 'bool'];

export function applyNorm(v, t, min, max) {
  if (typeof t === 'number') t = NORM_TYPES[t] || 'range';
  switch (t) {
    case 'bool': return v ? 1 : 0;
    case 'gte': return v >= max ? 1 : 0;
    case 'lte': return v <= max ? 1 : 0;
    case 'in_range': return v >= min && v <= max ? 1 : 0;
    case 'divide': return max === 0 ? 0 : clamp01(v / max);
    default: return max === min ? 0 : clamp01((v - min) / (max - min)); // range
  }
}

// ── 响应曲线（0..1 → 0..1）──
export const CURVE_TYPES = ['linear', 'exponential', 'logistic', 'inverse', 'invpoly', 'step'];

export function applyCurve(x, t, slope, e, xs, ys) {
  if (typeof t === 'number') t = CURVE_TYPES[t] || 'logistic';
  switch (t) {
    case 'linear': return clamp01(x * (slope ?? 1) + (ys ?? 0));
    case 'exponential': return clamp01(Math.pow(x, e ?? 1));
    case 'inverse': return 1 - x;
    case 'invpoly': return 1 - Math.pow(x, e ?? 2);
    case 'step': return x < (xs ?? 0.5) ? 1 : 0;
    default: return clamp01((ys ?? 1) / (1 + Math.exp((slope ?? -1) * 10 * (x - 0.5 - (xs ?? 0))))); // logistic
  }
}

// ── 聚合（各分量 → 总分）── 参考实现（非热路径；utility 热路径内联等价逻辑）
//   weightedMean  Σ(y·w)/Σw        —— 选目标 selector 语义
//   product       Πy               —— utility 无补偿
//   factor        p+(1-p)(1-1/n)p  —— utility 补偿因子（任一考量趋 0 仍可被其他拉高）
//   geometric     p^(1/n)          —— utility 几何平均补偿
export function aggregate(ys, ws, mode = 'product') {
  const n = ys.length;
  if (n === 0) return 0;
  if (mode === 'weightedMean') {
    let sum = 0, wsum = 0;
    for (let i = 0; i < n; i++) { const w = ws?.[i] ?? 1; sum += ys[i] * w; wsum += w; }
    return wsum > 0 ? sum / wsum : 0;
  }
  let product = 1;
  for (let i = 0; i < n; i++) product *= ys[i];
  if (mode === 'geometric') return n > 1 ? Math.pow(product, 1 / n) : product;
  if (mode === 'factor') {
    if (n <= 1) return product;
    const mod = 1 - 1 / n;
    return product + (1 - product) * mod * product;
  }
  return product;
}
