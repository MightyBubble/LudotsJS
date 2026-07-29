const fields = {
  TargetQuery: ['kind', 'shape', 'radius', 'innerRadius', 'halfAngle', 'halfWidth', 'halfHeight', 'rotation', 'length', 'origin', 'graphProgramId'],
  TargetFilter: ['relationFilter', 'excludeSource', 'maxTargets', 'layerMask'],
  TargetDispatch: ['preset', 'payloadEffect', 'contextMapping'],
  Projectile: ['speed', 'range', 'arcHeight', 'impactEffect', 'hitEffect', 'presentationEffect', 'travelMode', 'impactPolicy', 'collisionHalfWidth', 'collisionRelationFilter', 'collisionExcludeSource', 'maxHitCount'],
  UnitCreation: ['placementPattern', 'facingPattern', 'unitType', 'templateId', 'count', 'offsetRadius', 'placementRadiusCm', 'placementStartAngleDeg', 'onSpawnEffect', 'copySourcePlayerOwner', 'linkSourceAsParent'],
  Displacement: ['directionMode', 'fixedDirectionDeg', 'totalDistanceCm', 'totalDurationTicks', 'overrideNavigation'],
  Relation: ['operation', 'subject', 'parent', 'snapSubjectToParentPosition', 'relationshipType'],
  RevealArea: ['radius', 'scope', 'layers', 'memoryTtlTicks', 'detectionStrength'],
  SubmitOrderFromBlackboard: ['source', 'target', 'storedTarget', 'pointMoveOrderTypeKey', 'entityOrderTypeKey', 'entityOrderIntArg0', 'submitMode'],
};
const config = (id) => ({ id, label: `EffectTemplateData.${id}`, fields: fields[id] || [] });

export const EFFECT_BUILTIN_CONTRACTS = {
  'Builtin.ApplyModifiers': { context: ['Target'], configs: [{ id: 'Modifiers', label: 'EffectTemplateData.Modifiers', fields: ['attribute', 'op', 'value'] }], runtime: ['ModifierOverride?', 'EffectSideEffects?', 'TagOps?'], results: ['AttributeDelta'] },
  'Builtin.ApplyForce': { context: ['Target'], configs: [{ id: 'PresetAttributes', label: 'EffectTemplateData', fields: ['PresetAttribute0', 'PresetAttribute1'] }], params: ['ForceXAttribute : Float', 'ForceYAttribute : Float'], runtime: ['EffectSideEffects?', 'TagOps?'], results: ['AttributeDelta'] },
  'Builtin.SpatialQuery': { context: ['Source', 'Target', 'TargetContext'], configs: [config('TargetQuery')], params: ['merged EffectConfigParams'], runtime: ['SpatialQueries', 'ResolverBuffer'], results: ['ResolvedCandidateCount'] },
  'Builtin.DispatchPayload': { context: ['Source', 'Target', 'TargetContext'], configs: [config('TargetQuery'), config('TargetFilter'), config('TargetDispatch')], params: ['merged EffectConfigParams'], runtime: ['ResolverBuffer', 'ResolvedCandidateCount', 'FanOutBudget', 'FanOutCommands'], results: ['DroppedCount', 'ClearResolvedCandidates'] },
  'Builtin.ReResolveAndDispatch': { context: ['Source', 'Target', 'TargetContext'], configs: [config('TargetQuery'), config('TargetFilter'), config('TargetDispatch')], params: ['merged EffectConfigParams'], runtime: ['SpatialQueries', 'ResolverBuffer', 'FanOutBudget', 'FanOutCommands'], results: ['DroppedCount', 'ClearResolvedCandidates'] },
  'Builtin.CreateProjectile': { context: ['Source', 'Target', 'TargetContext'], configs: [config('Projectile')], params: ['preserved target point'], runtime: ['SpawnCommands', 'ProjectileRuntime'], results: ['Projectile spawn command'] },
  'Builtin.CreateUnit': { context: ['Source', 'TargetContext'], configs: [config('UnitCreation')], params: ['preserved target point'], runtime: ['SpawnCommands'], results: ['Unit spawn commands'] },
  'Builtin.ApplyDisplacement': { context: ['Source', 'Target', 'TargetContext'], configs: [config('Displacement')], params: ['preserved target point'], runtime: ['DisplacementState'], results: ['Target displacement'] },
  'Builtin.ApplyRelation': { context: ['Source', 'Target', 'TargetContext'], configs: [config('Relation')], runtime: ['RelationshipRuntime'], results: ['Relationship mutation'] },
  'Builtin.RevealArea': { context: ['Source'], configs: [config('RevealArea')], runtime: ['VisionRuntime'], results: ['Reveal contribution'] },
  'Builtin.DecayRevealArea': { context: ['Source'], configs: [config('RevealArea')], runtime: ['VisionRuntime'], results: ['Reveal decay'] },
  'Builtin.ExecuteExchange': { context: ['Source', 'Target', 'TargetContext'], params: ['ExchangeOperationId : Int', 'ExchangeScopeKey : Int'], runtime: ['ExchangeRuntime'], results: ['Exchange result'] },
  'Builtin.CompleteProgression': { context: ['Source', 'Target', 'TargetContext'], configs: [{ id: 'Progression', label: 'EffectTemplateData', fields: ['ProgressionId', 'ProgressionScope', 'ProgressionChange'] }], runtime: ['ProgressionRuntime'], results: ['Progression mutation'] },
  'Builtin.SubmitOrderFromBlackboard': { context: ['Source', 'Target', 'TargetContext'], configs: [config('SubmitOrderFromBlackboard')], runtime: ['Blackboard buffers', 'OrderSubmitter'], results: ['Order request'] },
};