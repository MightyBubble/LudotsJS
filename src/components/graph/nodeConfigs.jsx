import { Database, Filter, Tag, Link, MapPin, Box, GitMerge, ArrowUpDown, Hash, Percent, Network, Plus, Minus, Divide, Sigma, TrendingUp, Move, Palette, Download, Upload, X } from 'lucide-react';

// 节点类型定义
export const NODE_TYPES = {
  // 数学节点 - 所有graph类型都可用
  number: { 
    label: '数值', 
    icon: Hash, 
    color: '#5b9bd5', 
    category: '基础',
    graphTypes: ['data', 'query'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'number' }]
  },
  add: { 
    label: '加法', 
    icon: Plus, 
    color: '#9b6bb3', 
    category: '数学',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  subtract: { 
    label: '减法', 
    icon: Minus, 
    color: '#9b6bb3', 
    category: '数学',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  multiply: { 
    label: '乘法', 
    icon: X, 
    color: '#9b6bb3', 
    category: '数学',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  divide: { 
    label: '除法', 
    icon: Divide, 
    color: '#9b6bb3', 
    category: '数学',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  power: { 
    label: '幂运算', 
    icon: TrendingUp, 
    color: '#9b6bb3', 
    category: '数学',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'base', label: '底数', type: 'number' },
      { id: 'exponent', label: '指数', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  sum: { 
    label: '求和', 
    icon: Sigma, 
    color: '#e67e22', 
    category: '聚合',
    graphTypes: ['data', 'query'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '总和', type: 'number' }]
  },
  product: { 
    label: '求积', 
    icon: Sigma, 
    color: '#e67e22', 
    category: '聚合',
    graphTypes: ['data', 'query'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '乘积', type: 'number' }]
  },
  max: { 
    label: '最大值', 
    icon: TrendingUp, 
    color: '#e67e22', 
    category: '聚合',
    graphTypes: ['data', 'query'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '最大值', type: 'number' }]
  },
  min: { 
    label: '最小值', 
    icon: TrendingUp, 
    color: '#e67e22', 
    category: '聚合',
    graphTypes: ['data', 'query'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '最小值', type: 'number' }]
  },
  clamp: { 
    label: '钳制', 
    icon: TrendingUp, 
    color: '#e67e22', 
    category: '聚合',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'value', label: '值', type: 'number' },
      { id: 'min', label: '最小值', type: 'number' },
      { id: 'max', label: '最大值', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  
  // 向量节点
  vector2: { 
    label: '二维向量', 
    icon: Move, 
    color: '#70ad47', 
    category: '向量',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'x', label: 'X', type: 'number' },
      { id: 'y', label: 'Y', type: 'number' }
    ],
    outputs: [{ id: 'vector', label: '向量', type: 'vector2' }]
  },
  vector3: { 
    label: '三维向量', 
    icon: Move, 
    color: '#70ad47', 
    category: '向量',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'x', label: 'X', type: 'number' },
      { id: 'y', label: 'Y', type: 'number' },
      { id: 'z', label: 'Z', type: 'number' }
    ],
    outputs: [{ id: 'vector', label: '向量', type: 'vector3' }]
  },
  vector4: { 
    label: '四维向量', 
    icon: Move, 
    color: '#70ad47', 
    category: '向量',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'x', label: 'X', type: 'number' },
      { id: 'y', label: 'Y', type: 'number' },
      { id: 'z', label: 'Z', type: 'number' },
      { id: 'w', label: 'W', type: 'number' }
    ],
    outputs: [{ id: 'vector', label: '向量', type: 'vector4' }]
  },
  quaternion: { 
    label: '四元数', 
    icon: Move, 
    color: '#c97fff', 
    category: '高级',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'x', label: 'X', type: 'number' },
      { id: 'y', label: 'Y', type: 'number' },
      { id: 'z', label: 'Z', type: 'number' },
      { id: 'w', label: 'W', type: 'number' }
    ],
    outputs: [{ id: 'quaternion', label: '四元数', type: 'quaternion' }]
  },
  color: { 
    label: '颜色', 
    icon: Palette, 
    color: '#ffc000', 
    category: '高级',
    graphTypes: ['data', 'query'],
    inputs: [
      { id: 'r', label: 'R', type: 'number' },
      { id: 'g', label: 'G', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'color', label: '颜色', type: 'color' }]
  },
  
  // 黑板节点
  blackboard_get: { 
    label: 'Get', 
    icon: Download, 
    color: '#0e639c', 
    category: '黑板',
    graphTypes: ['data', 'query'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'any' }]
  },
  blackboard_set: { 
    label: 'Set', 
    icon: Upload, 
    color: '#16825d', 
    category: '黑板',
    graphTypes: ['data', 'query'],
    inputs: [{ id: 'value', label: '值', type: 'any' }],
    outputs: []
  },
  
  // 查询专用节点
  entity_source: { 
    label: '实体源', 
    icon: Database, 
    color: '#0e639c', 
    category: '源',
    graphTypes: ['query'],
    inputs: [],
    outputs: [{ id: 'entities', label: '实体集', type: 'entities' }]
  },
  filter_prototype: { 
    label: '原型过滤', 
    icon: Filter, 
    color: '#70ad47', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_attribute: { 
    label: '属性过滤', 
    icon: Filter, 
    color: '#9b6bb3', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'threshold', label: '阈值', type: 'number' }
    ],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_tag: { 
    label: '标签过滤', 
    icon: Tag, 
    color: '#ffc000', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_relation: { 
    label: '关系过滤', 
    icon: Link, 
    color: '#e67e22', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_relation_attribute: { 
    label: '关系属性过滤', 
    icon: Network, 
    color: '#e67e22', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'threshold', label: '阈值', type: 'number' }
    ],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_relation_tag: { 
    label: '关系标签过滤', 
    icon: Network, 
    color: '#e67e22', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_related_entity_attribute: { 
    label: '关联实体属性过滤', 
    icon: Network, 
    color: '#9b6bb3', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'threshold', label: '阈值', type: 'number' }
    ],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_related_entity_tag: { 
    label: '关联实体标签过滤', 
    icon: Network, 
    color: '#ffc000', 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  spatial_distance: { 
    label: '距离查询', 
    icon: MapPin, 
    color: '#c97fff', 
    category: '空间',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'maxDistance', label: '最大距离', type: 'number' }
    ],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  spatial_area: { 
    label: '区域查询', 
    icon: Box, 
    color: '#c97fff', 
    category: '空间',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  logic_intersect: { 
    label: '交集', 
    icon: GitMerge, 
    color: '#d9534f', 
    category: '逻辑',
    graphTypes: ['query'],
    inputs: [
      { id: 'a', label: 'A', type: 'entities' },
      { id: 'b', label: 'B', type: 'entities' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'entities' }]
  },
  logic_union: { 
    label: '并集', 
    icon: GitMerge, 
    color: '#d9534f', 
    category: '逻辑',
    graphTypes: ['query'],
    inputs: [
      { id: 'a', label: 'A', type: 'entities' },
      { id: 'b', label: 'B', type: 'entities' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'entities' }]
  },
  logic_difference: { 
    label: '差集', 
    icon: GitMerge, 
    color: '#d9534f', 
    category: '逻辑',
    graphTypes: ['query'],
    inputs: [
      { id: 'a', label: 'A (被减)', type: 'entities' },
      { id: 'b', label: 'B (减去)', type: 'entities' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'entities' }]
  },
  sort_by_attribute: { 
    label: '按属性排序', 
    icon: ArrowUpDown, 
    color: '#5bc0de', 
    category: '排序',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'sorted', label: '排序结果', type: 'entities' }]
  },
  sort_by_relation: { 
    label: '按关系排序', 
    icon: ArrowUpDown, 
    color: '#5bc0de', 
    category: '排序',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'sorted', label: '排序结果', type: 'entities' }]
  },
  sort_by_tag: { 
    label: '按标签排序', 
    icon: ArrowUpDown, 
    color: '#5bc0de', 
    category: '排序',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'sorted', label: '排序结果', type: 'entities' }]
  },
  limit_top: { 
    label: '取前N名', 
    icon: Hash, 
    color: '#17a2b8', 
    category: '限制',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'count', label: '数量', type: 'number' }
    ],
    outputs: [{ id: 'limited', label: '限制结果', type: 'entities' }]
  },
  limit_bottom: { 
    label: '取后N名', 
    icon: Hash, 
    color: '#17a2b8', 
    category: '限制',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'count', label: '数量', type: 'number' }
    ],
    outputs: [{ id: 'limited', label: '限制结果', type: 'entities' }]
  },
  limit_percent_top: { 
    label: '取前N%', 
    icon: Percent, 
    color: '#17a2b8', 
    category: '限制',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'percent', label: '百分比', type: 'number' }
    ],
    outputs: [{ id: 'limited', label: '限制结果', type: 'entities' }]
  },
  limit_percent_bottom: { 
    label: '取后N%', 
    icon: Percent, 
    color: '#17a2b8', 
    category: '限制',
    graphTypes: ['query'],
    inputs: [
      { id: 'entities', label: '实体集', type: 'entities' },
      { id: 'percent', label: '百分比', type: 'number' }
    ],
    outputs: [{ id: 'limited', label: '限制结果', type: 'entities' }]
  },
  output: { 
    label: '输出', 
    icon: Database, 
    color: '#5cb85c', 
    category: '输出',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: []
  }
};

// 根据graphType获取可用节点
export function getAvailableNodes(graphType) {
  return Object.entries(NODE_TYPES)
    .filter(([_, config]) => config.graphTypes.includes(graphType))
    .map(([type, config]) => ({ type, ...config }));
}

// 根据graphType获取分类
export function getCategories(graphType) {
  const nodes = getAvailableNodes(graphType);
  return [...new Set(nodes.map(n => n.category))];
}

// 获取节点配置
export function getNodeConfig(nodeType) {
  return NODE_TYPES[nodeType];
}

// 获取节点颜色
export function getNodeColor(nodeType) {
  return NODE_TYPES[nodeType]?.color || '#6c757d';
}

// 获取节点标签
export function getNodeLabel(nodeType) {
  return NODE_TYPES[nodeType]?.label || nodeType;
}