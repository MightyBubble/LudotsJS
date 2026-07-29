const select = (key, label, options) => ({ key, label, type: 'select', options });
const text = (key, label = key) => ({ key, label, type: 'text' });
const number = (key, label = key) => ({ key, label, type: 'number' });
const bool = (key, label = key) => ({ key, label, type: 'bool' });
const list = (key, label = key) => ({ key, label, type: 'list' });
const tag = (key, label = key) => ({ key, label, type: 'tag' });
const effect = (key, label = key) => ({ key, label, type: 'effect' });

export const EFFECT_OBJECTS = {
  expireCondition: { title: '到期条件 expireCondition', fields: [select('kind', 'kind', ['TagPresent', 'TagAbsent']), tag('tag'), select('sense', 'sense', ['Raw', 'Effective'])] },
  duration: { title: '持续时间 duration', fields: [number('durationTicks'), number('periodTicks'), text('clockId')] },
  stack: { title: '叠加 stack', fields: [number('limit'), select('policy', 'policy', ['KeepDuration', 'RefreshDuration', 'AddDuration']), select('overflowPolicy', 'overflowPolicy', ['RejectNew', 'RemoveOldest'])] },
  targetQuery: { title: '目标查询 targetQuery', fields: [select('kind', 'kind', ['BuiltinSpatial', 'GraphProgram']), select('shape', 'shape', ['Circle', 'Cone', 'Rectangle', 'Line', 'Ring']), number('radius'), number('innerRadius'), number('halfAngle'), number('halfWidth'), number('halfHeight'), number('rotation'), number('length'), text('origin'), number('graphProgramId')] },
  targetFilter: { title: '目标过滤 targetFilter', fields: [text('relationFilter'), bool('excludeSource'), number('maxTargets'), list('layerMask')] },
  targetDispatch: { title: '目标分发 targetDispatch', fields: [text('preset'), effect('payloadEffect'), text('contextMapping.payloadSource'), text('contextMapping.payloadTarget'), text('contextMapping.payloadTargetContext')] },
  projectile: { title: '投射物 projectile', fields: [number('speed'), number('range'), number('arcHeight'), effect('impactEffect'), effect('hitEffect'), effect('presentationEffect'), select('travelMode', 'travelMode', ['Direction', 'TrackTarget']), select('impactPolicy', 'impactPolicy', ['DestroyOnFirstHit', 'ContinueOnHit']), number('collisionHalfWidth'), text('collisionRelationFilter'), bool('collisionExcludeSource'), number('maxHitCount')] },
  unitCreation: { title: '单位创建 unitCreation', fields: [select('placementPattern', 'placementPattern', ['Scatter', 'Circle']), select('facingPattern', 'facingPattern', ['RadialOutward', 'RadialInward', 'TangentClockwise', 'TangentCounterClockwise']), text('unitType'), text('templateId'), number('count'), number('offsetRadius'), number('placementRadiusCm'), number('placementStartAngleDeg'), effect('onSpawnEffect'), bool('copySourcePlayerOwner'), bool('linkSourceAsParent')] },
  displacement: { title: '位移 displacement', fields: [select('directionMode', 'directionMode', ['ToTarget', 'AwayFromSource', 'TowardSource', 'Fixed']), number('fixedDirectionDeg'), number('totalDistanceCm'), number('totalDurationTicks'), bool('overrideNavigation')] },
  relation: { title: '关系 relation', fields: [select('operation', 'operation', ['SetParent', 'RemoveParent', 'EnsureLink']), text('subject'), text('parent'), bool('snapSubjectToParentPosition'), text('relationshipType')] },
  revealArea: { title: '区域揭示 revealArea', fields: [number('radius'), text('scope'), list('layers'), number('memoryTtlTicks'), number('detectionStrength')] },
  submitOrderFromBlackboard: { title: '黑板订单 submitOrderFromBlackboard', fields: [text('source'), text('target'), text('storedTarget.targetKindKey'), text('storedTarget.targetPositionKey'), text('storedTarget.targetEntityKey'), text('storedTarget.hexQKey'), text('storedTarget.hexRKey'), text('pointMoveOrderTypeKey'), text('entityOrderTypeKey'), number('entityOrderIntArg0'), select('submitMode', 'submitMode', ['Immediate', 'Queued'])] },
  progression: { title: '成长完成 progression', fields: [text('id'), text('scope'), number('level'), number('delta')] },
};

export const MODIFIER_FIELDS = [{ key: 'attribute', label: 'attribute', type: 'attribute' }, select('op', 'op', ['Add', 'Multiply', 'Override']), number('value')];
export const GRANTED_TAG_FIELDS = [tag('tag'), text('formula'), number('amount'), number('base'), { key: 'graphProgram', label: 'graphProgram', type: 'graph' }];
export const PHASE_LISTENER_BASE_FIELDS = [tag('listenTag'), effect('listenEffectId'), select('phase', 'phase', ['OnPropose', 'OnCalculate', 'OnResolve', 'OnHit', 'OnApply', 'OnPeriod', 'OnExpire', 'OnRemove']), select('scope', 'scope', ['Source', 'Target']), select('action', 'action', ['Graph', 'Event', 'Both']), number('priority')];
export const CONFIG_PARAM_FIELDS = [text('type'), { key: 'value', label: 'value (JSON)', type: 'json' }];