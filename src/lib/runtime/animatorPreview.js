import { resolvePerformerChildren } from '@/lib/runtime/performerComposition';

const modeFor = kind => kind?.includes('Less') ? 'Less' : kind?.includes('BoolFalse') ? 'IfNot' : kind?.includes('Bool') ? 'If' : kind?.includes('Trigger') ? 'Trigger' : 'Greater';

export function buildAnimatorPreviewLayer(controller) {
  if (controller?.authoring_layers?.[0]) return controller.authoring_layers[0];
  return {
    id: 'runtime',
    default_state_id: `state-${controller?.default_state_index ?? 0}`,
    states: (controller?.states || []).map(state => ({ ...state, id: `state-${state.packed_state_index}`, name: `State ${state.packed_state_index}`, type: 'Normal', position: { x: 260 + state.packed_state_index * 220, y: 180 } })),
    transitions: (controller?.transitions || []).map((transition, index) => ({ ...transition, id: `transition-${index}`, from_state_id: `state-${transition.from_state_index}`, to_state_id: `state-${transition.to_state_index}`, conditions: transition.condition_kind === 'None' ? [] : [{ parameter: transition.parameter_index, mode: modeFor(transition.condition_kind), threshold: transition.threshold }] })),
  };
}

export function findPreviewAnimator(root, performers) {
  const byId = new Map((performers || []).map(item => [item.performer_id, item]));
  const visit = (definition, instance = {}, seen = new Set()) => {
    if (!definition || seen.has(definition.performer_id)) return null;
    const nextSeen = new Set(seen).add(definition.performer_id);
    const behaviors = [...(definition.behaviors || []), ...(instance.runtime_behaviors || [])];
    const animator = behaviors.find(behavior => behavior.kind === 'Animator' && behavior.activeByDefault !== false)?.animator;
    if (animator) return animator;
    for (const child of resolvePerformerChildren(definition, instance)) {
      const found = visit(byId.get(child.definition_id), child, nextSeen);
      if (found) return found;
    }
    return null;
  };
  return visit(root);
}