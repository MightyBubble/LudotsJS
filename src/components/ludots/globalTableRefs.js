export const LUDOTS_TABLE_IDS = {
  gasClockIds: 'ludots_gas_clock_ids',
  execItemKinds: 'ludots_ability_exec_item_kinds',
  dispatchTargets: 'ludots_ability_dispatch_targets',
  inputTriggers: 'ludots_input_trigger_types',
  heldPolicies: 'ludots_input_held_policies',
  castModes: 'ludots_input_cast_modes',
  autoTargetPolicies: 'ludots_input_auto_target_policies',
  effectPresets: 'ludots_effect_preset_types',
  targetDispatchPresets: 'ludots_target_dispatch_presets',
};

export function getGlobalTableRows(constants = [], tableId) {
  return constants.filter(item => item.table_id === tableId);
}

export function parseGlobalValue(item) {
  if (!item) return undefined;
  if (item.value_type === 'object' || item.value_type === 'array') {
    try { return JSON.parse(item.constant_value); } catch { return undefined; }
  }
  if (item.value_type === 'number') return Number(item.constant_value);
  if (item.value_type === 'boolean') return item.constant_value === true || item.constant_value === 'true';
  return item.constant_value;
}

export function getGlobalTableValues(constants, tableId, fallback = []) {
  const rows = getGlobalTableRows(constants, tableId);
  return rows.length ? rows.map(item => parseGlobalValue(item) ?? item.constant_key) : fallback;
}

export function getGlobalTableOptions(constants, tableId, fallback = []) {
  const rows = getGlobalTableRows(constants, tableId);
  return rows.length
    ? rows.map(item => ({ value: item.constant_key, label: item.constant_key }))
    : fallback.map(value => ({ value, label: value }));
}