import { LEVEL_LIFECYCLE_EVENTS, levelBuiltinEventNodeType } from './levelLifecycle';

export const LEVEL_BLUEPRINT_GRAPH_DOMAIN = 'level_blueprint';
export const LEVEL_BLUEPRINT_GRAPH_SCHEMA_VERSION = 1;

export function emptyLevelBlueprintGraph() {
  return { nodes: [], connections: [], variables: {} };
}

export function defaultLevelBlueprintGraph() {
  return {
    nodes: LEVEL_LIFECYCLE_EVENTS.map((event, index) => ({
      id: `lifecycle-${event.value.slice('Level.'.length).toLowerCase()}`,
      type: levelBuiltinEventNodeType(event.value),
      position: { x: 120 + (index % 3) * 300, y: 100 + Math.floor(index / 3) * 180 },
      data: { eventId: event.value },
      inputs: [],
      outputs: [{ id: 'exec', label: '触发', type: 'exec' }, { id: 'payload', label: '事件数据', type: 'object' }],
    })),
    connections: [],
    variables: {},
  };
}

export function parseLevelBlueprintGraph(value) {
  if (!value) return emptyLevelBlueprintGraph();
  try {
    const graph = typeof value === 'string' ? JSON.parse(value) : value;
    if (graph.domain !== LEVEL_BLUEPRINT_GRAPH_DOMAIN) return emptyLevelBlueprintGraph();
    return { nodes: graph.nodes || [], connections: graph.connections || [], variables: graph.variables || {} };
  } catch {
    return emptyLevelBlueprintGraph();
  }
}

export function serializeLevelBlueprintGraph(nodes = [], connections = [], variables = {}) {
  return JSON.stringify({
    domain: LEVEL_BLUEPRINT_GRAPH_DOMAIN,
    schemaVersion: LEVEL_BLUEPRINT_GRAPH_SCHEMA_VERSION,
    nodes,
    connections,
    variables
  });
}