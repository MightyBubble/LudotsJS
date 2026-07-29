import { getNodeConfig } from '@/components/graph/nodeConfigs';

export function compileRuntimeGraph(graphId, nodes, connections) {
  const runtimeNodes = nodes.filter(node => node.data?.runtimeOp);
  if (!runtimeNodes.length) return null;
  const runtimeIds = new Set(runtimeNodes.map(node => node.id));
  const incoming = targetId => connections.filter(link => link.toNode === targetId && runtimeIds.has(link.fromNode));
  const compiled = runtimeNodes.map(node => {
    const config = getNodeConfig(node.type);
    const result = { id: node.id, op: node.data.runtimeOp };
    const inputs = incoming(node.id).filter(link => link.toPort !== 'exec').sort((a, b) => a.toPort.localeCompare(b.toPort)).map(link => link.fromNode);
    const next = connections.find(link => link.fromNode === node.id && link.fromPort === 'exec_out' && runtimeIds.has(link.toNode));
    if (inputs.length) result.inputs = inputs;
    if (next) result.next = next.toNode;
    (config?.configFields || []).forEach(field => { result[field.key] = node.data[field.key] ?? field.defaultValue; });
    return result;
  });
  const entryLink = connections.find(link => nodes.find(node => node.id === link.fromNode)?.type === 'action_entry' && runtimeIds.has(link.toNode));
  return { id: graphId, kind: 'Effect', entry: entryLink?.toNode || runtimeNodes[0].id, nodes: compiled, outputs: [] };
}