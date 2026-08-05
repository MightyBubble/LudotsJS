import { readInstanceOverrides } from './performerOverrides';

const valueOf = (entry) => entry?.lane === 'Int' ? entry.intValue : entry?.lane === 'Vector' ? entry.vectorValue : entry?.floatValue;

const mergeDefinition = (definition, definitions, trail = new Set()) => {
  if (!definition?.extends || trail.has(definition.performer_id)) return definition || {};
  const parent = definitions.get(definition.extends);
  if (!parent) return definition;
  const nextTrail = new Set(trail).add(definition.performer_id);
  const base = mergeDefinition(parent, definitions, nextTrail);
  return {
    ...base,
    ...definition,
    behaviors: [...(base.behaviors || []), ...(definition.behaviors || [])],
    paramDefaults: [...(base.paramDefaults || []), ...(definition.paramDefaults || [])],
    rules: [...(base.rules || []), ...(definition.rules || [])],
    children: [...(base.children || []), ...(definition.children || [])],
  };
};

const buildParams = (definition, inherited, overrides = []) => {
  const params = new Map(inherited || []);
  [...(definition.paramDefaults || []), ...overrides].forEach(entry => params.set(entry.paramKey, valueOf(entry)));
  return params;
};

const matchesRule = (rule, event) => {
  if (rule.event?.kind !== event.kind || rule.event?.key !== event.key) return false;
  const condition = rule.condition?.inline;
  return !condition || condition === 'None' || (condition === 'TagGained' && event.gained) || (condition === 'TagLost' && !event.gained);
};

const instantiateNode = (definitionId, context, childConfig = {}, path = []) => {
  if (path.includes(definitionId)) return { definitionId, error: 'cycle', children: [] };
  const raw = context.definitions.get(definitionId);
  if (!raw) return { definitionId, error: 'missing', children: [] };
  const definition = mergeDefinition(raw, context.definitions);
  const overrides = readInstanceOverrides(childConfig);
  const params = buildParams(definition, context.params, overrides.params);
  const activeSlots = new Set((definition.behaviors || []).filter(item => item.activeByDefault !== false).map(item => item.slot));
  const node = {
    definitionId,
    scopeTag: childConfig.scope_tag ?? null,
    definition,
    params,
    transform: overrides.transform,
    activeSlots,
    children: [],
  };
  node.children = (definition.children || []).map(child => instantiateNode(child.definition_id, { ...context, params }, child, [...path, definitionId]));
  return node;
};

const visit = (node, callback) => {
  callback(node);
  node.children?.forEach(child => visit(child, callback));
};

const snapshotNode = (node) => ({
  definitionId: node.definitionId,
  scopeTag: node.scopeTag,
  error: node.error,
  params: Object.fromEntries(node.params || []),
  transform: node.transform,
  behaviors: (node.definition?.behaviors || []).filter(item => node.activeSlots?.has(item.slot)),
  children: (node.children || []).map(snapshotNode),
});

export function createPerformerRuntime(performers = []) {
  const definitions = new Map(performers.map(item => [item.performer_id, item]));
  return {
    instantiate(definitionId, overrides = []) {
      const root = instantiateNode(definitionId, { definitions, params: new Map() }, { param_overrides: overrides });
      return {
        root,
        setTag(tag, gained) {
          visit(root, node => {
            (node.definition?.rules || []).filter(rule => matchesRule(rule, { kind: 'TagEffectiveChanged', key: tag, gained })).forEach(rule => {
              const slot = rule.command?.targetBehaviorSlot;
              if (rule.command?.kind === 'ActivateBehavior') node.activeSlots.add(slot);
              if (rule.command?.kind === 'DeactivateBehavior') node.activeSlots.delete(slot);
            });
          });
          return this.snapshot();
        },
        snapshot: () => snapshotNode(root),
      };
    },
  };
}