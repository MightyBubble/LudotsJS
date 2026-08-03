const isAlive = entity => entity?.is_alive !== false && entity?.alive !== false && entity?.destroyed !== true;

const normalizeMapEntity = entity => ({
  ...entity,
  id: entity.instance_id,
  entity_id: entity.instance_id,
  prototype_id: entity.template,
  is_alive: true,
});

const normalizeRuntimeEntity = entity => ({
  ...entity,
  entity_id: entity.entity_id || entity.id,
  is_alive: true,
});

export function buildAliveUnitCollection(mapEntities = [], runtimeEntities = []) {
  return [
    ...mapEntities.filter(isAlive).map(normalizeMapEntity),
    ...runtimeEntities.filter(isAlive).map(normalizeRuntimeEntity),
  ];
}