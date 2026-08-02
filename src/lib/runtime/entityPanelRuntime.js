export function normalizeEntityPanelProfile(profile = {}) {
  return {
    ...profile,
    source: profile.source || { collection_key: '' },
    filter: { prototype_ids: [], required_ability_ids: [], required_role_ids: [], ...(profile.filter || {}) },
    layout: { mode: 'flat', columns: 4, visible_rows: null, aggregate_by: 'prototype', ...(profile.layout || {}) },
    selection: { mode: 'multiple', ...(profile.selection || {}) },
  };
}

const hasAll = (values = [], required = []) => required.every(value => values.includes(value));

export function resolveEntityPanel(profileRecord, entities = []) {
  const profile = normalizeEntityPanelProfile(profileRecord);
  const filtered = entities.filter(entity => {
    const prototypes = profile.filter.prototype_ids;
    const roles = (entity.role_bindings || []).map(binding => binding.role_id);
    return (!prototypes.length || prototypes.includes(entity.prototype_id))
      && hasAll(entity.ability_ids, profile.filter.required_ability_ids)
      && hasAll(roles, profile.filter.required_role_ids);
  });
  const cards = profile.layout.mode === 'flat'
    ? filtered.map(entity => ({ key: entity.entity_id, label: entity.name || entity.prototype_id, count: 1, entities: [entity] }))
    : [...filtered.reduce((groups, entity) => {
        const key = profile.layout.aggregate_by === 'semantic_profile' ? entity.semantic_profile_ref || 'none' : entity.prototype_id;
        const current = groups.get(key) || { key, label: entity.name || key, count: 0, entities: [] };
        current.count += 1;
        current.entities.push(entity);
        groups.set(key, current);
        return groups;
      }, new Map()).values()];
  return { profile, cards, entityCount: filtered.length };
}