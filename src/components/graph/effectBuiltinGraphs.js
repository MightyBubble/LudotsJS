const ENTRY_OUTPUTS = [{ id: 'exec', label: '执行', type: 'exec' }];

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

const EXEC_INPUT = [{ id: 'exec', label: '执行', type: 'exec' }];
const EXEC_OUTPUT = [{ id: 'exec_out', label: '完成', type: 'exec' }];
const DEPLOY_HANDLERS = ['MaterializeTemplate', 'CopyIdentityComponents', 'CopyAttributeSlice', 'ClearActiveEffects', 'TransferStableId', 'ConsumeEntity'];

export function buildEffectBuiltinGraph(actionId, name, operationType) {
  const entry = { id: 'effect-entry', type: 'action_entry', position: { x: 80, y: 180 }, data: { label: 'Effect Phase Context' }, inputs: [], outputs: ENTRY_OUTPUTS, locked: true };
  if (actionId === 'Graph.Lifecycle.DeployConsumeSource') {
    const begin = { id: 'begin', type: 'runtime_builtin', position: { x: 340, y: 180 }, data: { label: 'BeginLifecycleTransaction' }, inputs: EXEC_INPUT, outputs: EXEC_OUTPUT, locked: true };
    const handlers = DEPLOY_HANDLERS.map((handler, index) => ({ id: `builtin-${index}`, type: 'runtime_builtin', position: { x: 600 + index * 260, y: 180 }, data: { label: `InvokeBuiltin · ${handler}` }, inputs: EXEC_INPUT, outputs: index === DEPLOY_HANDLERS.length - 1 ? [] : EXEC_OUTPUT, locked: true }));
    const chain = [entry, begin, ...handlers];
    const connections = chain.slice(0, -1).map((node, index) => ({ id: `${actionId}-${index}`, fromNode: node.id, fromPort: index === 0 ? 'exec' : 'exec_out', toNode: chain[index + 1].id, toPort: 'exec' }));
    return { action_id: actionId, name, description: 'C# GraphConfig 的只读运行图', parameters: [], graph_definition: JSON.stringify({ nodes: chain, connections, blackboard: {}, readOnly: true }) };
  }
  const operation = { id: 'effect-operation', type: operationType, position: { x: 440, y: 180 }, data: { label: `InvokeBuiltin · ${name}`, runtimeContext: 'EffectContext + merged EffectConfigParams' }, inputs: EXEC_INPUT, outputs: [], locked: true };
  const connections = [{ id: `${actionId}-exec`, fromNode: entry.id, fromPort: 'exec', toNode: operation.id, toPort: 'exec' }];
  return { action_id: actionId, name, description: 'C# Builtin Handler 的只读 Graph 视图；Context 与 Config 为隐式运行时上下文', parameters: [], graph_definition: JSON.stringify({ nodes: [entry, operation], connections, blackboard: {}, readOnly: true }) };
}