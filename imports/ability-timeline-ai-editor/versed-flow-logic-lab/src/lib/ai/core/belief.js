// 主观认识层（Belief）—— 黑板客观数据 → 主观标量的映射曲线。
//
// 语义全面参考 Utility 参考项目（input → normalization → response curve）：
//   · 每个 belief = { key, source: 黑板键/派生输入, norm: {type,min,max}, curve: {type,slope,exponent,xs,ys} }
//   · 归一化：range / divide / gte / lte / in_range / bool
//   · 响应曲线：linear(y = slope·x + yShift) / exponential(x^exponent) / logistic(ys/(1+e^(slope·10·(x-0.5-xs))))
//   · 烘焙为扁平 TypedArray（SoA），evaluate 零分配写入预分配 Float32Array。
//
// 细化（在参考项目基础上）：
//   · source 支持路径表达式：'bb.perceived.length' / 'mem:attacked:30'（30 秒窗口计数）/ 'ws:has_city'
//   · beliefs 可引用 beliefs（链式派生，按声明顺序拓扑求值）
//   · 每 belief 带 smoothing（EMA 平滑系数，防止主观值跳变导致决策抖动——momentum 之外的第二重惯性）

// 归一化 × 响应曲线原语已收敛到统一打分管线 core/scoring.js（类型码恒定，全项目唯一实现）。
// 本文件只保留 belief 语义层（source 解析 / 烘焙 / 逐 tick 求值 / 链式派生 / EMA 平滑）。
import { clamp01, applyNorm, applyCurve, NORM_TYPES, CURVE_TYPES } from './scoring.js';
export { clamp01, applyNorm, applyCurve, NORM_TYPES, CURVE_TYPES };

// source 解析：'bb:x.y' | 'mem:type:within' | 'ws:bit' | 'belief:key' | 数字字面量
export function readSource(src, ctx) {
  if (typeof src === 'number') return src;
  if (src.startsWith('bb:')) {
    const path = src.slice(3).split('.');
    let v = ctx.bb?.get(path[0]);
    for (let i = 1; i < path.length && v != null; i++) v = v[path[i]];
    if (path[path.length - 1] === 'length' && Array.isArray(v)) return v.length;
    return typeof v === 'number' ? v : v ? 1 : 0;
  }
  if (src.startsWith('mem:')) {
    const [, type, within] = src.split(':');
    return ctx.mem?.count(type, within ? +within : Infinity) ?? 0;
  }
  if (src.startsWith('ws:')) return ctx.ws?.get(src.slice(3)) ? 1 : 0;
  if (src.startsWith('belief:')) return ctx.out?.[src.slice(7)] ?? ctx.beliefs?.get?.(src.slice(7)) ?? 0;
  if (src.startsWith('target:')) {
    const path = src.slice(7).split('.');
    let v = ctx.target;
    for (const p of path) { if (v == null) return 0; v = v[p]; }
    return typeof v === 'number' ? v : v ? 1 : 0;
  }
  if (src.startsWith('self:')) {
    const path = src.slice(5).split('.');
    let v = ctx.self;
    for (const p of path) { if (v == null) return 0; v = v[p]; }
    return typeof v === 'number' ? v : v ? 1 : 0;
  }
  if (src === 'dist') return ctx.dist?.(ctx.self, ctx.target) ?? 0;
  return 0;
}

export function bakeBeliefs(defs) {
  const n = defs.length;
  const b = {
    defs, n,
    keys: defs.map((d) => d.key),
    normT: new Uint8Array(n), nMin: new Float32Array(n), nMax: new Float32Array(n),
    curveT: new Uint8Array(n), slope: new Float32Array(n), expo: new Float32Array(n),
    xs: new Float32Array(n), ys: new Float32Array(n),
    smooth: new Float32Array(n),
    out: new Float32Array(n),
    byKey: {},
  };
  const NT = { range: 0, divide: 1, gte: 2, lte: 3, in_range: 4, bool: 5 };
  const CT = { linear: 0, exponential: 1, logistic: 2 };
  defs.forEach((d, i) => {
    b.byKey[d.key] = i;
    b.normT[i] = NT[d.norm?.type || 'range'] ?? 0;
    b.nMin[i] = d.norm?.min ?? 0; b.nMax[i] = d.norm?.max ?? 100;
    b.curveT[i] = CT[d.curve?.type || 'logistic'] ?? 2;
    b.slope[i] = d.curve?.slope ?? -1; b.expo[i] = d.curve?.exponent ?? 1;
    b.xs[i] = d.curve?.xShift ?? 0; b.ys[i] = d.curve?.yShift ?? 1;
    b.smooth[i] = d.smoothing ?? 0;
  });
  return b;
}

// 每 tick 求值：写入 b.out（零分配）。ctx = { bb, mem, ws, out(已求值的 beliefs 键视图) }
export function evaluateBeliefs(b, ctx) {
  const keyView = {};
  ctx.out = keyView;
  for (let i = 0; i < b.n; i++) {
    const raw = readSource(b.defs[i].source, ctx);
    const x = applyNorm(raw, b.normT[i], b.nMin[i], b.nMax[i]);
    let v = applyCurve(x, b.curveT[i], b.slope[i], b.expo[i], b.xs[i], b.ys[i]);
    if (b.smooth[i] > 0) v = b.out[i] + (v - b.out[i]) * Math.min(1, b.smooth[i]);
    b.out[i] = v;
    keyView[b.keys[i]] = v;
  }
}

// 图节点/面板读口：按 key 取主观值
export function beliefGet(b, key) {
  const i = b.byKey[key];
  return i === undefined ? 0 : b.out[i];
}
