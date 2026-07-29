// StructureDefinition <-> 画布(nodes/connections) 双向转换
// StructureDefinition 是结构图的唯一真源，统一图编辑器通过此适配层读写它。
import { getNodeConfig } from '@/components/graph/nodeConfigs';

const STRUCTURE_PORTS = () => {
  const config = getNodeConfig('structure_node') || {};
  return {
    inputs: config.inputs || [{ id: 'in', label: '入', type: 'relation' }],
    outputs: config.outputs || [{ id: 'out', label: '出', type: 'relation' }],
  };
};

// StructureDefinition -> 画布数据
export function structureToGraph(structure) {
  const { inputs, outputs } = STRUCTURE_PORTS();

  const nodes = (structure?.nodes || []).map((n, index) => ({
    id: `struct-${n.node_id}`,
    type: 'structure_node',
    position: n.position || { x: 120 + (index % 4) * 220, y: 120 + Math.floor(index / 4) * 160 },
    data: {
      nodeId: n.node_id,
      label: n.name || n.node_id,
      description: n.description || '',
      color: n.color,
      metadata: n.metadata,
    },
    inputs,
    outputs,
  }));

  const connections = (structure?.edges || []).map((e, index) => ({
    id: `edge-${e.source_node_id}-${e.target_node_id}-${index}`,
    fromNode: `struct-${e.source_node_id}`,
    fromPort: outputs[0].id,
    toNode: `struct-${e.target_node_id}`,
    toPort: inputs[0].id,
    data: {
      relation_definition_id: e.relation_definition_id || '',
      attribute_values: e.attribute_values || {},
    },
  }));

  return { nodes, connections };
}

// 画布数据 -> StructureDefinition 的 nodes / edges
export function graphToStructure(nodes, connections) {
  const nodeIdOf = (canvasId) => {
    const node = nodes.find(n => n.id === canvasId);
    return node?.data?.nodeId || canvasId.replace(/^struct-/, '');
  };

  return {
    nodes: nodes.map(n => ({
      node_id: n.data?.nodeId || n.id.replace(/^struct-/, ''),
      name: n.data?.label || n.data?.nodeId || '',
      description: n.data?.description || '',
      color: n.data?.color,
      position: n.position,
      metadata: n.data?.metadata,
    })),
    edges: connections.map(c => ({
      source_node_id: nodeIdOf(c.fromNode),
      target_node_id: nodeIdOf(c.toNode),
      relation_definition_id: c.data?.relation_definition_id || '',
      attribute_values: c.data?.attribute_values || {},
    })),
  };
}