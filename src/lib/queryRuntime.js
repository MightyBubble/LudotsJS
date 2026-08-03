// 实体查询图执行引擎
// 输入：查询图定义(nodes/connections) + 模拟实体集
// 输出：每个节点的实体集结果 + 最终输出
//
// 模拟实体形状：
// {
//   id, name, prototype_id,
//   attributes: { [attributeId]: { [key]: number } },
//   tags: { [tagPath]: count },
//   position: { x, y, z },
//   relations: [{ relation_id, target_id, attributes: { [attributeId]: { [key]: number } }, tags: { [tagPath]: count } }]
// }

const compare = (a, op, b) => {
  switch (op) {
    case 'gt': return a > b;
    case 'lt': return a < b;
    case 'gte': return a >= b;
    case 'lte': return a <= b;
    case 'eq': return a === b;
    case 'neq': return a !== b;
    default: return false;
  }
};

const attrValue = (holder, attributeId, key) =>
  Number(holder?.attributes?.[attributeId]?.[key] ?? 0);

const tagCount = (holder, tagPath) => {
  if (!tagPath) return 0;
  // 父路径匹配子标签：Status.Buff 命中 Status.Buff.Rage
  return Object.entries(holder?.tags || {}).reduce((sum, [path, count]) =>
    path === tagPath || path.startsWith(`${tagPath}.`) ? sum + Number(count || 0) : sum, 0);
};

const relationsOf = (entity, relationId) =>
  (entity.relations || []).filter(r => !relationId || r.relation_id === relationId);

const relatedEntities = (entity, relationId, allEntities) =>
  relationsOf(entity, relationId)
    .map(r => allEntities.find(e => e.id === r.target_id))
    .filter(Boolean);

const distance = (p = {}, t = {}) => Math.sqrt(
  ((p.x || 0) - (t.x || 0)) ** 2 + ((p.y || 0) - (t.y || 0)) ** 2 + ((p.z || 0) - (t.z || 0)) ** 2
);

const sortWith = (entities, valueOf, order) => {
  const sorted = [...entities].sort((a, b) => valueOf(a) - valueOf(b));
  return order === 'desc' ? sorted.reverse() : sorted;
};

const tagMatch = (holder, tagPath, mode) =>
  mode === 'not_has' ? tagCount(holder, tagPath) === 0 : tagCount(holder, tagPath) > 0;

// 单节点求值：输入实体集 -> 输出实体集
function evaluateQueryNode(node, inputs, allEntities, context) {
  const d = node.data || {};
  const list = inputs.entities || [];
  const a = inputs.a || [];
  const b = inputs.b || [];

  switch (node.type) {
    case 'entity_source':
      return allEntities;

    case 'filter_prototype':
      return list.filter(e => !d.prototypeId || e.prototype_id === d.prototypeId);

    case 'filter_control_context':
      return context?.mode === 'Teams'
        ? list.filter(e => Number(e.team_id) === Number(context.viewId))
        : list.filter(e => Number(e.owner_player_id) === Number(context?.viewId));

    case 'filter_attribute':
      return list.filter(e => compare(attrValue(e, d.attributeId, d.key), d.operator, Number(d.threshold ?? 0)));

    case 'filter_tag':
      return list.filter(e => tagMatch(e, d.tagPath, d.mode));

    case 'filter_relation':
      return list.filter(e => d.direction === 'target'
        ? allEntities.some(o => relationsOf(o, d.relationId).some(r => r.target_id === e.id))
        : relationsOf(e, d.relationId).length > 0);

    case 'filter_relation_attribute':
      return list.filter(e => relationsOf(e, d.relationId)
        .some(r => compare(attrValue(r, d.attributeId, d.key), d.operator, Number(d.threshold ?? 0))));

    case 'filter_relation_tag':
      return list.filter(e => relationsOf(e, d.relationId).some(r => tagMatch(r, d.tagPath, d.mode)));

    case 'filter_related_entity_attribute':
      return list.filter(e => relatedEntities(e, d.relationId, allEntities)
        .some(t => compare(attrValue(t, d.attributeId, d.key), d.operator, Number(d.threshold ?? 0))));

    case 'filter_related_entity_tag':
      return list.filter(e => relatedEntities(e, d.relationId, allEntities)
        .some(t => tagMatch(t, d.tagPath, d.mode)));

    case 'spatial_distance':
      return list.filter(e => distance(e.position, { x: d.x, y: d.y, z: d.z }) <= Number(d.maxDistance ?? 0));

    case 'spatial_area':
      return list.filter(e => {
        const p = e.position || {};
        const c = { x: Number(d.centerX || 0), y: Number(d.centerY || 0), z: Number(d.centerZ || 0) };
        if (d.shape === 'box') {
          return Math.abs((p.x || 0) - c.x) <= Number(d.sizeX || 0) / 2
            && Math.abs((p.y || 0) - c.y) <= Number(d.sizeY || 0) / 2
            && Math.abs((p.z || 0) - c.z) <= Number(d.sizeZ || 0) / 2;
        }
        return distance(p, c) <= Number(d.sizeX || 0);
      });

    case 'logic_intersect':
      return a.filter(e => b.some(o => o.id === e.id));

    case 'logic_union':
      return [...a, ...b.filter(e => !a.some(o => o.id === e.id))];

    case 'logic_difference':
      return a.filter(e => !b.some(o => o.id === e.id));

    case 'sort_by_attribute':
      return sortWith(list, e => attrValue(e, d.attributeId, d.key), d.order);

    case 'sort_by_relation':
      return sortWith(list, e => relationsOf(e, d.relationId).length, d.order);

    case 'sort_by_tag':
      return sortWith(list, e => tagCount(e, d.tagPath), d.order);

    case 'limit_top':
      return list.slice(0, Math.max(0, Number(d.count ?? 0)));

    case 'limit_bottom':
      return list.slice(Math.max(0, list.length - Math.max(0, Number(d.count ?? 0))));

    case 'limit_percent_top':
      return list.slice(0, Math.ceil(list.length * Math.max(0, Number(d.percent ?? 0)) / 100));

    case 'limit_percent_bottom': {
      const take = Math.ceil(list.length * Math.max(0, Number(d.percent ?? 0)) / 100);
      return list.slice(Math.max(0, list.length - take));
    }

    case 'output':
      return list;

    default:
      // 未实现执行语义的节点：透传输入
      return list;
  }
}

// 执行整张查询图
export function executeQueryGraph({ nodes = [], connections = [] }, entities = [], context = {}) {
  const results = {};
  const visiting = new Set();

  const resolve = (nodeId) => {
    if (results[nodeId]) return results[nodeId];
    if (visiting.has(nodeId)) return [];
    visiting.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return [];

    const inputs = {};
    connections.filter(c => c.toNode === nodeId).forEach(c => {
      inputs[c.toPort] = resolve(c.fromNode);
    });

    const out = evaluateQueryNode(node, inputs, entities, context);
    visiting.delete(nodeId);
    results[nodeId] = out;
    return out;
  };

  nodes.forEach(n => resolve(n.id));

  // 最终输出：output 节点优先，否则取没有下游连接的最后一个节点
  const outputNode = nodes.find(n => n.type === 'output');
  const terminal = outputNode
    || [...nodes].reverse().find(n => !connections.some(c => c.fromNode === n.id));

  return {
    nodeResults: results,
    output: terminal ? (results[terminal.id] || []) : [],
    outputNodeId: terminal?.id || null,
  };
}

// 将 SimulatedEntity 记录转换为运行时实体形状
export function simulatedEntitiesToRuntime(records = []) {
  return records
    .filter(r => r.is_active !== false)
    .map(r => ({
      id: r.entity_key,
      name: r.name,
      prototype_id: r.prototype_id,
      attributes: r.attributes || {},
      tags: r.tags || {},
      position: r.position || {},
      relations: (r.relations || []).map(rel => ({
        relation_id: rel.relation_id,
        target_id: rel.target_key,
        attributes: rel.attributes || {},
        tags: rel.tags || {},
      })),
    }));
}