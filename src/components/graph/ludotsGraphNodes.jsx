import { Braces, Calculator, Database, GitBranch, Link, MapPin, Play, Settings2, Tag, Zap } from 'lucide-react';
import { CSHARP_GRAPH_OPS } from '@/lib/runtime/csharpGraphContract';
import { getLudotsNodeText } from './ludotsNodeI18n';

export const RUNTIME_FLOW_OPS = new Set([
  'Jump','JumpIfFalse','ApplyEffectTemplate','FanOutApplyEffect','ApplyEffectDynamic','FanOutApplyEffectDynamic','RemoveEffectTemplate','FanOutDispatchEffect','FanOutDispatchEffectDynamic','ModifyAttributeAdd','SendEvent',
  'WriteBlackboardFloat','WriteBlackboardInt','WriteBlackboardEntity','WriteSelfAttribute','RelationshipEnsureLink','RelationshipRemoveLink','RelationshipSetMetric','RelationshipAddMetric','RelationshipSetFlag','BeginLifecycleTransaction','InvokeBuiltin'
]);

const fields = {
  ConstBool: [['boolValue','boolean',false]], ConstInt: [['intValue','number',0]], ConstFloat: [['floatValue','number',0]],
  LoadAttribute: [['attribute','text','']], LoadSelfAttribute: [['attribute','text','']], WriteSelfAttribute: [['attribute','text','']], HasTag: [['tag','text','']],
  ApplyEffectTemplate: [['effectTemplate','text','']], FanOutApplyEffect: [['effectTemplate','text','']], RemoveEffectTemplate: [['effectTemplate','text','']],
  ReadBlackboardFloat: [['blackboardKey','text','']], ReadBlackboardInt: [['blackboardKey','text','']], ReadBlackboardEntity: [['blackboardKey','text','']], WriteBlackboardFloat: [['blackboardKey','text','']], WriteBlackboardInt: [['blackboardKey','text','']], WriteBlackboardEntity: [['blackboardKey','text','']],
  LoadConfigFloat: [['configKey','text','']], LoadConfigInt: [['configKey','text','']], LoadConfigEffectId: [['configKey','text','']],
  QueryRadius: [['radiusCm','number',0],['queryCapacityPolicy','text','']], QueryCone: [['rangeCm','number',0],['directionDeg','number',0],['halfAngleDeg','number',0]], QueryRectangle: [['halfWidthCm','number',0],['halfHeightCm','number',0],['rotationDeg','number',0]], QueryLine: [['lengthCm','number',0],['halfWidthCm','number',0]],
  QueryHexRange: [['hexRadius','number',0]], QueryHexRing: [['hexRadius','number',0]], QueryFilterLayer: [['layerMask','number',0]], QueryFilterRelationship: [['relationshipMode','text','']], QueryLimit: [['limit','number',1]],
  QueryFilterTeam: [['teamId','number',0]], QueryFilterTemplate: [['template','text','']], QueryFilterAttributeRange: [['attribute','text','']], QueryFilterTagAny: [['tag','text','']], QueryFilterTagNone: [['tag','text','']], QuerySortByAttribute: [['attribute','text',''],['descending','boolean',false]],
  AggSumAttribute: [['attribute','text','']], AggAverageAttribute: [['attribute','text','']], AggMaxAttribute: [['attribute','text','']], AggMinAttribute: [['attribute','text','']], AggMaxEntityByAttribute: [['attribute','text','']], AggMinEntityByAttribute: [['attribute','text','']],
  RelationshipEnsureLink: [['relationshipType','text','']], RelationshipRemoveLink: [['relationshipType','text','']], RelationshipSetMetric: [['relationshipType','text',''],['metric','text','']], RelationshipAddMetric: [['relationshipType','text',''],['metric','text','']], RelationshipGetMetric: [['relationshipType','text',''],['metric','text','']], RelationshipHasFlag: [['relationshipType','text',''],['flag','text','']], RelationshipSetFlag: [['relationshipType','text',''],['flag','text','']], RelationshipHasLink: [['relationshipType','text','']],
  RelationshipQueryOutgoing: [['relationshipType','text','']], RelationshipQueryIncoming: [['relationshipType','text','']], RelationshipQueryMutual: [['relationshipType','text','']], RelationshipQueryBetweenPair: [['relationshipType','text','']], RelationshipFilterMetricRange: [['metric','text','']], RelationshipFilterFlag: [['flag','text','']], RelationshipSortByMetric: [['metric','text',''],['descending','boolean',false]], RelationshipAggSumMetric: [['metric','text','']], RelationshipAggMaxMetric: [['metric','text','']], RelationshipAggAverageMetric: [['metric','text','']], RelationshipAggMinMetric: [['metric','text','']], RelationshipAggMaxEntityByMetric: [['metric','text','']], RelationshipAggMinEntityByMetric: [['metric','text','']],
  InvokeBuiltin: [['builtinHandler','text','']], LoadEventPayloadInt: [['payloadPreset','text','']], LoadEventPayloadFloat: [['payloadPreset','text','']], TargetListGet: [['slot','number',0]], BeginLifecycleTransaction: [['reason','text','']]
};

const unary = new Set(['AbsFloat','NegFloat','QuerySortStable','QueryLimit','QueryFilterNotEntity','QueryFilterLayer','QueryFilterRelationship','AggCount','AggMinByDistance','QueryHexRange','QueryHexRing','QueryHexNeighbors','RelationshipFilterMetricRange','RelationshipFilterFlag','RelationshipSortByMetric','RelationshipAggSumMetric','RelationshipAggMaxMetric','RelationshipAggAverageMetric','RelationshipAggMinMetric','RelationshipAggMaxEntityByMetric','RelationshipAggMinEntityByMetric','QueryFromCollection','QueryFilterTeam','QueryFilterTemplate','QueryFilterAttributeRange','QueryFilterTagAny','QueryFilterTagNone','QuerySortByAttribute','AggSumAttribute','AggAverageAttribute','AggMaxAttribute','AggMinAttribute','AggMaxEntityByAttribute','AggMinEntityByAttribute','ClampTargetToRange','SnapToNearestInCollection','SnapToNearestGraphEdge','KnowledgeHasProjection']);
const ternary = new Set(['ClampFloat','SelectEntity']);
const noInput = new Set(['ConstBool','ConstInt','ConstFloat','LoadCaster','LoadExplicitTarget','RandomFloat01','ReadBlackboardFloat','ReadBlackboardInt','ReadBlackboardEntity','LoadConfigFloat','LoadConfigInt','LoadConfigEffectId','LoadContextSource','LoadContextTarget','LoadContextTargetContext','LoadSelfAttribute','QueryAllMapEntities','LoadTargetPosX','LoadTargetPosY','LoadViewer','LoadEventPayloadInt','LoadEventPayloadFloat','BeginLifecycleTransaction']);
const voidOps = new Set(['Jump','WriteBlackboardFloat','WriteBlackboardInt','WriteBlackboardEntity','WriteSelfAttribute','ApplyEffectTemplate','FanOutApplyEffect','ApplyEffectDynamic','FanOutApplyEffectDynamic','RemoveEffectTemplate','FanOutDispatchEffect','FanOutDispatchEffectDynamic','ModifyAttributeAdd','SendEvent','RelationshipEnsureLink','RelationshipRemoveLink','RelationshipSetMetric','RelationshipAddMetric','RelationshipSetFlag','BeginLifecycleTransaction']);

const categoryFor = op => op.startsWith('Query') || op.startsWith('Agg') || op === 'TargetListGet' ? 'Ludots-查询聚合' : op.startsWith('Relationship') ? 'Ludots-关系' : op.includes('Blackboard') || op.startsWith('LoadConfig') ? 'Ludots-黑板配置' : op.includes('Effect') || op === 'SendEvent' || op === 'InvokeBuiltin' ? 'Ludots-效果执行' : /Float|Int|Compare|Select/.test(op) ? 'Ludots-数值逻辑' : op.startsWith('Load') || op === 'HasTag' ? 'Ludots-上下文' : 'Ludots-流程控制';
const iconFor = category => category.includes('查询') ? MapPin : category.includes('关系') ? Link : category.includes('黑板') ? Database : category.includes('效果') ? Zap : category.includes('数值') ? Calculator : category.includes('上下文') ? Braces : category.includes('流程') ? GitBranch : Settings2;
const inputCount = op => noInput.has(op) ? 0 : ternary.has(op) ? 3 : unary.has(op) ? 1 : op === 'Jump' ? 0 : op === 'JumpIfFalse' ? 1 : 2;

export const LUDOTS_GRAPH_NODE_TYPES = Object.fromEntries([...CSHARP_GRAPH_OPS].map(op => {
  const flow = RUNTIME_FLOW_OPS.has(op);
  const category = categoryFor(op);
  const dataInputs = Array.from({ length: inputCount(op) }, (_, i) => ({ id: `in${i}`, label: `Input ${i}`, type: 'any' }));
  return [`ludots_${op}`, {
    label: op, icon: flow ? Play : iconFor(category), category, graphTypes: ['action'], runtimeOp: op,
    getLocalizedText: locale => getLudotsNodeText(op, locale),
    configFields: (fields[op] || []).map(([key, type, defaultValue]) => ({ key, type, defaultValue })),
    defaultData: { runtimeOp: op, ...Object.fromEntries((fields[op] || []).map(([key,, value]) => [key, value])) },
    inputs: [...(flow ? [{ id: 'exec', label: 'Exec', type: 'exec' }] : []), ...dataInputs],
    outputs: [...(flow ? [{ id: 'exec_out', label: 'Next', type: 'exec' }] : []), ...(voidOps.has(op) ? [] : [{ id: 'value', label: 'Value', type: 'any' }])]
  }];
}));