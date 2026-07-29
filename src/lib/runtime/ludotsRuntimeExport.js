import { validateCSharpGraph } from './csharpGraphContract';

const EFFECT_FIELDS = [
  'tags','presetType','lifetime','participatesInResponse','expireCondition','duration','modifiers','targetQuery','targetFilter','targetDispatch','projectile',
  'unitCreation','displacement','relation','revealArea','submitOrderFromBlackboard','progression','phaseGraphs','phaseListeners','configParams','grantedTags','stack'
];
const CONFIG_TYPES = new Set(['Float','Int','EffectTemplate','Attribute','ExchangeOperation','EntityTemplate','LifecycleAttributeValueSource']);
const DEPLOY_GRAPH = {
  id: 'Graph.Lifecycle.DeployConsumeSource', kind: 'Effect', entry: 'begin', outputs: [],
  nodes: [
    { id: 'begin', op: 'BeginLifecycleTransaction', next: 'materialize' },
    { id: 'materialize', op: 'InvokeBuiltin', builtinHandler: 'MaterializeTemplate', next: 'copyIdentity' },
    { id: 'copyIdentity', op: 'InvokeBuiltin', builtinHandler: 'CopyIdentityComponents', next: 'copyAttrs' },
    { id: 'copyAttrs', op: 'InvokeBuiltin', builtinHandler: 'CopyAttributeSlice', next: 'clearFx' },
    { id: 'clearFx', op: 'InvokeBuiltin', builtinHandler: 'ClearActiveEffects', next: 'transferId' },
    { id: 'transferId', op: 'InvokeBuiltin', builtinHandler: 'TransferStableId', next: 'consume' },
    { id: 'consume', op: 'InvokeBuiltin', builtinHandler: 'ConsumeEntity' }
  ]
};

const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).map(([k, v]) => [k, clean(v)]));
  return value;
};

export function effectToCSharp(effect) {
  const output = { id: effect.effect_id };
  EFFECT_FIELDS.forEach(key => { if (effect[key] !== undefined) output[key] = clean(effect[key]); });
  return output;
}

export function graphToCSharp(record) {
  if (record.action_id === DEPLOY_GRAPH.id) return DEPLOY_GRAPH;
  let definition;
  try { definition = typeof record.graph_definition === 'string' ? JSON.parse(record.graph_definition) : record.graph_definition; }
  catch { throw new Error(`${record.action_id}: graph_definition 不是有效 JSON`); }
  const graph = definition?.runtimeGraph || (definition?.entry && definition?.nodes?.every(node => node.op) ? definition : null);
  if (!graph) throw new Error(`${record.action_id}: 缺少 C# runtimeGraph；旧画布节点不能直接导出`);
  return clean({ ...graph, id: record.action_id, kind: 'Effect', outputs: graph.outputs || [] });
}

export function buildRuntimeFiles(effects, actionGraphs) {
  const errors = [];
  const effectIds = new Set();
  effects.forEach((effect, index) => {
    if (!effect.effect_id) errors.push(`effects[${index}]: 缺少 effect_id`);
    if (effectIds.has(effect.effect_id)) errors.push(`Effect id 重复：${effect.effect_id}`);
    effectIds.add(effect.effect_id);
    Object.entries(effect.configParams || {}).forEach(([key, param]) => {
      if (!CONFIG_TYPES.has(param?.type)) errors.push(`${effect.effect_id}.configParams.${key}: 不支持类型 ${param?.type || '(空)'}`);
      if (param?.value === undefined || param?.value === null || param?.value === '') errors.push(`${effect.effect_id}.configParams.${key}: value 缺失`);
    });
  });
  const referenced = new Set();
  effects.forEach(effect => {
    Object.values(effect.phaseGraphs || {}).forEach(phase => { if (phase?.pre) referenced.add(phase.pre); if (phase?.post) referenced.add(phase.post); });
    (effect.phaseListeners || []).forEach(listener => { if (listener.graphProgram) referenced.add(listener.graphProgram); });
  });
  const records = new Map(actionGraphs.map(graph => [graph.action_id, graph]));
  const graphIds = new Set([...referenced, ...(effects.some(e => e.presetType === 'DeployConsumeSource') ? [DEPLOY_GRAPH.id] : [])]);
  const graphs = [];
  graphIds.forEach(id => {
    if (id.startsWith('Builtin.')) return;
    const record = records.get(id) || (id === DEPLOY_GRAPH.id ? { action_id: id } : null);
    if (!record) { errors.push(`缺少 Graph：${id}`); return; }
    try {
      const graph = graphToCSharp(record);
      validateCSharpGraph(graph).forEach(message => errors.push(`${id}: ${message}`));
      graphs.push(graph);
    } catch (error) { errors.push(error.message); }
  });
  return { errors, effects: effects.map(effectToCSharp), graphs };
}

export function downloadRuntimeJson(filename, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}