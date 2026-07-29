// 模板库 —— 一切 Action / Condition 都是图（BT、FSM、GOAP、HTN、Utility 共用同一套）。
// 模板 = { id, name, kind: 'action'|'condition'|'function'|'macro'|'script', graph, compiled }
// 来源两个，合并加载：
//   · 内置默认（代码里的图 JSON —— 引擎语义，永远可用）
//   · 用户覆盖（GraphDef 实体 —— Graph 编辑器的产出，同名覆盖默认）
//
// 指令总线（Command Bus）：决策层（GOAP/HTN/Utility/BT/玩家）只下达 Command(name, params)；
// 实现 = 绑定了同名 command 的 action 模板图。决策与实现彻底分离，且每个指令都能追溯
// 到具体图节点（trace 开启时逐节点记录）。

import { compileGraph, obtainRun, releaseRun, startRun, tickRun, NODE_TYPES } from '../graph/graphvm.js';
import '../graph/nodes.js'; // 注册内置节点库

export function createTemplateLibrary(entityGraphs = [], builtins = []) {
  const templates = {};
  const byCommand = {};
  const resolve = (id) => {
    const row = entityGraphs.find((g) => g.name === id || g.id === id);
    return row?.data || builtins.find((g) => g.id === id || g.name === id)?.graph || null;
  };
  const register = (graph, kind, id, entityId = null) => {
    const t = {
      id: id || graph.name, name: graph.name, kind: kind || graph.kind || 'script',
      graph, entityId,
      compiled: compileGraph(graph, resolve),
    };
    templates[t.id] = t;
    if (graph.command) byCommand[graph.command] = t;
    return t;
  };
  for (const b of builtins) register(b.graph, b.kind, b.id);
  for (const row of entityGraphs) register(row.data, row.data?.kind, row.name, row.id);
  return { templates, byCommand, resolve, register };
}

// ── 指令总线：一个 agent 一个总线实例（0GC：run 来自池） ──
export function createCommandBus(library) {
  // 总线对外状态词汇：idle / running / done / failed（GraphVM 的 success/failure 在此归一化）
  const norm = (st) => (st === 'success' ? 'done' : st === 'failure' ? 'failed' : st);
  return {
    library,
    run: null, current: null, st: 'idle',
    traceEnabled: false, lastTrace: null,
    // 决策层唯一入口。返回 true=同步完成
    issue(name, params, ctx) {
      if (this.run) { releaseRun(this.run); this.run = null; } // 新指令抢占（决策层的特权）
      const t = this.library.byCommand[name] || this.library.templates[name];
      if (!t) { ctx?.log?.(`未知指令: ${name}`); this.st = 'failed'; return true; }
      this.run = obtainRun(t.compiled);
      if (this.traceEnabled) { this.run.trace = []; }
      startRun(this.run, params || {});
      this.current = { name, params, at: ctx?.time ?? 0, origin: params?.origin || 'unknown' };
      const st = tickRun(this.run, ctx, 0);
      this.st = norm(st);
      if (st !== 'running') {
        // 同步完成：与 tick 收尾路径一致 —— 捕获 trace 并归还运行实例（否则泄漏到下一次 issue）
        if (this.run.trace) this.lastTrace = { command: this.current?.name, trace: [...this.run.trace], result: norm(st) };
        releaseRun(this.run);
        this.run = null;
      }
      return st !== 'running';
    },
    tick(ctx, dt) {
      if (!this.run) { this.st = 'idle'; return this.st; }
      const st = tickRun(this.run, ctx, dt);
      if (st !== 'running') {
        if (this.run.trace) this.lastTrace = { command: this.current?.name, trace: [...this.run.trace], result: norm(st) };
        releaseRun(this.run);
        this.run = null;
      }
      this.st = this.run ? 'running' : norm(st);
      return this.st;
    },
    status() { return this.st; },
    cancel() { if (this.run) { releaseRun(this.run); this.run = null; } this.st = 'idle'; },
  };
}

// ── 内置通用模板（引擎级，永远可用；4X 专用模板在 world4x/content.js） ──
export const BUILTIN_TEMPLATES = [
  {
    id: 'cond.always', kind: 'condition',
    graph: {
      name: 'cond.always', kind: 'condition',
      inputs: [], outputs: [],
      nodes: [
        { id: 's', type: 'flow.start' },
        { id: 'e', type: 'flow.exit', props: { status: 'success', value: true } },
      ],
      links: [{ from: ['s', 'then'], to: ['e', 'exec'] }],
    },
  },
  {
    id: 'act.log', kind: 'action',
    graph: {
      name: 'act.log', kind: 'action', command: 'log',
      inputs: [{ key: 'msg', type: 'string', default: 'hello' }], outputs: [],
      nodes: [
        { id: 's', type: 'flow.start' },
        { id: 'i', type: 'data.input', props: { key: 'msg' } },
        { id: 'l', type: 'act.log' },
        { id: 'e', type: 'flow.exit', props: { status: 'success' } },
      ],
      links: [
        { from: ['s', 'then'], to: ['l', 'exec'] },
        { from: ['i', 'value'], to: ['l', 'msg'] },
        { from: ['l', 'then'], to: ['e', 'exec'] },
      ],
    },
  },
];
