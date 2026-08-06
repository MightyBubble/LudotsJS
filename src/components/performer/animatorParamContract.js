const NONE_KEYS = new Set(['none', '__none__']);

const PARAM_TYPE_TO_LANE = {
  Float: 'Float',
  Int: 'Int',
  Bool: 'Int',
  Trigger: 'Int',
};

const RUNTIME_CONDITION_LANE = {
  Trigger: 'Int',
  BoolTrue: 'Int',
  BoolFalse: 'Int',
  FloatGreaterOrEqual: 'Float',
  FloatLessOrEqual: 'Float',
};

const AUTHORING_CONDITION_LANE = {
  Trigger: 'Int',
  If: 'Int',
  IfNot: 'Int',
  Greater: 'Float',
  Less: 'Float',
};

function valueAt(obj, camelKey, snakeKey) {
  if (!obj) return undefined;
  return obj[camelKey] ?? obj[snakeKey];
}

export function normalizeParamKey(value) {
  return String(value ?? '').trim();
}

export function isNoneParamKey(value) {
  const key = normalizeParamKey(value);
  return !key || NONE_KEYS.has(key);
}

export function animatorControllerKey(animator) {
  return normalizeParamKey(valueAt(animator, 'animatorControllerId', 'animator_controller_id'));
}

export function animatorSpeedParamKey(animator) {
  return normalizeParamKey(valueAt(animator, 'speedParamKey', 'speed_param_key'));
}

export function animatorStateParamKey(animator) {
  return normalizeParamKey(valueAt(animator, 'stateParamKey', 'state_param_key'));
}

function laneForParamType(type) {
  return PARAM_TYPE_TO_LANE[type] || 'Float';
}

function addRequirement(map, paramKey, lane, usage) {
  const key = normalizeParamKey(paramKey);
  if (isNoneParamKey(key) || !lane) return;

  const rowKey = `${key}\u0000${lane}`;
  let row = map.get(rowKey);
  if (!row) {
    row = {
      paramKey: key,
      lane,
      required: false,
      writeOnly: false,
      declared: false,
      parameterType: '',
      defaultValue: undefined,
      usages: [],
      usageIds: new Set(),
    };
    map.set(rowKey, row);
  }

  if (usage.required) row.required = true;
  if (usage.writeOnly) row.writeOnly = true;
  if (usage.declared) row.declared = true;
  if (usage.parameterType && !row.parameterType) row.parameterType = usage.parameterType;
  if (usage.defaultValue !== undefined) row.defaultValue = usage.defaultValue;

  const usageId = usage.id || `${usage.kind}:${usage.label}`;
  if (!row.usageIds.has(usageId)) {
    row.usageIds.add(usageId);
    row.usages.push({
      kind: usage.kind,
      label: usage.label,
      required: !!usage.required,
      writeOnly: !!usage.writeOnly,
    });
  }
}

function addDeclaredParameters(map, controller) {
  const parameters = Array.isArray(controller?.authoring_parameters)
    ? controller.authoring_parameters
    : [];

  parameters.forEach((parameter, index) => {
    const name = normalizeParamKey(parameter?.name || parameter?.id);
    if (isNoneParamKey(name)) return;

    const parameterType = parameter?.type || 'Float';
    const defaultNumber = Number(parameter?.default_value ?? parameter?.defaultValue);
    addRequirement(map, name, laneForParamType(parameterType), {
      id: `declared:${index}:${name}`,
      kind: 'Declared',
      label: 'Controller parameter',
      declared: true,
      parameterType,
      defaultValue: Number.isFinite(defaultNumber) ? defaultNumber : undefined,
    });
  });
}

function addRuntimeTransitionParameters(map, controller) {
  const transitions = Array.isArray(controller?.transitions) ? controller.transitions : [];
  transitions.forEach((transition, index) => {
    const conditionKind = valueAt(transition, 'conditionKind', 'condition_kind');
    const lane = RUNTIME_CONDITION_LANE[conditionKind];
    const paramKey = valueAt(transition, 'parameterIndex', 'parameter_index');
    if (!lane || isNoneParamKey(paramKey)) return;

    const fromState = valueAt(transition, 'fromStateIndex', 'from_state_index');
    const toState = valueAt(transition, 'toStateIndex', 'to_state_index');
    addRequirement(map, paramKey, lane, {
      id: `runtime:${index}:${conditionKind}:${paramKey}`,
      kind: 'Transition',
      label: `Transition ${fromState ?? '?'} -> ${toState ?? '?'}`,
      required: true,
    });
  });
}

function addAuthoringTransitionParameters(map, controller) {
  const layers = Array.isArray(controller?.authoring_layers) ? controller.authoring_layers : [];
  layers.forEach((layer, layerIndex) => {
    const transitions = Array.isArray(layer?.transitions) ? layer.transitions : [];
    transitions.forEach((transition, transitionIndex) => {
      const conditions = Array.isArray(transition?.conditions) ? transition.conditions : [];
      conditions.forEach((condition, conditionIndex) => {
        const lane = AUTHORING_CONDITION_LANE[condition?.mode];
        if (!lane || isNoneParamKey(condition?.parameter)) return;
        addRequirement(map, condition.parameter, lane, {
          id: `authoring:${layerIndex}:${transitionIndex}:${conditionIndex}:${condition.parameter}:${condition.mode}`,
          kind: 'Transition',
          label: `${layer?.name || `Layer ${layerIndex}`} transition`,
          required: true,
        });
      });
    });
  });
}

export function getAnimatorParamRequirements(controller, animator) {
  const map = new Map();
  addDeclaredParameters(map, controller);
  addRuntimeTransitionParameters(map, controller);
  addAuthoringTransitionParameters(map, controller);

  const speedParamKey = animatorSpeedParamKey(animator);
  if (!isNoneParamKey(speedParamKey)) {
    addRequirement(map, speedParamKey, 'Float', {
      id: `speed:${speedParamKey}`,
      kind: 'Speed',
      label: 'Animator speedParamKey',
      required: true,
    });
  }

  const stateParamKey = animatorStateParamKey(animator);
  if (!isNoneParamKey(stateParamKey)) {
    addRequirement(map, stateParamKey, 'Int', {
      id: `state:${stateParamKey}`,
      kind: 'State',
      label: 'Animator stateParamKey',
      writeOnly: true,
    });
  }

  return Array.from(map.values())
    .map(({ usageIds: _usageIds, ...row }) => ({
      ...row,
      writeOnly: row.writeOnly && !row.required,
    }))
    .sort((a, b) => {
      if (a.required !== b.required) return a.required ? -1 : 1;
      if (a.writeOnly !== b.writeOnly) return a.writeOnly ? 1 : -1;
      return a.paramKey.localeCompare(b.paramKey);
    });
}

function addSupply(supplies, paramKey, lane, kind, detail, scope, activeByDefault = true) {
  const key = normalizeParamKey(paramKey);
  if (isNoneParamKey(key) || !lane) return;
  supplies.push({
    paramKey: key,
    lane,
    kind,
    detail,
    scope,
    activeByDefault,
  });
}

function bindingLane(binding) {
  const source = binding?.source;
  return source === 'entityColorVector' ? 'Vector' : 'Float';
}

function collectFromPerformer(performer, supplies, scope) {
  const paramDefaults = Array.isArray(performer?.paramDefaults)
    ? performer.paramDefaults
    : Array.isArray(performer?.param_defaults)
      ? performer.param_defaults
      : [];
  paramDefaults.forEach((paramDefault, index) => {
    addSupply(
      supplies,
      paramDefault?.paramKey ?? paramDefault?.param_key,
      paramDefault?.lane || 'Float',
      'Default',
      `paramDefaults[${index}]`,
      scope,
    );
  });

  const bindings = Array.isArray(performer?.bindings) ? performer.bindings : [];
  bindings.forEach((binding, index) => {
    addSupply(
      supplies,
      binding?.paramKey ?? binding?.param_key,
      bindingLane(binding),
      'Binding',
      `bindings[${index}]`,
      scope,
    );
  });

  const behaviors = Array.isArray(performer?.behaviors) ? performer.behaviors : [];
  behaviors.forEach((behavior, index) => {
    const slot = behavior?.slot || `behavior[${index}]`;
    const activeByDefault = behavior?.activeByDefault !== false;
    if (behavior?.kind === 'AttributeBinding') {
      const config = behavior.attributeBinding || behavior.attribute_binding || {};
      addSupply(
        supplies,
        config.targetParamKey ?? config.target_param_key,
        'Float',
        'AttributeBinding',
        `${slot} -> ${config.attributeId || config.attribute_id || 'attribute'}`,
        scope,
        activeByDefault,
      );

      const thresholds = Array.isArray(config.thresholds) ? config.thresholds : [];
      thresholds.forEach((threshold, thresholdIndex) => {
        const outputParamKey = threshold?.outputParamKey ?? threshold?.output_param_key;
        addSupply(supplies, outputParamKey, 'Float', 'AttributeThreshold', `${slot}.thresholds[${thresholdIndex}]`, scope, activeByDefault);
        addSupply(supplies, outputParamKey, 'Int', 'AttributeThreshold', `${slot}.thresholds[${thresholdIndex}]`, scope, activeByDefault);
      });
      return;
    }

    if (behavior?.kind === 'TagBinding') {
      const config = behavior.tagBinding || behavior.tag_binding || {};
      addSupply(
        supplies,
        config.targetParamKey ?? config.target_param_key,
        'Int',
        'TagBinding',
        `${slot} -> ${config.tagId || config.tag_id || 'tag'}`,
        scope,
        activeByDefault,
      );
    }
  });

  const rules = Array.isArray(performer?.rules) ? performer.rules : [];
  rules.forEach((rule, index) => {
    const command = rule?.command || {};
    const kind = command.kind || command.commandKind || command.command_kind;
    if (kind !== 'SetParam') return;

    addSupply(
      supplies,
      command.paramKey ?? command.param_key,
      command.paramLane || command.param_lane || 'Float',
      'Rule',
      `rules[${index}]`,
      scope,
    );
  });
}

export function collectPerformerParamSupplies(performer, performers = []) {
  const performerById = new Map(
    performers
      .filter(item => item?.performer_id)
      .map(item => [item.performer_id, item]),
  );
  const supplies = [];
  const visited = new Set();

  const visit = (item, scope) => {
    if (!item) return;
    const id = item.performer_id || scope;
    if (visited.has(id)) return;
    visited.add(id);

    if (item.extends) {
      visit(performerById.get(item.extends), `extends ${item.extends}`);
    }

    collectFromPerformer(item, supplies, scope);
  };

  visit(performer, 'current');
  return supplies;
}

export function getParamSupplyStatus(row, supplies) {
  if (row.writeOnly) {
    return { kind: 'writeOnly', label: 'Animator writes', sources: [] };
  }

  const sameKey = supplies.filter(source => source.paramKey === row.paramKey);
  const sameLane = sameKey.filter(source => source.lane === row.lane);
  if (sameLane.length > 0) {
    return { kind: 'ready', label: 'Provided', sources: sameLane };
  }

  if (sameKey.length > 0) {
    return { kind: row.required ? 'mismatch' : 'optionalMismatch', label: 'Lane mismatch', sources: sameKey };
  }

  if (row.required) {
    return { kind: 'missing', label: 'Missing', sources: [] };
  }

  return { kind: 'optional', label: 'Declared only', sources: [] };
}

export function defaultValueForRow(row) {
  const numeric = Number(row.defaultValue);
  if (row.lane === 'Int') {
    return {
      paramKey: row.paramKey,
      lane: 'Int',
      intValue: Number.isFinite(numeric) ? Math.trunc(numeric) : 0,
    };
  }

  if (row.lane === 'Vector') {
    return {
      paramKey: row.paramKey,
      lane: 'Vector',
      vectorValue: [0, 0, 0, 0],
    };
  }

  return {
    paramKey: row.paramKey,
    lane: 'Float',
    floatValue: Number.isFinite(numeric) ? numeric : 0,
  };
}

