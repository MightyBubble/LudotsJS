export const LEVEL_BLUEPRINT_GRAPH_DOMAIN = 'level_blueprint';
export const LEVEL_BLUEPRINT_GRAPH_SCHEMA_VERSION = 1;

export function emptyLevelBlueprintGraph() {
  return { nodes: [], connections: [], variables: {} };
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