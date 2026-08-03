import { executeQueryGraph } from '@/lib/queryRuntime';

export function normalizeEntityPanelProfile(profile = {}) {
  return {
    ...profile,
    source: profile.source || { collection_key: '' },
    filter: { entity_query_graph_ref: '', ...(profile.filter || {}) },
    layout: { mode: 'flat', columns: 4, visible_rows: null, ...(profile.layout || {}) },
    item_presentation_profile_ref: profile.item_presentation_profile_ref || '',
    selection: { mode: 'multiple', ...(profile.selection || {}) },
  };
}

export function resolveEntityPanel(profileRecord, entities = [], queryGraph = null, itemPresenter = null) {
  const profile = normalizeEntityPanelProfile(profileRecord);
  const runtimeEntities = entities.map(entity => ({ ...entity, id: entity.id || entity.entity_id || entity.instance_id }));
  const filtered = queryGraph
    ? executeQueryGraph(JSON.parse(queryGraph.graph_definition), runtimeEntities).output
    : runtimeEntities;
  const cards = profile.layout.mode === 'flat'
    ? filtered.map(entity => ({ key: entity.id, label: entity.name || entity.prototype_id, count: 1, entities: [entity] }))
    : [...filtered.reduce((groups, entity) => {
        const key = entity.prototype_id;
        const current = groups.get(key) || { key, label: entity.name || key, count: 0, entities: [] };
        current.count += 1;
        current.entities.push(entity);
        groups.set(key, current);
        return groups;
      }, new Map()).values()];
  const presentedCards = cards.map(card => ({ ...card, display: itemPresenter?.resolve(card.entities[0], 'entity', profile.item_presentation_profile_ref) || { title: card.label } }));
  return { profile, cards: presentedCards, entityCount: filtered.length };
}