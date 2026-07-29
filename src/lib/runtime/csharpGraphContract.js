export const CSHARP_GRAPH_OPS = new Set([
  'ConstBool','ConstInt','ConstFloat','LoadCaster','LoadExplicitTarget','Jump','JumpIfFalse','LoadAttribute',
  'AddFloat','MulFloat','SubFloat','DivFloat','MinFloat','MaxFloat','ClampFloat','AbsFloat','NegFloat','RandomFloat01',
  'AddInt','CompareGtFloat','CompareLtInt','CompareEqInt','HasTag','CompareEqEntity','SelectEntity',
  'QueryRadius','QuerySortStable','QueryLimit','QueryCone','QueryRectangle','QueryLine','QueryFilterNotEntity','QueryFilterLayer','QueryFilterRelationship',
  'AggCount','AggMinByDistance','TargetListGet','QueryHexRange','QueryHexRing','QueryHexNeighbors',
  'ApplyEffectTemplate','FanOutApplyEffect','ApplyEffectDynamic','FanOutApplyEffectDynamic','RemoveEffectTemplate','FanOutDispatchEffect','FanOutDispatchEffectDynamic','ModifyAttributeAdd','SendEvent',
  'ReadBlackboardFloat','ReadBlackboardInt','ReadBlackboardEntity','WriteBlackboardFloat','WriteBlackboardInt','WriteBlackboardEntity',
  'LoadConfigFloat','LoadConfigInt','LoadConfigEffectId','LoadContextSource','LoadContextTarget','LoadContextTargetContext','LoadSelfAttribute','WriteSelfAttribute',
  'RelationshipEnsureLink','RelationshipRemoveLink','RelationshipSetMetric','RelationshipAddMetric','RelationshipGetMetric','RelationshipHasFlag','RelationshipSetFlag',
  'RelationshipQueryOutgoing','RelationshipQueryIncoming','RelationshipQueryMutual','RelationshipQueryBetweenPair','RelationshipFilterMetricRange','RelationshipFilterFlag','RelationshipSortByMetric',
  'RelationshipAggSumMetric','RelationshipAggMaxMetric','RelationshipAggAverageMetric','QueryAllMapEntities','QueryFromCollection','QueryFilterTeam','QueryFilterTemplate',
  'QueryFilterAttributeRange','QueryFilterTagAny','QueryFilterTagNone','QuerySortByAttribute','AggSumAttribute','AggAverageAttribute','AggMaxAttribute','AggMinAttribute',
  'AggMaxEntityByAttribute','AggMinEntityByAttribute','RelationshipAggMinMetric','RelationshipAggMaxEntityByMetric','RelationshipAggMinEntityByMetric','RelationshipHasLink',
  'BeginLifecycleTransaction','InvokeBuiltin','LoadTargetPosX','LoadTargetPosY','ClampTargetToRange','IsPointInCircle','SnapToNearestInCollection','SnapToNearestGraphEdge',
  'LoadViewer','LoadEventPayloadInt','LoadEventPayloadFloat','ControlDomainResolve','ControlDomainControls','KnowledgeHasProjection'
]);

export const CSHARP_NODE_FIELDS = new Set([
  'id','op','next','inputs','floatValue','intValue','boolValue','tag','attribute','template','collectionKey','effectTemplate','blackboardKey','configKey',
  'validOutput','droppedOutput','queryCapacityPolicy','radiusCm','rangeCm','directionDeg','halfAngleDeg','lengthCm','halfWidthCm','halfHeightCm','rotationDeg',
  'hexRadius','layerMask','relationshipMode','limit','teamId','sort','relationshipType','metric','flag','reason','payloadPreset','builtinHandler','descending','slot'
]);

const CONFIG_LOADS = new Set(['LoadConfigFloat','LoadConfigInt','LoadConfigEffectId']);
const BLACKBOARD_OPS = new Set(['ReadBlackboardFloat','ReadBlackboardInt','ReadBlackboardEntity','WriteBlackboardFloat','WriteBlackboardInt','WriteBlackboardEntity']);

export function validateCSharpGraph(graph) {
  const errors = [];
  if (!graph?.id) errors.push('缺少 id');
  if (graph?.kind !== 'Effect') errors.push('kind 必须为 Effect');
  if (!Array.isArray(graph?.nodes) || !graph.nodes.length) errors.push('nodes 不能为空');
  const ids = new Set();
  (graph?.nodes || []).forEach((node, index) => {
    const at = `nodes[${index}]`;
    if (!node.id) errors.push(`${at}.id 缺失`); else if (ids.has(node.id)) errors.push(`${at}.id 重复：${node.id}`); else ids.add(node.id);
    if (!CSHARP_GRAPH_OPS.has(node.op)) errors.push(`${at}.op 不是 C# GraphNodeOp：${node.op || '(空)'}`);
    Object.keys(node).forEach(key => { if (!CSHARP_NODE_FIELDS.has(key)) errors.push(`${at}.${key} 不是 GraphNodeConfig 字段`); });
    if (CONFIG_LOADS.has(node.op) && !node.configKey) errors.push(`${at}.configKey 缺失`);
    if (BLACKBOARD_OPS.has(node.op) && !node.blackboardKey) errors.push(`${at}.blackboardKey 缺失`);
    if (node.op === 'InvokeBuiltin' && !node.builtinHandler) errors.push(`${at}.builtinHandler 缺失`);
  });
  if (graph?.entry && !ids.has(graph.entry)) errors.push(`entry 引用不存在：${graph.entry}`);
  if (!graph?.entry) errors.push('缺少 entry');
  (graph?.nodes || []).forEach((node, index) => {
    if (node.next && !ids.has(node.next)) errors.push(`nodes[${index}].next 引用不存在：${node.next}`);
    (node.inputs || []).forEach(input => { if (!ids.has(input)) errors.push(`nodes[${index}].inputs 引用不存在：${input}`); });
  });
  (graph?.outputs || []).forEach((output, index) => { if (!ids.has(output.source)) errors.push(`outputs[${index}].source 引用不存在：${output.source}`); });
  return errors;
}