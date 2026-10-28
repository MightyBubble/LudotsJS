export const STATE_TYPES = ['Normal', 'BlendTree', 'SubStateMachine'];
export const SPECIAL_STATE_TYPES = new Set(['Entry', 'Exit', 'AnyState']);
export const RUNTIME_STATE_TYPES = new Set(['Normal', 'BlendTree', 'SubStateMachine']);
export const PARAMETER_TYPES = ['Float', 'Int', 'Bool', 'Trigger'];
export const CONDITIONLESS = { parameter: 'none', mode: 'None', threshold: 0 };

export const STATE_COLORS = {
  Entry: '#4B8F6D',
  Exit: '#B5544F',
  AnyState: '#3E8395',
  Normal: '#96A0B0',
  BlendTree: '#7B83A5',
  SubStateMachine: '#6B778D',
};

export const DURATION_MODES = ['Seconds', 'NormalizedSourceState'];
export const INTERRUPT_SOURCES = ['None', 'CurrentState', 'NextState', 'CurrentThenNext', 'NextThenCurrent'];

export function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function toNumber(value, defaultValue) {
  const next = Number(value);
  return Number.isFinite(next) ? next : defaultValue;
}

export function toPositive(value, defaultValue) {
  const next = toNumber(value, defaultValue);
  return next > 0 ? next : defaultValue;
}

export function clamp01(value) {
  return Math.max(0, Math.min(1, toNumber(value, 0)));
}

export function makeSpecialState(type, layerIndex) {
  const positions = {
    Entry: { x: 80, y: 160 },
    AnyState: { x: 80, y: 270 },
    Exit: { x: 760, y: 160 },
  };
  return {
    id: `${type.toLowerCase()}_${layerIndex}`,
    name: type === 'AnyState' ? 'Any State' : type,
    type,
    position: positions[type],
  };
}

export function makeBlendTree() {
  return {
    blend_type: '1D',
    parameter: '',
    motions: [],
  };
}

export function makeAuthoringState(type = 'Normal', position = { x: 320, y: 160 }, packedIndex = 0) {
  const name = type === 'Normal' ? `State ${packedIndex}` : type;
  return {
    id: createId('state'),
    name,
    type,
    position,
    packed_state_index: packedIndex,
    duration_seconds: 1,
    playback_speed: 1,
    loop: true,
    animation_clip_asset_id: '',
    blend_tree: type === 'BlendTree' ? makeBlendTree() : undefined,
    sub_controller_id: type === 'SubStateMachine' ? '' : undefined,
    parameter_mapping: type === 'SubStateMachine' ? {} : undefined,
    comment: '',
  };
}

export function makeLayer(index = 0) {
  return {
    id: createId('layer'),
    name: index === 0 ? 'Base Layer' : `Layer ${index}`,
    weight: 1,
    blend_mode: 'Override',
    ik_pass: false,
    default_state_id: '',
    states: [
      makeSpecialState('Entry', index),
      makeAuthoringState('Normal', { x: 330, y: 160 }, index),
      makeSpecialState('AnyState', index),
      makeSpecialState('Exit', index),
    ],
    transitions: [],
  };
}

export function makeAuthoringTransition(fromStateId, toStateId) {
  return {
    id: createId('transition'),
    from_state_id: fromStateId,
    to_state_id: toStateId,
    duration_seconds: 0.25,
    duration_mode: 'Seconds',
    has_exit_time: true,
    exit_time: 0.75,
    conditions: [],
    consume_trigger: false,
    interrupt_source: 'None',
    ordered_interruption: false,
    transition_curve: 'Linear',
  };
}

export function normalizeRuntimeState(state, index) {
  return {
    packed_state_index: Number.isInteger(Number(state?.packed_state_index)) ? Number(state.packed_state_index) : index,
    duration_seconds: toPositive(state?.duration_seconds, 1),
    playback_speed: toPositive(state?.playback_speed, 1),
    loop: state?.loop !== false,
  };
}

export function normalizeRuntimeTransition(transition, stateCount) {
  const max = Math.max(0, stateCount - 1);
  const conditionKind = transition?.condition_kind || 'None';
  const needsParameter = !['None', 'AutoOnNormalizedTime'].includes(conditionKind);
  const hasExitTime = !!transition?.has_exit_time;
  return {
    from_state_index: Math.max(0, Math.min(max, toNumber(transition?.from_state_index, 0))),
    to_state_index: Math.max(0, Math.min(max, toNumber(transition?.to_state_index, 0))),
    condition_kind: conditionKind,
    parameter_index: needsParameter ? (transition?.parameter_index || '') : 'none',
    threshold: toNumber(transition?.threshold, 0),
    duration_seconds: Math.max(0, toNumber(transition?.duration_seconds, 0.25)),
    duration_mode: DURATION_MODES.includes(transition?.duration_mode) ? transition.duration_mode : 'Seconds',
    consume_trigger: conditionKind === 'Trigger' ? !!transition?.consume_trigger : false,
    has_exit_time: hasExitTime,
    exit_time: hasExitTime ? clamp01(transition?.exit_time) : 0,
    interrupt_source: INTERRUPT_SOURCES.includes(transition?.interrupt_source) ? transition.interrupt_source : 'None',
    ordered_interruption: transition?.interrupt_source && transition.interrupt_source !== 'None'
      ? !!transition?.ordered_interruption
      : false,
  };
}

function stateFromRuntime(state, index) {
  return {
    ...makeAuthoringState('Normal', { x: 320 + (index % 3) * 220, y: 150 + Math.floor(index / 3) * 150 }, index),
    id: `runtime_state_${index}`,
    name: `State ${index}`,
    ...normalizeRuntimeState(state, index),
  };
}

function conditionFromRuntime(transition) {
  const kind = transition?.condition_kind || 'None';
  const parameter = transition?.parameter_index || 'none';
  if (kind === 'None') return null;
  if (kind === 'Trigger') return { parameter, mode: 'Trigger', threshold: 0 };
  if (kind === 'BoolTrue') return { parameter, mode: 'If', threshold: 0 };
  if (kind === 'BoolFalse') return { parameter, mode: 'IfNot', threshold: 0 };
  if (kind === 'FloatGreaterOrEqual') return { parameter, mode: 'Greater', threshold: toNumber(transition?.threshold, 0) };
  if (kind === 'FloatLessOrEqual') return { parameter, mode: 'Less', threshold: toNumber(transition?.threshold, 0) };
  if (kind === 'AutoOnNormalizedTime') return { parameter: 'none', mode: 'ExitTime', threshold: toNumber(transition?.threshold, 0) };
  return null;
}

export function layerFromRuntime(draft) {
  const runtimeStates = (draft.states?.length ? draft.states : [normalizeRuntimeState(null, 0)]).map(stateFromRuntime);
  const runtimeTransitions = (draft.transitions || []).map((transition, index) => {
    const normalized = normalizeRuntimeTransition(transition, runtimeStates.length);
    const condition = conditionFromRuntime(normalized);
    return {
      id: `runtime_transition_${index}`,
      from_state_id: `runtime_state_${normalized.from_state_index}`,
      to_state_id: `runtime_state_${normalized.to_state_index}`,
      duration_seconds: normalized.duration_seconds,
      duration_mode: normalized.duration_mode,
      has_exit_time: normalized.has_exit_time,
      exit_time: normalized.exit_time,
      conditions: condition ? [condition] : [],
      consume_trigger: normalized.consume_trigger,
      interrupt_source: normalized.interrupt_source,
      ordered_interruption: normalized.ordered_interruption,
      transition_curve: 'Linear',
    };
  });
  return {
    ...makeLayer(0),
    id: 'base_layer',
    default_state_id: `runtime_state_${Math.max(0, Math.min(runtimeStates.length - 1, toNumber(draft.default_state_index, 0)))}`,
    states: [makeSpecialState('Entry', 0), ...runtimeStates, makeSpecialState('AnyState', 0), makeSpecialState('Exit', 0)],
    transitions: runtimeTransitions,
  };
}

export function normalizeParameter(parameter, index) {
  const type = PARAMETER_TYPES.includes(parameter?.type) ? parameter.type : 'Float';
  return {
    id: parameter?.id || `param_${index}_${parameter?.name || type}`,
    name: parameter?.name || `parameter_${index}`,
    type,
    default_value: toNumber(parameter?.default_value ?? parameter?.defaultValue, 0),
  };
}

export function normalizeBlendTree(tree) {
  return {
    blend_type: tree?.blend_type === '2D' ? '2D' : '1D',
    parameter: tree?.parameter || '',
    parameter_y: tree?.parameter_y || '',
    motions: (tree?.motions || []).map((motion, index) => ({
      id: motion.id || `motion_${index}`,
      clip_asset_id: motion.clip_asset_id || motion.animation_clip_asset_id || '',
      threshold_x: toNumber(motion.threshold_x, index),
      threshold_y: toNumber(motion.threshold_y, 0),
      playback_speed: toPositive(motion.playback_speed, 1),
    })),
  };
}

export function normalizeAuthoringState(state, index) {
  const type = ['Entry', 'Exit', 'AnyState', ...STATE_TYPES].includes(state?.type) ? state.type : 'Normal';
  const base = SPECIAL_STATE_TYPES.has(type)
    ? makeSpecialState(type, index)
    : makeAuthoringState(type, state?.position || { x: 320, y: 160 }, index);
  return {
    ...base,
    ...(state || {}),
    type,
    position: {
      x: toNumber(state?.position?.x, base.position.x),
      y: toNumber(state?.position?.y, base.position.y),
    },
    packed_state_index: SPECIAL_STATE_TYPES.has(type) ? undefined : Number.isInteger(Number(state?.packed_state_index)) ? Number(state.packed_state_index) : index,
    duration_seconds: SPECIAL_STATE_TYPES.has(type) ? undefined : toPositive(state?.duration_seconds, 1),
    playback_speed: SPECIAL_STATE_TYPES.has(type) ? undefined : toPositive(state?.playback_speed, 1),
    loop: SPECIAL_STATE_TYPES.has(type) ? undefined : state?.loop !== false,
    blend_tree: type === 'BlendTree' ? normalizeBlendTree(state?.blend_tree) : undefined,
    parameter_mapping: type === 'SubStateMachine' ? (state?.parameter_mapping || {}) : undefined,
  };
}

export function normalizeLayer(layer, index) {
  const base = makeLayer(index);
  const sourceStates = Array.isArray(layer?.states) && layer.states.length ? layer.states : base.states;
  const states = sourceStates.map((state, stateIndex) => normalizeAuthoringState(state, stateIndex));
  const hasType = type => states.some(state => state.type === type);
  const withSpecials = [
    ...(hasType('Entry') ? [] : [makeSpecialState('Entry', index)]),
    ...states,
    ...(hasType('AnyState') ? [] : [makeSpecialState('AnyState', index)]),
    ...(hasType('Exit') ? [] : [makeSpecialState('Exit', index)]),
  ];
  return {
    ...base,
    ...(layer || {}),
    name: layer?.name || base.name,
    weight: Math.max(0, toNumber(layer?.weight, 1)),
    blend_mode: layer?.blend_mode === 'Additive' ? 'Additive' : 'Override',
    ik_pass: !!layer?.ik_pass,
    states: withSpecials,
    transitions: (layer?.transitions || []).map((transition, transitionIndex) => ({
      id: transition.id || `transition_${index}_${transitionIndex}`,
      from_state_id: transition.from_state_id || '',
      to_state_id: transition.to_state_id || '',
      duration_seconds: Math.max(0, toNumber(transition.duration_seconds, 0.25)),
      duration_mode: DURATION_MODES.includes(transition.duration_mode) ? transition.duration_mode : 'Seconds',
      has_exit_time: !!transition.has_exit_time,
      exit_time: transition.has_exit_time ? clamp01(transition.exit_time) : 0,
      conditions: (transition.conditions || []).slice(0, 1).map(condition => ({
        parameter: condition.parameter || 'none',
        mode: condition.mode || 'None',
        threshold: toNumber(condition.threshold, 0),
      })),
      consume_trigger: !!transition.consume_trigger,
      interrupt_source: INTERRUPT_SOURCES.includes(transition.interrupt_source) ? transition.interrupt_source : 'None',
      ordered_interruption: transition.interrupt_source && transition.interrupt_source !== 'None'
        ? !!transition.ordered_interruption
        : false,
      transition_curve: transition.transition_curve || 'Linear',
    })),
  };
}

export function normalizeController(draft) {
  let runtimeIndex = 0;
  const layers = (draft.authoring_layers?.length ? draft.authoring_layers : [layerFromRuntime(draft)])
    .map(normalizeLayer)
    .map(layer => ({
      ...layer,
      states: layer.states.map(state => RUNTIME_STATE_TYPES.has(state.type) ? { ...state, packed_state_index: runtimeIndex++ } : state),
    }));
  return {
    layers,
    parameters: (draft.authoring_parameters || []).map(normalizeParameter),
  };
}

function conditionToRuntime(condition, parameters) {
  if (!condition || condition.mode === 'None') {
    return { condition_kind: 'None', parameter_index: 'none', threshold: 0 };
  }
  if (condition.mode === 'ExitTime') {
    return { condition_kind: 'AutoOnNormalizedTime', parameter_index: 'none', threshold: toNumber(condition.threshold, 0) };
  }
  const parameter = parameters.find(item => item.name === condition.parameter);
  if (parameter?.type === 'Trigger' || condition.mode === 'Trigger') {
    return { condition_kind: 'Trigger', parameter_index: condition.parameter, threshold: 0 };
  }
  if (parameter?.type === 'Bool' || condition.mode === 'If' || condition.mode === 'IfNot') {
    return { condition_kind: condition.mode === 'IfNot' ? 'BoolFalse' : 'BoolTrue', parameter_index: condition.parameter, threshold: 0 };
  }
  if (condition.mode === 'Less') {
    return { condition_kind: 'FloatLessOrEqual', parameter_index: condition.parameter, threshold: toNumber(condition.threshold, 0) };
  }
  return { condition_kind: 'FloatGreaterOrEqual', parameter_index: condition.parameter, threshold: toNumber(condition.threshold, 0) };
}

function compileTransition(transition, parameters, fromIndex, toIndex) {
  const runtimeCondition = conditionToRuntime(transition.conditions?.[0], parameters);
  const interruptSource = INTERRUPT_SOURCES.includes(transition.interrupt_source) ? transition.interrupt_source : 'None';
  return {
    from_state_index: fromIndex,
    to_state_index: toIndex,
    ...runtimeCondition,
    duration_seconds: Math.max(0, toNumber(transition.duration_seconds, 0.25)),
    duration_mode: DURATION_MODES.includes(transition.duration_mode) ? transition.duration_mode : 'Seconds',
    consume_trigger: runtimeCondition.condition_kind === 'Trigger' ? !!transition.consume_trigger : false,
    has_exit_time: !!transition.has_exit_time,
    exit_time: transition.has_exit_time ? clamp01(transition.exit_time) : 0,
    interrupt_source: interruptSource,
    ordered_interruption: interruptSource !== 'None' ? !!transition.ordered_interruption : false,
  };
}

export function compileAuthoring(layers, parameters) {
  const states = [];
  const stateIndexById = new Map();
  const stateById = new Map();

  layers.forEach(layer => {
    layer.states.forEach(state => {
      stateById.set(state.id, state);
      if (RUNTIME_STATE_TYPES.has(state.type)) {
        stateIndexById.set(state.id, states.length);
        states.push(normalizeRuntimeState({
          packed_state_index: states.length,
          duration_seconds: state.duration_seconds,
          playback_speed: state.playback_speed,
          loop: state.loop,
        }, states.length));
      }
    });
  });

  if (states.length === 0) {
    states.push(normalizeRuntimeState(null, 0));
  }

  let defaultStateIndex = 0;
  for (const layer of layers) {
    if (stateIndexById.has(layer.default_state_id)) {
      defaultStateIndex = stateIndexById.get(layer.default_state_id);
      break;
    }
  }

  const transitions = [];
  layers.forEach(layer => {
    layer.transitions.forEach(transition => {
      const from = stateById.get(transition.from_state_id);
      const to = stateById.get(transition.to_state_id);
      if (!from || !to) return;
      if (from.type === 'Entry' && stateIndexById.has(to.id)) {
        defaultStateIndex = stateIndexById.get(to.id);
        return;
      }
      if (from.type === 'AnyState' && stateIndexById.has(to.id)) {
        const excluded = new Set(from.excluded_state_ids || []);
        const layerRuntimeStateIds = layer.states
          .filter(state => RUNTIME_STATE_TYPES.has(state.type))
          .map(state => state.id);
        layerRuntimeStateIds.forEach(stateId => {
          if (stateId !== to.id && !excluded.has(stateId)) {
            const fromIndex = stateIndexById.get(stateId);
            if (fromIndex != null) {
              transitions.push(compileTransition(transition, parameters, fromIndex, stateIndexById.get(to.id)));
            }
          }
        });
        return;
      }
      if (stateIndexById.has(from.id) && stateIndexById.has(to.id)) {
        transitions.push(compileTransition(transition, parameters, stateIndexById.get(from.id), stateIndexById.get(to.id)));
      }
    });
  });

  return {
    default_state_index: defaultStateIndex,
    states,
    transitions: transitions.map(item => normalizeRuntimeTransition(item, states.length)),
  };
}

export function transitionConditionLabel(transition) {
  const condition = transition.conditions?.[0];
  if (!condition) return 'None';
  if (condition.mode === 'ExitTime') return `time >= ${condition.threshold}`;
  if (condition.mode === 'Trigger') return `${condition.parameter} trigger`;
  if (condition.mode === 'If') return `${condition.parameter} true`;
  if (condition.mode === 'IfNot') return `${condition.parameter} false`;
  if (condition.mode === 'Less') return `${condition.parameter} <= ${condition.threshold}`;
  if (condition.mode === 'Greater') return `${condition.parameter} >= ${condition.threshold}`;
  return 'None';
}