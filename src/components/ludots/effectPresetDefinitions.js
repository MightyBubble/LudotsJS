import { getGlobalTableRows, parseGlobalValue, LUDOTS_TABLE_IDS } from './globalTableRefs';

export const EFFECT_PHASES = ['OnPropose', 'OnCalculate', 'OnResolve', 'OnHit', 'OnApply', 'OnPeriod', 'OnExpire', 'OnRemove'];

const builtin = (id) => ({ type: 'graph', id: `Builtin.${id}`, builtin: true });
const graph = (id) => ({ type: 'graph', id });

export const EFFECT_PRESETS = {
  None: { components: [], fields: [], allowedLifetimes: ['Instant', 'After', 'Infinite'], handlers: {} },
  ApplyForce2D: { components: ['ForceParams'], fields: [], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('ApplyForce') } },
  InstantDamage: { components: ['ModifierParams'], fields: ['modifiers'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('ApplyModifiers') } },
  Heal: { components: ['ModifierParams'], fields: ['modifiers'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('ApplyModifiers') } },
  Buff: { components: ['ModifierParams', 'DurationParams'], fields: ['modifiers', 'duration'], allowedLifetimes: ['After', 'Infinite'], handlers: { OnApply: builtin('ApplyModifiers') } },
  DoT: { components: ['ModifierParams', 'DurationParams'], fields: ['modifiers', 'duration'], allowedLifetimes: ['After'], handlers: { OnApply: builtin('ApplyModifiers'), OnPeriod: builtin('ApplyModifiers') } },
  HoT: { components: ['ModifierParams', 'DurationParams'], fields: ['modifiers', 'duration'], allowedLifetimes: ['After'], handlers: { OnApply: builtin('ApplyModifiers'), OnPeriod: builtin('ApplyModifiers') } },
  Search: { components: ['TargetQueryParams', 'TargetDispatchParams'], fields: ['targetQuery', 'targetDispatch'], optionalFields: ['targetFilter'], allowedLifetimes: ['Instant'], handlers: { OnResolve: builtin('SpatialQuery'), OnApply: builtin('DispatchPayload') } },
  PeriodicSearch: { components: ['TargetQueryParams', 'TargetDispatchParams', 'DurationParams'], fields: ['targetQuery', 'targetDispatch', 'duration'], optionalFields: ['targetFilter'], allowedLifetimes: ['After'], handlers: { OnPeriod: builtin('ReResolveAndDispatch') } },
  LaunchProjectile: { components: ['ProjectileParams'], fields: ['projectile'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('CreateProjectile') } },
  CreateUnit: { components: ['UnitCreationParams'], fields: ['unitCreation'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('CreateUnit') } },
  Displacement: { components: [], fields: ['displacement'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('ApplyDisplacement') } },
  Relation: { components: ['RelationParams'], fields: ['relation'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('ApplyRelation') } },
  Exchange: { components: [], fields: [], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('ExecuteExchange') } },
  CompleteProgression: { components: [], fields: ['progression'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('CompleteProgression') } },
  SubmitOrderFromBlackboard: { components: [], fields: ['submitOrderFromBlackboard'], allowedLifetimes: ['Instant'], handlers: { OnApply: builtin('SubmitOrderFromBlackboard') } },
  DeployConsumeSource: { components: [], fields: [], allowedLifetimes: ['Instant'], handlers: { OnApply: graph('Graph.Lifecycle.DeployConsumeSource') } },
  RevealArea: { components: ['RevealAreaParams', 'DurationParams'], fields: ['revealArea', 'duration'], allowedLifetimes: ['Instant', 'After'], handlers: { OnApply: builtin('RevealArea'), OnPeriod: builtin('RevealArea'), OnRemove: builtin('DecayRevealArea') } },
};

const runtimeHandler = (handler) => handler?.type === 'builtin' ? builtin(handler.id) : handler?.type === 'graph' ? graph(handler.id) : null;

export function getEffectPresetDefinition(presetType, constants = []) {
  const local = EFFECT_PRESETS[presetType] || EFFECT_PRESETS.None;
  const row = getGlobalTableRows(constants, LUDOTS_TABLE_IDS.effectPresets).find(item => item.constant_key === presetType);
  const runtime = parseGlobalValue(row);
  if (!runtime) return local;
  const handlers = Object.fromEntries(Object.entries(runtime.defaultPhaseHandlers || {}).map(([phase, handler]) => [phase, runtimeHandler(handler)]).filter(([, handler]) => handler));
  return { ...local, components: runtime.components || [], allowedLifetimes: runtime.allowedLifetimes || local.allowedLifetimes, handlers };
}

export function getEffectPresetOptions(constants = []) {
  const rows = getGlobalTableRows(constants, LUDOTS_TABLE_IDS.effectPresets);
  const values = rows.length ? ['None', ...rows.map(item => item.constant_key)] : Object.keys(EFFECT_PRESETS);
  return values.map(value => ({ value, label: value }));
}

const MANAGED_FIELDS = ['modifiers', 'duration', 'targetQuery', 'targetFilter', 'targetDispatch', 'projectile', 'unitCreation', 'displacement', 'relation', 'revealArea', 'submitOrderFromBlackboard', 'progression'];

export function presetPatch(draft, presetType, constants = []) {
  const def = getEffectPresetDefinition(presetType, constants);
  const allowed = new Set([...(def.fields || []), ...(def.optionalFields || [])]);
  const reservedByPreset = {
    ApplyForce2D: ['_ep.forceXTargetAttrId', '_ep.forceYTargetAttrId'],
    Exchange: ['_ep.exchangeOperationId'],
    DeployConsumeSource: ['_ep.targetEntityTemplate', '_ep.lifecycleAttributeValueSource', '_ep.lifecycleAttribute0', '_ep.lifecycleAttribute1', '_ep.lifecycleAttribute2', '_ep.lifecycleAttribute3'],
  };
  const allReserved = new Set(Object.values(reservedByPreset).flat());
  const keepReserved = new Set(reservedByPreset[presetType] || []);
  const configParams = Object.fromEntries(Object.entries(draft.configParams || {}).filter(([key]) => !allReserved.has(key) || keepReserved.has(key)));
  const patch = { presetType, configParams, lifetime: def.allowedLifetimes.includes(draft.lifetime) ? draft.lifetime : def.allowedLifetimes[0] };
  MANAGED_FIELDS.forEach(key => { if (!allowed.has(key)) patch[key] = key === 'modifiers' ? [] : null; });
  (def.fields || []).forEach(key => { if (draft[key] == null) patch[key] = key === 'modifiers' ? [] : {}; });
  if (patch.lifetime === 'Instant') Object.assign(patch, { expireCondition: null, stack: null, phaseListeners: [] });
  return patch;
}