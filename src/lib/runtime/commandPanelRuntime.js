const list = value => Array.isArray(value) ? value : [];
const hasTag = (tags, query) => tags.some(tag => tag === query || tag.startsWith(`${query}.`));
const matches = (ability, required = [], blocked = []) => {
  const tags = list(ability?.catalogTags);
  return required.every(tag => hasTag(tags, tag)) && !blocked.some(tag => hasTag(tags, tag));
};

export function buildCommandPanelProfile(params = {}) {
  return {
    panel_id: params.panel_id || 'Runtime.DynamicPanel',
    label: params.label || 'Runtime Panel',
    source: { collection_key: params.collection_key || 'runtime.actors' },
    filter: { required_all_tags: list(params.required_all_tags), blocked_any_tags: list(params.blocked_any_tags) },
    grouping: { rules: list(params.grouping_rules) },
    layout: {
      mode: params.mode || 'dynamic',
      grid: { columns: params.columns || 4, visible_rows: params.visible_rows || 3 },
      fixed: { slots: list(params.slots) },
      dynamic: { buckets: list(params.buckets), hotkey_action_ids: list(params.hotkey_action_ids) },
    },
  };
}

function collectCandidates(actors, abilityMap, profile) {
  return actors.flatMap(actor => list(actor.ability_ids).map(abilityId => ({ actor, ability: abilityMap.get(abilityId) })))
    .filter(item => item.ability && matches(item.ability, profile.filter?.required_all_tags, profile.filter?.blocked_any_tags));
}

function aggregationKey(item, rules) {
  const rule = rules.find(entry => matches(item.ability, entry.match_all_tags, []));
  if (!rule?.aggregate_key_tags?.length) return item.ability.ability_id;
  const tags = list(item.ability.catalogTags);
  const values = rule.aggregate_key_tags.flatMap(prefix => tags.filter(tag => hasTag([tag], prefix)));
  return values.length ? values.sort().join('|') : item.ability.ability_id;
}

function buildFixed(profile, actors, abilityMap, trace) {
  return list(profile.layout?.fixed?.slots).map(slot => {
    const resolved = actors.flatMap(actor => list(actor.role_bindings)
      .filter(binding => binding.role_id === slot.role_id)
      .map(binding => ({ actor, ability: abilityMap.get(binding.ability_id) })))
      .filter(item => item.ability);
    trace.push(`${slot.slot_id}: ${slot.role_id} → ${resolved[0]?.ability?.ability_id || 'unbound'}`);
    return { slot_id: slot.slot_id, role_id: slot.role_id, action_id: slot.action_id || '', ability: resolved[0]?.ability || null, actor_count: resolved.length, empty: !resolved.length };
  });
}

function buildDynamic(profile, candidates, trace) {
  const rules = list(profile.grouping?.rules);
  const grouped = new Map();
  candidates.forEach(item => {
    const key = aggregationKey(item, rules);
    const group = grouped.get(key) || { ...item, actor_count: 0 };
    group.actor_count += 1;
    grouped.set(key, group);
  });
  const buckets = list(profile.layout?.dynamic?.buckets);
  const hotkeys = list(profile.layout?.dynamic?.hotkey_action_ids);
  const ordered = [...grouped.values()].sort((a, b) => {
    const rank = item => { const index = buckets.findIndex(bucket => matches(item.ability, bucket.required_all_tags, bucket.blocked_any_tags)); return index < 0 ? buckets.length : index; };
    return rank(a) - rank(b) || a.ability.ability_id.localeCompare(b.ability.ability_id);
  });
  trace.push(`${candidates.length} candidates → ${ordered.length} aggregated buttons`);
  return ordered.map((item, index) => ({ slot_id: `dynamic_${index}`, role_id: '', action_id: hotkeys[index] || '', ability: item.ability, actor_count: item.actor_count, empty: false }));
}

export function createCommandPanel({ profile, params, actors = [], abilities = [] }) {
  const resolvedProfile = profile || buildCommandPanelProfile(params);
  const abilityMap = new Map(abilities.map(ability => [ability.ability_id, ability]));
  const trace = [`profile: ${resolvedProfile.panel_id}`, `source: ${resolvedProfile.source?.collection_key || 'runtime.actors'}`];
  const candidates = collectCandidates(actors, abilityMap, resolvedProfile);
  const buttons = resolvedProfile.layout?.mode === 'fixed'
    ? buildFixed(resolvedProfile, actors, abilityMap, trace)
    : buildDynamic(resolvedProfile, candidates, trace);
  const missing = buttons.filter(button => button.empty).length;
  return { profile: resolvedProfile, buttons, trace, diagnostics: { actor_count: actors.length, candidate_count: candidates.length, button_count: buttons.length - missing, missing_slots: missing } };
}