import { parseLevelBlueprintGraph } from './levelBlueprintGraphContract';

export function createLevelBlueprintRuntime({ blueprint, actionGraphs = [], onAction } = {}) {
  const graph = parseLevelBlueprintGraph(blueprint?.graph_definition);
  const nodes = new Map(graph.nodes.map(node => [node.id, node]));
  const actions = new Map(actionGraphs.map(action => [action.action_id, action]));
  const variables = Object.fromEntries(Object.entries(graph.variables).map(([key, spec]) => [key, { ...spec }]));
  const outgoing = (nodeId, port) => graph.connections.filter(link => link.fromNode === nodeId && link.fromPort === port);
  const incoming = (nodeId, port) => graph.connections.find(link => link.toNode === nodeId && link.toPort === port);
  const isEventListener = (node) => node?.type === 'level_event_listener'
    || node?.type === 'level_custom_event_listener'
    || node?.type?.startsWith('level_builtin_event_');

  const readOutput = (nodeId, port, payload) => {
    const node = nodes.get(nodeId);
    if (!node) return undefined;
    if (isEventListener(node) && port === 'payload') return payload;
    if (node.type === 'level_variable_read' && port === 'value') return variables[node.data?.variableKey]?.value;
    return node.data?.[port];
  };

  const readInput = (node, port, payload) => {
    const link = incoming(node.id, port);
    return link ? readOutput(link.fromNode, link.fromPort, payload) : node.data?.[port];
  };

  const dispatch = (eventId, payload = {}) => {
    const result = { eventId, actions: [], variableWrites: [], logs: [], errors: [] };
    const walk = (nodeId, eventPayload, visited = new Set()) => {
      if (visited.has(nodeId)) { result.errors.push(`执行流存在循环：${nodeId}`); return; }
      const node = nodes.get(nodeId);
      if (!node) return;
      const nextVisited = new Set(visited).add(nodeId);
      let nextPort = 'exec_out';
      if (node.type === 'level_sequence') {
        node.outputs
          ?.filter(output => output.id.startsWith('then_'))
          .sort((a, b) => a.id.localeCompare(b.id))
          .forEach(output => outgoing(node.id, output.id).forEach(link => walk(link.toNode, eventPayload, nextVisited)));
        return;
      }
      if (node.type === 'level_branch') {
        nextPort = Boolean(readInput(node, 'condition', eventPayload)) ? 'true' : 'false';
      } else if (node.type === 'level_log') {
        const value = readInput(node, 'payload', eventPayload);
        const count = Array.isArray(value) ? ` · 实体 ${value.length}` : '';
        result.logs.push(`${node.data?.message || 'LevelBlueprint'}${count}`);
      } else if (node.type === 'level_execute_action') {
        const actionId = node.data?.actionId;
        const action = actions.get(actionId);
        if (!action) result.errors.push(`ActionGraph 不存在：${actionId || '(空)'}`);
        else {
          const actionPayload = readInput(node, 'payload', eventPayload) ?? eventPayload;
          result.actions.push(actionId);
          onAction?.(action, actionPayload, { blueprint, eventId });
        }
      } else if (node.type === 'level_variable_write') {
        const key = node.data?.variableKey;
        if (!variables[key]) result.errors.push(`关卡变量不存在：${key || '(空)'}`);
        else {
          variables[key] = { ...variables[key], value: readInput(node, 'value', eventPayload) };
          result.variableWrites.push(key);
        }
      } else if (isEventListener(node)) nextPort = 'exec';
      outgoing(node.id, nextPort).forEach(link => walk(link.toNode, eventPayload, nextVisited));
    };

    graph.nodes
      .filter(node => isEventListener(node) && node.data?.eventId === eventId)
      .forEach(listener => walk(listener.id, payload));
    return { ...result, variables: Object.fromEntries(Object.entries(variables).map(([key, spec]) => [key, spec.value])) };
  };

  return { blueprintId: blueprint?.blueprint_id, dispatch, getVariables: () => variables };
}