const ENTRY_OUTPUTS = [
  { id: 'exec', label: '执行', type: 'exec' },
  { id: 'source', label: '施法者', type: 'entity' },
  { id: 'target', label: '目标', type: 'entity' },
  { id: 'effect', label: 'Effect Config', type: 'any' },
];

export const EFFECT_BUILTIN_OPERATIONS = [
  ['Builtin.ApplyForce', 'Apply Force', 'effect_apply_force'],
  ['Builtin.ApplyModifiers', 'Apply Modifiers', 'effect_apply_modifiers'],
  ['Builtin.SpatialQuery', 'Spatial Query', 'effect_spatial_query'],
  ['Builtin.DispatchPayload', 'Dispatch Payload', 'effect_dispatch_payload'],
  ['Builtin.ReResolveAndDispatch', 'Re-resolve And Dispatch', 'effect_reresolve_dispatch'],
  ['Builtin.CreateProjectile', 'Create Projectile', 'effect_create_projectile'],
  ['Builtin.CreateUnit', 'Create Unit', 'effect_create_unit'],
  ['Builtin.ApplyDisplacement', 'Apply Displacement', 'effect_apply_displacement'],
  ['Builtin.ApplyRelation', 'Apply Relation', 'effect_apply_relation'],
  ['Builtin.ExecuteExchange', 'Execute Exchange', 'effect_execute_exchange'],
  ['Builtin.CompleteProgression', 'Complete Progression', 'effect_complete_progression'],
  ['Builtin.SubmitOrderFromBlackboard', 'Submit Order From Blackboard', 'effect_submit_order'],
  ['Graph.Lifecycle.DeployConsumeSource', 'Deploy Consume Source', 'effect_deploy_consume_source'],
  ['Builtin.RevealArea', 'Reveal Area', 'effect_reveal_area'],
  ['Builtin.DecayRevealArea', 'Decay Reveal Area', 'effect_decay_reveal_area'],
];

const EXTRA_OUTPUTS = {
  effect_spatial_query: [{ id: 'targets', label: '目标集', type: 'entities' }],
  effect_reresolve_dispatch: [{ id: 'targets', label: '目标集', type: 'entities' }],
  effect_create_projectile: [{ id: 'projectile', label: '投射物', type: 'entity' }],
  effect_create_unit: [{ id: 'unit', label: '新单位', type: 'entity' }],
  effect_deploy_consume_source: [{ id: 'deployed', label: '部署实体', type: 'entity' }],
};

export function buildEffectBuiltinGraph(actionId, name, operationType) {
  const entry = { id: 'effect-entry', type: 'action_entry', position: { x: 100, y: 180 }, data: { label: 'Effect Phase Entry' }, inputs: [], outputs: ENTRY_OUTPUTS, locked: true };
  const operation = { id: 'effect-operation', type: operationType, position: { x: 460, y: 160 }, data: { label: name }, inputs: [
    { id: 'exec', label: '执行', type: 'exec' }, { id: 'source', label: '源实体', type: 'entity' },
    { id: 'target', label: '目标实体', type: 'entity' }, { id: 'effect', label: 'Effect Config', type: 'any' },
  ], outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }, ...(EXTRA_OUTPUTS[operationType] || [])] };
  const connections = ['exec', 'source', 'target', 'effect'].map(port => ({ id: `${actionId}-${port}`, fromNode: entry.id, fromPort: port, toNode: operation.id, toPort: port }));
  return { action_id: actionId, name, description: 'Effect Preset 的可编辑 Main ActionGraph', parameters: [], graph_definition: JSON.stringify({ nodes: [entry, operation], connections, blackboard: {} }) };
}