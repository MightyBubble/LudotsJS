// Utility 决策系统 —— 语义整合自参考项目（AIAgent/DecisionMaker/Decision/Consideration/
// InputNormalization/TargetFilter），并接入本项目的知识层（BB/Mem/WS/Belief 作为输入源）。
//
// 评分语义（与参考项目一致）：
//   · Consideration：source → 归一化(range/divide/gte/lte/in_range/bool) → 响应曲线(linear/exponential/logistic)
//   · Decision 得分 = 各 Consideration 曲线输出的乘积
//   · 补偿方法（compensationMethod）：none 无 / factor 补偿因子 / geometric 几何平均 —— 对齐参考项目三态
//   · 动量（momentum）：当前决策 × bonus —— 决策惯性，防抖动（默认 1.1，可 <1 降权）
//   · TargetFilter：交集语义（对齐参考项目）—— 决策目标 = 所有过滤器输出的交集，
//     内置 enemy/ally/any + UtilityAgent/OtherAgent/OtherEntity/WithinDistance 四类
//   · ExecutionMode：Sequence / Parallel / ParallelComplete；maxRepeat ≤0 = 无限重复直到失败
//   · Decision 可声明 command —— 选中后下达的指令（决策与实现分离：指令由模板图实现）
//
// 烘焙为扁平数组（SoA），evaluate 零分配。可被任意决策器复用：GOAP 动作代价、
// HTN 方法选择、外交提案、BT 内部打分……同一个 UtilitySet，谁都能拿来算。

import { applyNorm, applyCurve, readSource } from '../core/belief.js';

const NT = { range: 0, divide: 1, gte: 2, lte: 3, in_range: 4, bool: 5 };
const CT = { linear: 0, exponential: 1, logistic: 2 };

export function bakeUtilitySet(setDef) {
  const makers = (setDef.makers || []).map((m) => ({
    id: m.id || m.name, name: m.name,
    decisions: (m.decisions || []).map((d) => {
      const cons = d.considerations || [];
      const n = cons.length;
      const dd = {
        id: d.id || d.name, name: d.name, weight: d.weight ?? 1, n,
        noTarget: !!d.noTarget, filter: d.targetFilter || 'any',
        command: d.command || null,
        src: new Array(n), normT: new Uint8Array(n), nMin: new Float32Array(n), nMax: new Float32Array(n),
        curveT: new Uint8Array(n), slope: new Float32Array(n), expo: new Float32Array(n),
        xs: new Float32Array(n), ys: new Float32Array(n),
        consNames: cons.map((c) => c.name || c.source),
        out: { score: 0, bestTarget: null, final: 0 },
      };
      cons.forEach((c, k) => {
        dd.src[k] = c.source;
        dd.normT[k] = NT[c.norm?.type || 'range'] ?? 0;
        dd.nMin[k] = c.norm?.min ?? 0; dd.nMax[k] = c.norm?.max ?? 100;
        dd.curveT[k] = CT[c.curve?.type || 'logistic'] ?? 2;
        dd.slope[k] = c.curve?.slope ?? -1; dd.expo[k] = c.curve?.exponent ?? 1;
        dd.xs[k] = c.curve?.xShift ?? 0; dd.ys[k] = c.curve?.yShift ?? 1;
      });
      return dd;
    }),
  }));
  return {
    name: setDef.name,
    compensation: setDef.compensation !== false,
    compensationMethod: setDef.compensation_method || (setDef.compensation !== false ? 'factor' : 'none'),
    momentumBonus: setDef.momentum ?? 1.1,
    makers,
    current: {}, // makerId -> decisionId（动量依据）
  };
}

function scoreDecision(set, dd, ctx, target) {
  let product = 1;
  for (let k = 0; k < dd.n; k++) {
    const raw = readSource(dd.src[k], { ...ctx, target });
    const x = applyNorm(raw, dd.normT[k], dd.nMin[k], dd.nMax[k]);
    product *= applyCurve(x, dd.curveT[k], dd.slope[k], dd.expo[k], dd.xs[k], dd.ys[k]);
  }
  const method = set.compensationMethod || (set.compensation !== false ? 'factor' : 'none');
  if (dd.n > 1 && method === 'geometric') return Math.pow(product, 1 / dd.n);
  if (dd.n > 1 && method === 'factor') {
    const mod = 1 - 1 / dd.n;
    return product + (1 - product) * mod * product;
  }
  return product;
}

// 目标过滤（交集语义）：kind ∈ any/enemy/ally/agent/other_agent/other_entity/within_distance
function matchFilter(target, kind, self, ctx, param) {
  if (!target) return false;
  switch (kind) {
    case 'enemy': return target.team !== undefined && target.team !== self?.team;
    case 'ally': return target.team !== undefined && target.team === self?.team && target !== self;
    case 'agent': return !!target.isAgent;                                        // UtilityAgentFilter
    case 'other_agent': return !!target.isAgent && target !== self;               // OtherAgentFilter
    case 'other_entity': return !target.isAgent && target !== self;               // OtherEntityFilter
    case 'within_distance': {                                                     // WithinDistanceFilter
      const d = ctx?.dist ? ctx.dist(self, target) : (target.dist ?? Infinity);
      return d <= (param ?? 10);
    }
    default: return true; // any
  }
}

// 决策的目标判定：filters 数组全过（交集）；无 filters 时回退单 filter（老格式兼容）
function passFilters(target, dd, ctx) {
  if (dd.filters?.length) return dd.filters.every((f) => matchFilter(target, f.kind, ctx.self, ctx, f.param));
  return matchFilter(target, dd.filter, ctx.self, ctx, null);
}

// ctx = { bb, mem, ws, beliefs, self, time }；targets = 候选目标数组（可为空）
// store：动量状态隔离（同一 baked set 可被多个 agent 复用——各自传自己的 store，默认挂在 set 上）
export function evaluateUtility(set, ctx, targets = [], store = set) {
  if (!store.current) store.current = {};
  for (const m of set.makers) {
    let best = null, bestFinal = -1;
    for (const dd of m.decisions) {
      let score, bestT = null;
      if (dd.noTarget || !targets.length) {
        score = dd.noTarget ? scoreDecision(set, dd, ctx, null) : 0;
      } else {
        score = -1;
        for (const t of targets) {
          if (!passFilters(t, dd, ctx)) continue;
          const s = scoreDecision(set, dd, ctx, t);
          if (s > score) { score = s; bestT = t; }
        }
        if (score < 0) score = 0;
      }
      const isCurrent = store.current[m.id] === dd.id;
      dd.out.score = score;
      dd.out.bestTarget = bestT;
      dd.out.final = score * dd.weight * (isCurrent ? set.momentumBonus : 1);
      if (dd.out.final > bestFinal) { bestFinal = dd.out.final; best = dd; }
    }
    m.best = bestFinal > 0 ? best : null;
    if (m.best) store.current[m.id] = m.best.id;
  }
  return set;
}

export function utilityScore(set, decisionName, ctx, target) {
  for (const m of set.makers) for (const dd of m.decisions) {
    if (dd.name === decisionName || dd.id === decisionName) return scoreDecision(set, dd, ctx, target);
  }
  return 0;
}

export function utilityBest(set, makerName) {
  const m = set.makers.find((x) => x.name === makerName || x.id === makerName);
  return m?.best ? { id: m.best.id, name: m.best.name, target: m.best.out.bestTarget, score: m.best.out.final, command: m.best.command } : null;
}

// 调试图（允许分配，低频）：每个 maker 的决策明细
export function snapshotUtility(set, ctx, targets = []) {

  return set.makers.map((m) => ({
    maker: m.name,
    best: m.best?.name || null,
    decisions: m.decisions.map((dd) => {
      const perTarget = dd.noTarget ? [] : targets.filter((t) => passFilters(t, dd, ctx))
        .map((t) => ({ target: t.name || t.id, score: scoreDecision(set, dd, ctx, t) }))
        .sort((a, b) => b.score - a.score);
      const breakdown = [];
      for (let k = 0; k < dd.n; k++) {
        const raw = readSource(dd.src[k], { ...ctx, target: dd.out.bestTarget });
        const x = applyNorm(raw, dd.normT[k], dd.nMin[k], dd.nMax[k]);
        breakdown.push({ name: dd.consNames[k], raw, normalized: x, score: applyCurve(x, dd.curveT[k], dd.slope[k], dd.expo[k], dd.xs[k], dd.ys[k]) });
      }
      return { name: dd.name, score: dd.out.score, final: dd.out.final, bestTarget: dd.out.bestTarget?.name || dd.out.bestTarget?.id || null, perTarget, breakdown, command: dd.command, actions: dd.actions, execution: dd.execution };
    }).sort((a, b) => b.final - a.final),
  }));
}

/* ================================================================================
 * 资产模型烘焙（对齐 Utility Worlds / 参考项目八件套）
 * 独立资产经 id 引用解析，产出与 bakeUtilitySet 完全相同的扁平结构，
 * 因此 evaluateUtility / utilityBest / snapshotUtility 无需任何改动。
 *
 * 资产关系：
 *   UtilityAgent { name, compensation_factor, momentum_bonus, makers:[{id,name,decisions:[id…]}] }
 *   UtilityDecision { name, weight, has_no_target, enable_cache_per_target,
 *                     target_filters:[filterId…], considerations:[consId…],
 *                     actions:{ execution_mode:'Sequence'|'Parallel',
 *                               keep_running_until_finished, max_repeat_count, action_list:[taskId…] } }
 *   UtilityConsideration { name, has_no_target, input_id, input_normalization_id,
 *                          response_curve:{ type:'Linear'|'Exponential'|'Logistic', slope, exponent, x_shift, y_shift } }
 *   UtilityInput { name, source }            // source 用本项目知识层路径语法（bb:/mem:/ws:/belief:/target:/self:/dist），是参考项目 Input 的超集
 *   UtilityNormalization { name, type, min_value, max_value, input_id? }
 *   UtilityTargetFilter { name, type:'EnemyFilter'|'AllyFilter'|'AnyFilter' }
 *   UtilityActionTask { name, category, command, params? }   // command = 模板图指令名（指令模式桥）
 *
 * Decision ↔ action_list：选中一个决策 = 按其 execution_mode 下达整个动作序列
 * （Sequence 按序逐条 / Parallel 同时下达）；dd.command 取首动作指令，保持 brain.js 兼容。
 * ================================================================================ */

const FILTER_KIND = {
  EnemyFilter: 'enemy', AllyFilter: 'ally', AnyFilter: 'any',
  UtilityAgentFilter: 'agent', OtherAgentFilter: 'other_agent',
  OtherEntityFilter: 'other_entity', WithinDistanceFilter: 'within_distance',
};

function bakeAssetCurveType(t = '') {
  const s = String(t).toLowerCase();
  if (s.includes('exp') || s.includes('polynomial') || s.includes('quadric')) return 1;
  if (s.includes('linear') || s.includes('constant')) return 0;
  return 2; // logistic 及所有 bell/sine 近似
}

export function bakeUtilityAssets({ agent, decisions = [], considerations = [], inputs = [], normalizations = [], filters = [], actionTasks = [] }) {
  const consById = Object.fromEntries(considerations.map((c) => [c.id, c]));
  const normById = Object.fromEntries(normalizations.map((n) => [n.id, n]));
  const inputById = Object.fromEntries(inputs.map((i) => [i.id, i]));
  const filterById = Object.fromEntries(filters.map((f) => [f.id, f]));
  const taskById = Object.fromEntries(actionTasks.map((t) => [t.id, t]));
  const decById = Object.fromEntries(decisions.map((d) => [d.id, d]));

  const bakeDecision = (dec) => {
    const cons = (dec.considerations || []).map((id) => consById[id]).filter(Boolean);
    const n = cons.length;
    const dd = {
      id: dec.id, name: dec.name, weight: dec.weight ?? 1, n,
      noTarget: !!dec.has_no_target,
      filter: FILTER_KIND[filterById[(dec.target_filters || [])[0]]?.type] || 'any',
      filters: (dec.target_filters || []).map((id) => filterById[id]).filter(Boolean)
        .map((f) => ({ id: f.id, name: f.name, kind: FILTER_KIND[f.type] || 'any', param: f.max_distance ?? null })),
      cachePerTarget: !!dec.enable_cache_per_target,
      command: null,
      actions: [],
      execution: {
        mode: ['Parallel', 'ParallelComplete'].includes(dec.actions?.execution_mode) ? dec.actions.execution_mode : 'Sequence',
        keepRunning: !!dec.actions?.keep_running_until_finished,
        maxRepeat: dec.actions?.max_repeat_count ?? 0,   // 对齐参考项目：默认 0，≤0 无限重复直到失败
      },
      src: new Array(n), normT: new Uint8Array(n), nMin: new Float32Array(n), nMax: new Float32Array(n),
      curveT: new Uint8Array(n), slope: new Float32Array(n), expo: new Float32Array(n),
      xs: new Float32Array(n), ys: new Float32Array(n),
      consNames: cons.map((c) => c.name || c.id),
      out: { score: 0, bestTarget: null, final: 0 },
    };
    dd.actions = (dec.actions?.action_list || []).map((id) => taskById[id]).filter(Boolean)
      .map((t) => ({ id: t.id, name: t.name, category: t.category || '内置', command: t.command || null, params: t.params || null }));
    const firstCmd = dd.actions.find((a) => a.command);
    if (firstCmd) dd.command = { name: firstCmd.command };
    cons.forEach((c, k) => {
      const input = inputById[c.input_id];
      const norm = normById[c.input_normalization_id];
      dd.src[k] = input?.source || 'bb:none';
      dd.normT[k] = NT[norm?.type || 'range'] ?? 0;
      dd.nMin[k] = norm?.min_value ?? 0; dd.nMax[k] = norm?.max_value ?? 100;
      const cv = c.response_curve || {};
      dd.curveT[k] = bakeAssetCurveType(cv.type);
      dd.slope[k] = cv.slope ?? -1; dd.expo[k] = cv.exponent ?? 1;
      dd.xs[k] = cv.x_shift ?? 0; dd.ys[k] = cv.y_shift ?? 1;
    });
    return dd;
  };

  return {
    name: agent?.name || 'utility.assets',
    compensation: agent?.compensation_factor !== false,
    compensationMethod: agent?.compensation_method || (agent?.compensation_factor !== false ? 'factor' : 'none'),
    momentumBonus: agent?.momentum_bonus ?? 1.1,
    makers: (agent?.makers || []).map((m) => ({
      id: m.id || m.name, name: m.name,
      decisions: (m.decisions || []).map((id) => decById[id]).filter(Boolean).map(bakeDecision),
    })),
    current: {},
  };
}

// 选中决策的完整动作序列（执行语义随决策一起返回）
export function utilityActions(set, makerName) {
  const m = set.makers.find((x) => x.name === makerName || x.id === makerName);
  if (!m?.best) return null;
  return { decision: m.best.name, execution: m.best.execution, actions: m.best.actions, target: m.best.out.bestTarget };
}

// 资产引用统计（资产页"被引用 N 次"徽标 / 删除保护用）
export function countAssetRefs({ agents = [], decisions = [], considerations = [] }) {
  const refs = { decision: {}, consideration: {}, filter: {}, task: {}, input: {}, norm: {} };
  const bump = (o, id) => { if (id) o[id] = (o[id] || 0) + 1; };
  for (const a of agents) for (const m of a.makers || []) for (const id of m.decisions || []) bump(refs.decision, id);
  for (const d of decisions) {
    for (const id of d.considerations || []) bump(refs.consideration, id);
    for (const id of d.target_filters || []) bump(refs.filter, id);
    for (const id of d.actions?.action_list || []) bump(refs.task, id);
  }
  for (const c of considerations) { bump(refs.input, c.input_id); bump(refs.norm, c.input_normalization_id); }
  return refs;
}
