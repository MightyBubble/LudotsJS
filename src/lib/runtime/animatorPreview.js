import { resolvePresenterChildren } from '@/lib/runtime/presenterComposition';
import { readInstanceOverrides } from '@/lib/runtime/presenterOverrides';

const modeFor = kind => kind === 'AutoOnNormalizedTime' ? 'ExitTime' : kind?.includes('Less') ? 'Less' : kind?.includes('BoolFalse') ? 'IfNot' : kind?.includes('Bool') ? 'If' : kind?.includes('Trigger') ? 'Trigger' : 'Greater';

export function buildAnimatorPreviewLayer(controller) {
  if (controller?.authoring_layers?.[0]) return controller.authoring_layers[0];
  const states = (controller?.states || []).map((state, index) => ({
    ...state,
    id: `runtime-state-${index}`,
    name: `State ${index} · packed ${state.packed_state_index}`,
    type: 'Normal',
    position: { x: 260 + index * 220, y: 180 },
  }));
  const defaultIndex = Math.max(0, Math.min(states.length - 1, Number(controller?.default_state_index) || 0));
  return {
    id: 'runtime',
    default_state_id: states[defaultIndex]?.id || '',
    states,
    transitions: (controller?.transitions || []).map((transition, index) => ({
      ...transition,
      id: `runtime-transition-${index}`,
      from_state_id: states[transition.from_state_index]?.id || '',
      to_state_id: states[transition.to_state_index]?.id || '',
      conditions: transition.condition_kind === 'None' ? [] : [{
        parameter: transition.parameter_index,
        mode: modeFor(transition.condition_kind),
        threshold: transition.threshold,
      }],
    })).filter(transition => transition.from_state_id && transition.to_state_id),
  };
}

const defaultValue = entry => entry?.lane === 'Int' ? entry.intValue : entry?.lane === 'Vector' ? entry.vectorValue : entry?.floatValue;

export function findPreviewAnimator(root, presenters) {
  const byId = new Map((presenters || []).map(item => [item.presenter_id, item]));
  const visit = (definition, instance = {}, inherited = new Map(), seen = new Set()) => {
    if (!definition || seen.has(definition.presenter_id)) return null;
    const nextSeen = new Set(seen).add(definition.presenter_id);
    const params = new Map(inherited);
    (definition.paramDefaults || []).forEach(entry => params.set(entry.paramKey, defaultValue(entry)));
    readInstanceOverrides(instance).params.forEach(entry => params.set(entry.paramKey, defaultValue(entry)));
    const behaviors = [...(definition.behaviors || [])];
    const animator = behaviors.find(behavior => behavior.kind === 'Animator' && behavior.activeByDefault !== false)?.animator;
    if (animator) return { ...animator, previewParams: Object.fromEntries(params) };
    for (const child of resolvePresenterChildren(definition, instance)) {
      const found = visit(byId.get(child.definitionId), child, params, nextSeen);
      if (found) return found;
    }
    return null;
  };
  return visit(root);
}

export function buildAnimatorPreviewParameters(controller, animator) {
  const parameters = new Map((controller?.authoring_parameters || []).map(parameter => [parameter.name, parameter]));
  const add = (name, type) => {
    if (!name || name === 'none' || parameters.has(name)) return;
    parameters.set(name, { id: `runtime-param-${name}`, name, type, default_value: animator?.previewParams?.[name] ?? 0 });
  };
  (controller?.transitions || []).forEach(transition => {
    const kind = transition.condition_kind || '';
    add(transition.parameter_index, kind === 'Trigger' ? 'Trigger' : kind.startsWith('Bool') ? 'Bool' : 'Float');
  });
  add(animator?.speedParamKey, 'Float');
  return Array.from(parameters.values()).map(parameter => ({
    ...parameter,
    default_value: animator?.previewParams?.[parameter.name] ?? parameter.default_value ?? 0,
  }));
}
