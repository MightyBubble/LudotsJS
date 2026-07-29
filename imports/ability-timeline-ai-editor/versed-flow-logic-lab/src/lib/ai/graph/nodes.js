// GraphVM 节点库 —— 蓝图式节点注册表。
// 端口类型：number / bool / string / any / array / object；exec 为控制流（白色三角）。
// 同步节点：eval(props, api)，可返回 execOut key；纯数据节点 execIn=false。
// 异步（latent）节点：enter(props, api) + step(props, api, state) —— 挂起后每 tick 恢复。

import { defineNode } from './graphvm.js';

const num = (key, dflt = 0) => ({ key, type: 'number', default: dflt });
const bool = (key, dflt = false) => ({ key, type: 'bool', default: dflt });
const any = (key, dflt) => ({ key, type: 'any', default: dflt });

// ─────────── 流程 ───────────
defineNode('flow.start', {
  label: '开始', category: '流程', color: '#22c55e',
  execIn: false, execOut: ['then'],
  eval: () => 'then',
});

defineNode('flow.exit', {
  label: '结束（返回状态）', category: '流程', color: '#ef4444',
  execOut: [],
  dataIn: [bool('value', true)],
  propsSchema: { status: { type: 'select', options: ['success', 'failure'], default: 'success' } },
  eval: (p, api) => { api.finish(api.prop('status', 'success') !== 'failure', api.get('value')); },
});

defineNode('flow.branch', {
  label: '分支 Branch', category: '流程', color: '#eab308',
  execOut: ['true', 'false'],
  dataIn: [bool('cond')],
  eval: (p, api) => (api.get('cond') ? 'true' : 'false'),
});

defineNode('flow.sequence', {
  label: '顺序 Sequence', category: '流程', color: '#eab308',
  execOut: ['s0', 's1', 's2', 's3'],
  propsSchema: { count: { type: 'int', default: 2, min: 2, max: 4 } },
  eval: (p, api) => { const n = Math.min(api.prop('count', 2), 4); for (let i = n - 1; i >= 0; i--) api.fire(`s${i}`); },
});

defineNode('flow.forEach', {
  label: '遍历 ForEach（循环体可含异步节点）', category: '流程', color: '#eab308',
  execOut: ['body', 'done'],
  dataIn: [{ key: 'list', type: 'array', default: [] }],
  dataOut: [any('item'), num('index')],
  // 语义：首次到达 → 第 0 项并进入循环体；循环体末尾连回本节点 exec → 下一项；
  // 迭代状态存在 run.scratch 里（循环体内的异步节点挂起/恢复不影响迭代）。
  eval: (p, api) => {
    if (!api.viaExec) return; // 被数据依赖拉动时只读当前 item/index 槽，不推进迭代
    const st = api.scratch();
    if (!st.active) {
      st.list = api.get('list') || [];
      st.i = 0;
      st.active = true;
    } else {
      st.i++;
    }
    if (st.i >= st.list.length) { st.active = false; st.list = null; return 'done'; }
    api.set('item', st.list[st.i]);
    api.set('index', st.i);
    return 'body';
  },
});

defineNode('flow.delay', {
  label: '延迟 Delay（异步）', category: '流程', color: '#a855f7',
  latent: true,
  dataIn: [num('seconds', 1)],
  enter: (p, api) => api.suspend({ t: api.get('seconds') }),
  step: (p, api, st) => { st.t -= api.dt; if (st.t <= 0) api.fire('then'); else api.suspend(st); },
});

defineNode('flow.waitUntil', {
  label: '等待条件 WaitUntil（异步）', category: '流程', color: '#a855f7',
  latent: true,
  dataIn: [bool('cond')],
  enter: (p, api) => { if (api.get('cond')) api.fire('then'); else api.suspend({}); },
  step: (p, api) => { if (api.get('cond')) api.fire('then'); else api.suspend({}); },
});

defineNode('flow.callFunction', {
  label: '调用函数 CallFunction', category: '流程', color: '#3b82f6',
  execOut: ['then', 'failed'], callRef: 'graph',
  propsSchema: { graph: { type: 'graphRef', kind: 'function' } },
  eval: (p, api) => {
    const cg = api.node().callee;
    if (!cg) { api.fire('failed'); return; }
    const args = {};
    for (const inp of cg.inputs) args[inp.key] = api.get(inp.key);
    api.callGraph(cg, args);
  },
});

defineNode('macro.in', {
  label: '宏入口', category: '流程', color: '#f97316',
  execIn: false, execOut: ['then'], dataOut: [],
  eval: () => 'then',
});
defineNode('macro.out', {
  label: '宏出口', category: '流程', color: '#f97316',
  execOut: [],
  eval: () => {},
});
// 宏实例：编译期内联展开（无调用开销）。数据端口按名缝合，exec 单进单出穿透。
// 端口形状由被引用宏图的 macro.in/macro.out 声明（编辑器展示用；编译期该节点被替换掉）。
defineNode('macro.ref', {
  label: '宏 Macro（内联）', category: '流程', color: '#f97316',
  macroRef: 'macro',
  propsSchema: { macro: { type: 'graphRef', kind: 'macro' } },
  eval: () => 'then',
});

// ─────────── 数据（纯，execIn=false） ───────────
const pure = { execIn: false, execOut: [] };

defineNode('data.const', {
  label: '常量', category: '数据', color: '#64748b', ...pure,
  dataOut: [any('value')],
  propsSchema: { value: { type: 'any', default: 0 } },
  eval: (p, api) => api.set('value', api.prop('value', 0)),
});

defineNode('data.input', {
  label: '图输入', category: '数据', color: '#0ea5e9', ...pure,
  dataOut: [any('value')],
  propsSchema: { key: { type: 'string', default: '' } },
  eval: (p, api) => api.set('value', api.input(api.prop('key', ''))),
});

defineNode('data.output', {
  label: '图输出', category: '数据', color: '#0ea5e9', ...pure, sink: true,
  dataIn: [any('value')],
  propsSchema: { key: { type: 'string', default: '' } },
  eval: (p, api) => api.output(api.prop('key', ''), api.get('value')),
});

defineNode('data.math', {
  label: '数学', category: '数据', color: '#64748b', ...pure,
  dataIn: [num('a'), num('b')],
  dataOut: [num('value')],
  propsSchema: { op: { type: 'select', options: ['add', 'sub', 'mul', 'div', 'mod', 'min', 'max', 'abs', 'floor', 'round'], default: 'add' } },
  eval: (p, api) => {
    const a = api.get('a') || 0, b = api.get('b') || 0;
    const op = api.prop('op', 'add');
    const v = op === 'add' ? a + b : op === 'sub' ? a - b : op === 'mul' ? a * b
      : op === 'div' ? (b === 0 ? 0 : a / b) : op === 'mod' ? (b === 0 ? 0 : a % b)
      : op === 'min' ? Math.min(a, b) : op === 'max' ? Math.max(a, b)
      : op === 'abs' ? Math.abs(a) : op === 'floor' ? Math.floor(a) : Math.round(a);
    api.set('value', v);
  },
});

defineNode('data.clamp', {
  label: '夹取 Clamp', category: '数据', color: '#64748b', ...pure,
  dataIn: [num('v'), num('min', 0), num('max', 1)],
  dataOut: [num('value')],
  eval: (p, api) => api.set('value', Math.max(api.get('min'), Math.min(api.get('max'), api.get('v')))),
});

defineNode('data.compare', {
  label: '比较', category: '数据', color: '#64748b', ...pure,
  dataIn: [num('a'), num('b')],
  dataOut: [bool('value')],
  propsSchema: { op: { type: 'select', options: ['==', '!=', '<', '<=', '>', '>='], default: '>' } },
  eval: (p, api) => {
    const a = api.get('a'), b = api.get('b');
    const op = api.prop('op', '>');
    api.set('value', op === '==' ? a === b : op === '!=' ? a !== b : op === '<' ? a < b
      : op === '<=' ? a <= b : op === '>' ? a > b : a >= b);
  },
});

defineNode('data.logic', {
  label: '逻辑', category: '数据', color: '#64748b', ...pure,
  dataIn: [bool('a'), bool('b')],
  dataOut: [bool('value')],
  propsSchema: { op: { type: 'select', options: ['and', 'or', 'not', 'xor'], default: 'and' } },
  eval: (p, api) => {
    const a = !!api.get('a'), b = !!api.get('b');
    const op = api.prop('op', 'and');
    api.set('value', op === 'and' ? a && b : op === 'or' ? a || b : op === 'not' ? !a : (a !== b));
  },
});

defineNode('data.select', {
  label: '选择 Select', category: '数据', color: '#64748b', ...pure,
  dataIn: [bool('cond'), any('a'), any('b')],
  dataOut: [any('value')],
  eval: (p, api) => api.set('value', api.get('cond') ? api.get('a') : api.get('b')),
});

defineNode('data.random', {
  label: '随机 0..1', category: '数据', color: '#64748b', ...pure,
  dataOut: [num('value')],
  eval: (p, api) => api.set('value', (api.ctx?.rng || Math.random)()),
});

defineNode('data.length', {
  label: '数组长度', category: '数据', color: '#64748b', ...pure,
  dataIn: [{ key: 'list', type: 'array', default: [] }],
  dataOut: [num('value')],
  eval: (p, api) => api.set('value', (api.get('list') || []).length),
});

defineNode('data.at', {
  label: '数组取项', category: '数据', color: '#64748b', ...pure,
  dataIn: [{ key: 'list', type: 'array', default: [] }, num('index')],
  dataOut: [any('value')],
  eval: (p, api) => api.set('value', (api.get('list') || [])[api.get('index') | 0]),
});

defineNode('data.now', {
  label: '当前时间', category: '数据', color: '#64748b', ...pure,
  dataOut: [num('value')],
  eval: (p, api) => api.set('value', api.ctx?.time ?? 0),
});

// ─────────── 知识（BB 客观 / Mem 记录 / WorldState 位 / Belief 主观） ───────────
defineNode('kb.bbGet', {
  label: '黑板读取 BB.Get', category: '知识', color: '#0ea5e9', ...pure,
  dataOut: [any('value')],
  propsSchema: { key: { type: 'string', default: '' } },
  eval: (p, api) => api.set('value', api.ctx?.bb?.get(api.prop('key', ''))),
});
defineNode('kb.bbSet', {
  label: '黑板写入 BB.Set', category: '知识', color: '#0ea5e9',
  dataIn: [any('value')],
  propsSchema: { key: { type: 'string', default: '' } },
  eval: (p, api) => { api.ctx?.bb?.set(api.prop('key', ''), api.get('value')); return 'then'; },
});
defineNode('kb.memAdd', {
  label: '记忆写入 Mem.Add', category: '知识', color: '#14b8a6',
  dataIn: [any('data')],
  propsSchema: { type: { type: 'string', default: 'event' } },
  eval: (p, api) => { api.ctx?.mem?.add(api.prop('type', 'event'), api.get('data')); return 'then'; },
});
defineNode('kb.memCount', {
  label: '记忆计数 Mem.Count', category: '知识', color: '#14b8a6', ...pure,
  dataOut: [num('value')],
  propsSchema: { type: { type: 'string', default: 'event' }, within: { type: 'number', default: 30 } },
  eval: (p, api) => api.set('value', api.ctx?.mem?.count(api.prop('type', 'event'), api.prop('within', 30)) ?? 0),
});
defineNode('kb.wsGet', {
  label: '世界状态位 WS.Get', category: '知识', color: '#f43f5e', ...pure,
  dataOut: [bool('value')],
  propsSchema: { bit: { type: 'string', default: '' } },
  eval: (p, api) => api.set('value', api.ctx?.ws?.get(api.prop('bit', '')) ?? false),
});
defineNode('kb.wsSet', {
  label: '世界状态位 WS.Set', category: '知识', color: '#f43f5e',
  dataIn: [bool('value', true)],
  propsSchema: { bit: { type: 'string', default: '' } },
  eval: (p, api) => { api.ctx?.ws?.set(api.prop('bit', ''), !!api.get('value')); return 'then'; },
});
defineNode('kb.beliefGet', {
  label: '主观认识 Belief.Get', category: '知识', color: '#8b5cf6', ...pure,
  dataOut: [num('value')],
  propsSchema: { key: { type: 'string', default: '' } },
  eval: (p, api) => api.set('value', api.ctx?.beliefs?.get(api.prop('key', '')) ?? 0),
});

// ─────────── 曲线 ───────────
defineNode('curve.eval', {
  label: '归一化 × 响应曲线', category: '曲线', color: '#d946ef', ...pure,
  dataIn: [num('raw')],
  dataOut: [num('value')],
  propsSchema: {
    normType: { type: 'select', options: ['range', 'divide', 'gte', 'lte', 'bool'], default: 'range' },
    min: { type: 'number', default: 0 }, max: { type: 'number', default: 100 },
    curve: { type: 'select', options: ['linear', 'exponential', 'logistic'], default: 'logistic' },
    slope: { type: 'number', default: -1 }, exponent: { type: 'number', default: 1 },
    xShift: { type: 'number', default: 0 }, yShift: { type: 'number', default: 1 },
  },
  eval: (p, api) => {
    const raw = api.get('raw') || 0;
    const t = api.prop('normType', 'range');
    const mn = api.prop('min', 0), mx = api.prop('max', 100);
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const x = t === 'bool' ? (raw ? 1 : 0) : t === 'divide' ? clamp01(mx === 0 ? 0 : raw / mx)
      : t === 'gte' ? (raw >= mx ? 1 : 0) : t === 'lte' ? (raw <= mx ? 1 : 0)
      : clamp01(mx === mn ? 0 : (raw - mn) / (mx - mn));
    const c = api.prop('curve', 'logistic');
    const s = api.prop('slope', -1), e = api.prop('exponent', 1);
    const xs = api.prop('xShift', 0), ys = api.prop('yShift', 1);
    api.set('value', c === 'exponential' ? clamp01(Math.pow(x, e))
      : c === 'linear' ? clamp01(x * s + ys)
      : clamp01(ys / (1 + Math.exp(s * 10 * (x - 0.5 - xs)))));
  },
});

// ─────────── AI ───────────
defineNode('ai.utilityScore', {
  label: '效用评分（指定决策）', category: 'AI', color: '#f59e0b', ...pure,
  dataIn: [any('target')],
  dataOut: [num('value')],
  propsSchema: { decision: { type: 'string', default: '' } },
  eval: (p, api) => api.set('value', api.ctx?.utility?.score(api.prop('decision', ''), api.get('target') ?? null) ?? 0),
});
defineNode('ai.bestOption', {
  label: '最优决策（DecisionMaker）', category: 'AI', color: '#f59e0b', ...pure,
  dataOut: [{ key: 'name', type: 'string', default: '' }, any('target'), num('score')],
  propsSchema: { maker: { type: 'string', default: '' } },
  eval: (p, api) => {
    const best = api.ctx?.utility?.best(api.prop('maker', ''));
    api.set('name', best?.name || ''); api.set('target', best?.target ?? null); api.set('score', best?.score ?? 0);
  },
});
defineNode('ai.self', {
  label: '自身属性', category: 'AI', color: '#f59e0b', ...pure,
  dataOut: [any('value')],
  propsSchema: { prop: { type: 'string', default: 'x' } },
  eval: (p, api) => api.set('value', api.ctx?.self?.[api.prop('prop', 'x')]),
});
defineNode('ai.target', {
  label: '目标属性', category: 'AI', color: '#f59e0b', ...pure,
  dataOut: [any('value')],
  propsSchema: { prop: { type: 'string', default: 'x' } },
  eval: (p, api) => {
    const t = api.ctx?.target;
    api.set('value', t && typeof t === 'object' ? t[api.prop('prop', 'x')] : undefined);
  },
});

// ─────────── 动作（指令模式边界：决策只发 Command，实现由模板图承担） ───────────
defineNode('act.command', {
  label: '下达指令 Command（异步）', category: '动作', color: '#10b981',
  latent: true,
  dataIn: [{ key: 'name', type: 'string', default: '' }, { key: 'params', type: 'object', default: null }],
  propsSchema: { wait: { type: 'bool', default: true } },
  enter: (p, api) => {
    const name = api.get('name') || api.prop('name', '');
    const params = api.get('params') || {};
    const done = api.ctx?.commands?.issue(name, params, api.ctx);
    if (!api.prop('wait', true) || done === true) { api.fire('then'); return; }
    api.suspend({});
  },
  step: (p, api) => {
    const st = api.ctx?.commands?.status();
    if (st === 'done') api.fire('then');
    else if (st === 'failed') api.finish(false);
    else api.suspend({});
  },
});
defineNode('act.log', {
  label: '日志', category: '动作', color: '#94a3b8',
  dataIn: [any('msg')],
  eval: (p, api) => { api.ctx?.log?.(api.get('msg')); return 'then'; },
});