import { getNodeConfig } from '@/components/graph/nodeConfigs';

const num = (v, fallback = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};
const arr = (v) => (Array.isArray(v) ? v : []);

// 单个节点的求值语义。inputs 已经解析好（连线优先，否则用节点内联数据）
function evaluateNode(node, inputs, blackboard) {
  const d = node.data || {};
  const pick = (id, fallback) => (inputs[id] !== undefined ? inputs[id] : (d[id] !== undefined ? d[id] : fallback));

  switch (node.type) {
    // ---- 数值 ----
    case 'number':
      return { value: num(d.value) };
    case 'add':
      return { result: num(pick('a')) + num(pick('b')) };
    case 'subtract':
      return { result: num(pick('a')) - num(pick('b')) };
    case 'multiply':
      return { result: num(pick('a')) * num(pick('b')) };
    case 'divide': {
      const b = num(pick('b'), 1);
      return { result: b !== 0 ? num(pick('a')) / b : 0 };
    }
    case 'power':
      return { result: Math.pow(num(pick('base')), num(pick('exponent'))) };
    case 'clamp': {
      const v = num(pick('value'));
      const lo = num(pick('min'));
      const hi = num(pick('max'), 100);
      return { result: Math.max(lo, Math.min(hi, v)) };
    }

    // ---- 向量 / 颜色 ----
    case 'vector2':
      return { value: { x: num(pick('x')), y: num(pick('y')) } };
    case 'vector3':
      return { value: { x: num(pick('x')), y: num(pick('y')), z: num(pick('z')) } };
    case 'vector4':
    case 'quaternion':
      return { value: { x: num(pick('x')), y: num(pick('y')), z: num(pick('z')), w: num(pick('w')) } };
    case 'color':
      return { value: { r: num(pick('r'), 1), g: num(pick('g'), 1), b: num(pick('b'), 1) } };

    // ---- 黑板 ----
    case 'blackboard_get':
      return { value: blackboard[d.key]?.value };
    case 'blackboard_set':
      return { value: pick('value') };

    // ---- 比较 ----
    case 'compare_equal':
      return { result: pick('a') === pick('b') };
    case 'compare_not_equal':
      return { result: pick('a') !== pick('b') };
    case 'compare_greater':
      return { result: num(pick('a')) > num(pick('b')) };
    case 'compare_less':
      return { result: num(pick('a')) < num(pick('b')) };
    case 'compare_greater_equal':
      return { result: num(pick('a')) >= num(pick('b')) };
    case 'compare_less_equal':
      return { result: num(pick('a')) <= num(pick('b')) };

    // ---- 逻辑 ----
    case 'logic_and':
      return { result: Boolean(pick('a')) && Boolean(pick('b')) };
    case 'logic_or':
      return { result: Boolean(pick('a')) || Boolean(pick('b')) };
    case 'logic_not':
      return { result: !pick('value') };

    // ---- 集合 ----
    case 'set_contains':
      return { result: arr(pick('set')).includes(pick('item')) };
    case 'set_not_contains':
      return { result: !arr(pick('set')).includes(pick('item')) };
    case 'set_intersect':
      return { result: arr(pick('a')).filter(x => arr(pick('b')).includes(x)) };
    case 'set_union':
      return { result: [...new Set([...arr(pick('a')), ...arr(pick('b'))])] };
    case 'set_difference':
      return { result: arr(pick('a')).filter(x => !arr(pick('b')).includes(x)) };
    case 'set_is_subset':
      return { result: arr(pick('subset')).every(x => arr(pick('superset')).includes(x)) };
    case 'set_size':
      return { result: arr(pick('set')).length };
    case 'set_is_empty':
      return { result: arr(pick('set')).length === 0 };

    // ---- 条件 ----
    case 'if_else':
      return { result: pick('condition') ? pick('true_value') : pick('false_value') };

    // ---- 标签判断 ----
    case 'has_tag':
      return { result: arr(pick('tags')).includes(pick('tag_path')) };
    case 'has_any_tags':
      return { result: arr(pick('tag_paths')).some(t => arr(pick('tags')).includes(t)) };
    case 'has_all_tags':
      return { result: arr(pick('tag_paths')).every(t => arr(pick('tags')).includes(t)) };

    // ---- 其他节点：按端口透传（查询/结构节点的计算尚未实现）----
    default: {
      const config = getNodeConfig(node.type);
      const outputs = config?.outputs || [];
      // 输出/终结节点没有输出端口：把解析到的输入原样作为它的值，供整图结果读取
      if (outputs.length === 0) {
        const firstInput = (node.inputs || [])[0];
        return { value: inputs.value !== undefined ? inputs.value : (firstInput ? inputs[firstInput.id] : undefined) };
      }
      return outputs.reduce((acc, out) => {
        acc[out.id] = inputs[out.id] !== undefined
          ? inputs[out.id]
          : (out.type === 'entities' || out.type === 'array' ? [] : undefined);
        return acc;
      }, {});
    }
  }
}

/**
 * 执行一个图定义（拓扑求值，带环检测）。
 * @param {{nodes:Array, connections:Array, blackboard:Object}} graphDef
 * @param {Object} blackboardOverrides 形如 { key: value }，覆盖黑板变量的值
 * @returns {{nodeValues:Object, connectionValues:Object, terminalValue:*}}
 */
export function evaluateGraph(graphDef, blackboardOverrides = {}) {
  const nodes = graphDef?.nodes || [];
  const connections = graphDef?.connections || [];

  const blackboard = { ...(graphDef?.blackboard || {}) };
  Object.entries(blackboardOverrides).forEach(([key, value]) => {
    blackboard[key] = { ...(blackboard[key] || {}), value };
  });

  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const nodeValues = {};
  const connectionValues = {};
  const done = new Set();
  const stack = new Set();

  const execute = (nodeId) => {
    if (done.has(nodeId)) return nodeValues[nodeId];
    if (stack.has(nodeId)) return {}; // 环：返回空值中断
    const node = nodeById.get(nodeId);
    if (!node) return {};

    stack.add(nodeId);

    const inputs = {};
    (node.inputs || []).forEach(input => {
      const conn = connections.find(c => c.toNode === nodeId && c.toPort === input.id);
      if (conn) {
        const upstream = execute(conn.fromNode) || {};
        const value = upstream[conn.fromPort];
        if (value !== undefined) {
          inputs[input.id] = value;
          connectionValues[conn.id] = value;
        }
      }
    });

    let output = {};
    try {
      output = evaluateNode(node, inputs, blackboard) || {};
    } catch {
      output = {};
    }

    stack.delete(nodeId);
    nodeValues[nodeId] = output;
    done.add(nodeId);
    return output;
  };

  nodes.forEach(n => execute(n.id));

  // 整图结果：优先取显式的输出节点，否则取没有下游连线的终端节点
  let terminalValue;
  const terminals = nodes.filter(n => !connections.some(c => c.fromNode === n.id));
  const outputNodes = terminals.filter(n => String(n.type).startsWith('output'));
  const candidates = (outputNodes.length > 0 ? outputNodes : terminals).slice().reverse();
  for (const candidate of candidates) {
    const outs = nodeValues[candidate.id] || {};
    const firstDefined = Object.values(outs).find(v => v !== undefined);
    if (firstDefined !== undefined) {
      terminalValue = firstDefined;
      break;
    }
  }

  return { nodeValues, connectionValues, terminalValue };
}

/** 解析实体上以 JSON 字符串存储的 graph_definition */
export function parseGraphDefinition(graph) {
  if (!graph) return { nodes: [], connections: [], blackboard: {} };
  try {
    const def = typeof graph.graph_definition === 'string'
      ? JSON.parse(graph.graph_definition)
      : graph.graph_definition || {};
    return { nodes: def.nodes || [], connections: def.connections || [], blackboard: def.blackboard || {} };
  } catch {
    return { nodes: [], connections: [], blackboard: {} };
  }
}

/**
 * 用给定的黑板输入执行一张图，返回数值结果。
 * 图不存在或没有可求值的终端时返回 null（调用方决定回退策略）。
 */
export function evaluateGraphValue(graph, blackboardOverrides = {}) {
  const def = parseGraphDefinition(graph);
  if (def.nodes.length === 0) return null;
  const { terminalValue } = evaluateGraph(def, blackboardOverrides);
  if (typeof terminalValue === 'number') return terminalValue;
  if (typeof terminalValue === 'boolean') return terminalValue ? 1 : 0;
  return null;
}