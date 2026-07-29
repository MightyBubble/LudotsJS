// GraphVM —— 虚幻蓝图级图虚拟机：自定义函数、自定义 Macro、同步/异步节点。
//
// 设计（对齐 FlowCanvas/NodeCanvas 桥接思想）：
//   · 图 = 唯一计算载体。BT action、FSM action、transition condition、GOAP 动作实现、
//     HTN 原语实现——全部是同一种图（模板），不存在"一层概念包一层概念"。
//   · 端口两类：exec（白三角，控制流）/ data（有色圆点，数据流）。
//   · kind: 'script' 自由图 | 'function' 自定义函数（inputs/outputs 声明，CallFunction 调用）
//           | 'macro' 宏（编译期内联展开，无调用开销）| 'action'/'condition' 模板（BT/FSM 复用）。
//   · 同步节点一次 tick 内连续求值；异步节点（Delay/WaitUntil/RunCommand…）挂起帧、后续
//     tick 恢复 —— latent action 语义。
//   · SoA/0GC：compile() 一次性烘焙为扁平数组（宏已内联、数据槽索引、邻接表），运行实例
//     从对象池获取，数据槽预分配复用；tick 热路径不创建闭包、不分配临时对象。
//
// 图 JSON：
//   { name, kind, inputs: [{key,type,default}], outputs: [{key,type}],
//     nodes: [{ id, type, props }],
//     links: [{ from: [nodeId, port], to: [nodeId, port] }] }

export const NODE_TYPES = {};
export const NODE_CATEGORIES = ['流程', '数据', '知识', '曲线', 'AI', '动作'];

export function defineNode(type, def) {
  NODE_TYPES[type] = {
    label: type, category: '数据', color: '#64748b',
    execIn: true, execOut: ['then'], dataIn: [], dataOut: [], latent: false,
    ...def, type,
  };
}

// ─────────────────────────── 编译（烘焙为扁平结构） ───────────────────────────

export function compileGraph(graph, resolveGraph) {
  const g = expandMacros(graph, resolveGraph || (() => null));
  const nodeIds = g.nodes.map((n) => n.id);
  const nodeIndex = Object.fromEntries(nodeIds.map((id, i) => [id, i]));
  const slotOf = {}; // "nodeId.port" | "@inputs.key" | "@outputs.key" -> slot
  const slotDefault = [];
  let slotCount = 0;

  const nodes = g.nodes.map((n) => {
    let def = NODE_TYPES[n.type];
    if (!def) throw new Error(`未知节点类型: ${n.type} (${graph.name})`);
    let callee = null;
    if (def.callRef) {
      const refGraph = resolveGraph(n.props?.[def.callRef]);
      if (refGraph) {
        callee = refGraph.entryIndex !== undefined ? refGraph : compileGraph(refGraph, resolveGraph);
        def = {
          ...def,
          dataIn: callee.inputs.map((i) => ({ key: i.key, type: i.type, default: i.default })),
          dataOut: callee.outputs.map((o) => ({ key: o.key, type: o.type, default: undefined })),
        };
      }
    }
    const c = { type: n.type, def, props: n.props || {}, callee, dataOutSlots: {}, dataInLinks: {}, execOutLinks: {}, _done: false };
    for (const p of def.dataOut) {
      slotOf[`${n.id}.${p.key}`] = slotCount;
      c.dataOutSlots[p.key] = slotCount;
      slotDefault.push(undefined);
      slotCount++;
    }
    return c;
  });

  const inputSlots = {};
  for (const inp of g.inputs || []) {
    slotOf[`@inputs.${inp.key}`] = slotCount;
    inputSlots[inp.key] = slotCount;
    slotDefault.push(inp.default);
    slotCount++;
  }
  const outputSlots = {};
  for (const o of g.outputs || []) {
    slotOf[`@outputs.${o.key}`] = slotCount;
    outputSlots[o.key] = slotCount;
    slotDefault.push(undefined);
    slotCount++;
  }

  for (const l of g.links || []) {
    const [fn, fp] = l.from, [tn, tp] = l.to;
    const fi = nodeIndex[fn], ti = nodeIndex[tn];
    if (fi === undefined || ti === undefined) throw new Error(`悬空连线 ${fn}.${fp} -> ${tn}.${tp} (${graph.name})`);
    if (fn === '@inputs') { nodes[ti].dataInLinks[tp] = slotOf[`@inputs.${fp}`]; continue; }
    if (tn === '@outputs') {
      // 直接写入输出槽：用 data.output 节点更直观，但允许 "@outputs" 虚拟端点 = 写入该槽
      nodes[fi].execOutLinks.__directOut = nodes[fi].execOutLinks.__directOut || {};
      continue;
    }
    const fdef = nodes[fi].def;
    if (fdef.execOut.includes(fp)) {
      (nodes[fi].execOutLinks[fp] = nodes[fi].execOutLinks[fp] || []).push(ti);
    } else {
      nodes[ti].dataInLinks[tp] = slotOf[`${fn}.${fp}`];
    }
  }

  // 槽 → 节点 反查表（数据依赖求值用）
  const owner = new Int32Array(slotCount).fill(-1);
  nodes.forEach((n, i) => { for (const k in n.dataOutSlots) owner[n.dataOutSlots[k]] = i; });
  // 输出汇节点（无 dataOut 的纯数据节点，如 data.output）：收尾时统一求值
  const sinks = [];
  nodes.forEach((n, i) => { if (n.def.sink) sinks.push(i); });

  return {
    name: g.name, kind: g.kind || 'script',
    inputs: g.inputs || [], outputs: g.outputs || [],
    inputSlots, outputSlots, nodes, nodeIds, nodeIndex, slotCount, slotDefault, owner, sinks,
    entryIndex: nodeIndex[(g.nodes.find((n) => n.type === 'flow.start') || g.nodes[0])?.id] ?? 0,
  };
}

// 宏内联：macro 节点（type 含 macroRef 声明，props 指向宏图 id）替换为内部图。
// 数据端口按名缝合；exec 支持单进单出穿透（macro.in.then / macro.out.exec）。防循环宏。
function expandMacros(graph, resolveGraph, depth = 0) {
  if (depth > 8) throw new Error(`宏嵌套过深: ${graph.name}`);
  const outNodes = [];
  let outLinks = [];
  for (const n of graph.nodes) {
    const def = NODE_TYPES[n.type];
    if (!def || !def.macroRef) { outNodes.push(n); continue; }
    const mg = resolveGraph(n.props?.[def.macroRef]);
    if (!mg) throw new Error(`宏引用未解析: ${n.props?.[def.macroRef]} (${graph.name})`);
    const inner = expandMacros(mg, resolveGraph, depth + 1);
    const prefix = `${n.id}/`;
    const inId = inner.nodes.find((x) => x.type === 'macro.in')?.id;
    const outId = inner.nodes.find((x) => x.type === 'macro.out')?.id;
    for (const x of inner.nodes) {
      if (x.id === inId || x.id === outId) continue;
      outNodes.push({ ...x, id: prefix + x.id });
    }
    const extIn = (graph.links || []).filter((l) => l.to[0] === n.id);   // 外部 → 宏
    const extOut = (graph.links || []).filter((l) => l.from[0] === n.id); // 宏 → 外部
    for (const l of inner.links || []) {
      let [fn, fp] = l.from, [tn, tp] = l.to;
      // 源端在 macro.in：换成外部进入宏节点对应端口的源
      if (fn === inId) {
        const ext = fp === 'then' ? extIn.find((e) => e.to[1] === 'exec') : extIn.find((e) => e.to[1] === fp);
        if (!ext) continue;
        outLinks.push({ from: [ext.from[0], ext.from[1]], to: [prefix + tn, tp] });
        continue;
      }
      // 汇端在 macro.out：扇出到外部从宏节点对应端口出发的所有连线
      if (tn === outId) {
        const exts = tp === 'exec' ? extOut.filter((e) => e.from[1] === 'then') : extOut.filter((e) => e.from[1] === tp);
        for (const e of exts) outLinks.push({ from: [prefix + fn, fp], to: [e.to[0], e.to[1]] });
        continue;
      }
      outLinks.push({ from: [prefix + fn, fp], to: [prefix + tn, tp] });
    }
  }
  // 外层未经过宏节点的连线
  const macroIds = new Set(graph.nodes.filter((n) => NODE_TYPES[n.type]?.macroRef).map((n) => n.id));
  for (const l of graph.links || []) {
    if (!macroIds.has(l.from[0]) && !macroIds.has(l.to[0])) outLinks.push(l);
  }
  return { ...graph, nodes: outNodes, links: outLinks };
}

// ─────────────────────────── 运行实例（池化，0GC） ───────────────────────────

export function createRun(compiled) {
  return {
    g: compiled, slots: new Array(compiled.slotCount),
    stack: new Array(256), sp: 0,
    wait: { node: -1, state: null },
    child: null, childCallNode: -1,
    status: 'running', output: false, outSlots: null,
    trace: null, budget: 0, scratch: {},
  };
}

const runPool = [];
export function obtainRun(compiled) { return resetRun(runPool.pop() || createRun(compiled), compiled); }
export function releaseRun(r) { if (runPool.length < 64) { r.child = null; runPool.push(r); } }

export function resetRun(r, compiled = r.g) {
  r.g = compiled;
  r.slots.length = compiled.slotCount;
  for (let i = 0; i < compiled.slotCount; i++) r.slots[i] = compiled.slotDefault[i];
  r.sp = 0; r.wait.node = -1; r.wait.state = null;
  r.child = null; r.childCallNode = -1;
  r.status = 'running'; r.output = false; r.outSlots = null;
  if (r.trace) r.trace.length = 0;
  r.scratch = {};
  return r;
}

export function startRun(r, args) {
  if (args) for (const k in args) {
    const s = r.g.inputSlots[k];
    if (s !== undefined) r.slots[s] = args[k];
  }
  r.sp = 0;
  r.stack[r.sp++] = r.g.entryIndex;
  return r;
}

function pullData(r, nodeIdx, portKey) {
  const node = r.g.nodes[nodeIdx];
  const srcSlot = node.dataInLinks[portKey];
  if (srcSlot === undefined) {
    if (node.props && Object.prototype.hasOwnProperty.call(node.props, portKey)) return node.props[portKey];
    const p = node.def.dataIn.find((x) => x.key === portKey);
    return p ? p.default : undefined;
  }
  return r.slots[srcSlot];
}

function evalDataDeps(r, nodeIdx, ctx, dt) {
  const node = r.g.nodes[nodeIdx];
  if (node._done) return;
  node._done = true;
  for (const portKey in node.dataInLinks) {
    const up = r.g.owner[node.dataInLinks[portKey]];
    if (up >= 0) evalDataDeps(r, up, ctx, dt);
  }
  node.def.eval(node.props, frameApi(r, nodeIdx, ctx, dt, false));
}

function clearDone(g) { for (let i = 0; i < g.nodes.length; i++) g.nodes[i]._done = false; }

function frameApi(r, nodeIdx, ctx, dt, viaExec = true) {
  const node = r.g.nodes[nodeIdx];
  return {
    ctx, dt, viaExec,
    node: () => node,
    input: (key) => r.slots[r.g.inputSlots[key]],
    get: (portKey) => pullData(r, nodeIdx, portKey),
    set: (portKey, v) => { r.slots[node.dataOutSlots[portKey]] = v; },
    prop: (k, dflt) => (node.props && node.props[k] !== undefined ? node.props[k] : dflt),
    fire: (execKey) => {
      const links = node.execOutLinks[execKey];
      if (links) for (let i = links.length - 1; i >= 0; i--) r.stack[r.sp++] = links[i];
    },
    fireAll: () => { for (const k in node.execOutLinks) { const links = node.execOutLinks[k]; for (let i = links.length - 1; i >= 0; i--) r.stack[r.sp++] = links[i]; } },
    finish: (ok, out) => { r.status = ok ? 'success' : 'failure'; if (out !== undefined) r.output = out; r.sp = 0; },
    // 挂起本帧：已入栈的后续节点保留到恢复后继续（分支不因挂起而丢失）
    suspend: (state) => { r.wait.node = nodeIdx; r.wait.state = state; },
    // 节点级暂存（循环节点的迭代状态等；随 run 重置）
    scratch: () => (r.scratch[nodeIdx] = r.scratch[nodeIdx] || {}),
    callGraph: (cg, args) => {
      const child = obtainRun(cg);
      startRun(child, args);
      r.child = child; r.childCallNode = nodeIdx; r.sp = 0;
    },
    output: (key, v) => { const s = r.g.outputSlots[key]; if (s !== undefined) r.slots[s] = v; },
    trace: (msg) => { if (r.trace) r.trace.push({ node: r.g.nodeIds[nodeIdx], type: node.type, msg }); },
  };
}

function finalizeOutputs(r, ctx, dt) {
  // 输出汇节点（data.output 等无 dataOut 的纯数据节点）没有下游拉动，收尾时统一求值一次
  if (ctx) {
    clearDone(r.g);
    for (let i = 0; i < r.g.sinks.length; i++) evalDataDeps(r, r.g.sinks[i], ctx, dt ?? 0);
  }
  const outs = {};
  for (const o of r.g.outputs) outs[o.key] = r.slots[r.g.outputSlots[o.key]];
  r.outSlots = outs;
}

export function tickRun(r, ctx, dt, budget = 512) {
  if (r.status !== 'running') return r.status;
  r.budget = budget;

  if (r.child) {
    tickRun(r.child, ctx, dt, budget);
    if (r.child.status === 'running') return 'running';
    finalizeOutputs(r.child);
    const callNode = r.g.nodes[r.childCallNode];
    const outs = r.child.outSlots || {};
    for (const k in callNode.dataOutSlots) r.slots[callNode.dataOutSlots[k]] = outs[k];
    const st = r.child.status;
    releaseRun(r.child);
    r.child = null;
    frameApi(r, r.childCallNode, ctx, dt).fire(st === 'success' || !callNode.def.execOut.includes('failed') ? 'then' : 'failed');
  }

  if (r.wait.node >= 0) {
    const nodeIdx = r.wait.node;
    r.wait.node = -1;
    const saved = r.wait.state;
    r.wait.state = null;
    clearDone(r.g);
    const wn = r.g.nodes[nodeIdx];
    for (const portKey in wn.dataInLinks) {
      const up = r.g.owner[wn.dataInLinks[portKey]];
      if (up >= 0) evalDataDeps(r, up, ctx, dt);
    }
    wn.def.step(wn.props, frameApi(r, nodeIdx, ctx, dt), saved);
    if (r.wait.node >= 0) return 'running';
    if (r.status !== 'running') { finalizeOutputs(r, ctx, dt); return r.status; }
  }

  while (r.sp > 0) {
    if (--r.budget <= 0) throw new Error(`GraphVM 超出单 tick 预算（疑似死循环）: ${r.g.name}`);
    const nodeIdx = r.stack[--r.sp];
    const node = r.g.nodes[nodeIdx];
    const def = node.def;
    if (r.trace) r.trace.push({ node: r.g.nodeIds[nodeIdx], type: node.type });
    clearDone(r.g);
    for (const portKey in node.dataInLinks) {
      const up = r.g.owner[node.dataInLinks[portKey]];
      if (up >= 0) evalDataDeps(r, up, ctx, dt);
    }
    const api = frameApi(r, nodeIdx, ctx, dt);
    if (def.latent) {
      if (r.wait.node === nodeIdx) {
        // 循环重入（ForEach 等）：body 尾部连回本节点 = 恢复而不是重启
        r.wait.node = -1;
        const saved = r.wait.state;
        r.wait.state = null;
        clearDone(r.g);
        def.step(node.props, api, saved);
      } else {
        def.enter(node.props, api);
      }
      if (r.wait.node >= 0) return 'running';
      if (r.status !== 'running') { finalizeOutputs(r, ctx, dt); return r.status; }
    } else if (def.callRef) {
      def.eval(node.props, api);
      if (r.child) return 'running';
    } else {
      const next = def.eval(node.props, api);
      if (r.status !== 'running') { finalizeOutputs(r, ctx, dt); return r.status; }
      if (r.wait.node >= 0 || r.child) return 'running';
      // 节点必须显式返回 exec key（或自行 fire）——不做隐式补发，避免重复触发
      if (next !== undefined && next !== null) api.fire(next);
    }
  }
  r.status = 'success';
  finalizeOutputs(r, ctx, dt);
  return r.status;
}

// 便捷一次性执行
export function runGraph(compiled, ctx, args, dt = 0, budget) {
  const r = obtainRun(compiled);
  startRun(r, args);
  const st = tickRun(r, ctx, dt, budget);
  return { run: r, status: st };
}
