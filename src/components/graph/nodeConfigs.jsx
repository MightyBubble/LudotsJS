import { Database, Filter, Tag, Link, MapPin, Box, GitMerge, ArrowUpDown, Hash, Percent, Network, Plus, Minus, Divide, Sigma, TrendingUp, Move, Palette, Download, Upload, X, Eye, CircleDot, CheckCircle, XCircle, Equal, ChevronRight, ChevronLeft, Layers, GitBranch, Repeat, Table } from 'lucide-react';

import { ACTION_NODE_TYPES } from './actionNodes';

// 类型颜色映射
export const TYPE_COLORS = {
  exec: '#e5e5e5',
  number: '#5b9bd5',
  boolean: '#d9534f',
  string: '#e91e63',
  array: '#e67e22',
  object: '#9b6bb3',
  vector2: '#70ad47',
  vector3: '#70ad47',
  vector4: '#70ad47',
  color: '#ffc000',
  quaternion: '#c97fff',
  entity: '#17a2b8',
  entities: '#5bc0de',
  relation: '#e67e22',
  attribute: '#9b6bb3',
  tag: '#ffc000',
  entityPrototype: '#17a2b8',
  entitySet: '#5bc0de',
  any: '#6c757d'
};

// 类型形状映射
export const TYPE_SHAPES = {
  exec: 'triangle',
  number: 'circle',
  boolean: 'circle',
  string: 'circle',
  array: 'square',
  object: 'square',
  vector2: 'diamond',
  vector3: 'diamond',
  vector4: 'diamond',
  color: 'triangle',
  quaternion: 'triangle',
  entity: 'square',
  entities: 'square',
  relation: 'square',
  attribute: 'square',
  tag: 'square',
  entityPrototype: 'square',
  entitySet: 'square',
  any: 'circle'
};

// 节点类型定义
export const NODE_TYPES = {
  // 数学节点 - 所有graph类型都可用
  number: { 
    label: '数值', 
    icon: Hash, 
    category: '基础',
    graphTypes: ['data', 'query', 'function'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'number' }]
  },
  add: { 
    label: '加法', 
    icon: Plus, 
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  subtract: { 
    label: '减法', 
    icon: Minus, 
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  multiply: { 
    label: '乘法', 
    icon: X, 
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  divide: { 
    label: '除法', 
    icon: Divide, 
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  power: { 
    label: '幂运算', 
    icon: TrendingUp, 
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'base', label: '底数', type: 'number' },
      { id: 'exponent', label: '指数', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  sum: { 
    label: '求和', 
    icon: Sigma, 
    category: '聚合',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '总和', type: 'number' }]
  },
  product: { 
    label: '求积', 
    icon: Sigma, 
    category: '聚合',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '乘积', type: 'number' }]
  },
  max: { 
    label: '最大值', 
    icon: TrendingUp, 
    category: '聚合',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '最大值', type: 'number' }]
  },
  min: { 
    label: '最小值', 
    icon: TrendingUp, 
    category: '聚合',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'array', label: '数组', type: 'array' }],
    outputs: [{ id: 'result', label: '最小值', type: 'number' }]
  },
  clamp: { 
    label: '钳制', 
    icon: TrendingUp, 
    category: '聚合',
    graphTypes: ['data', 'query', 'function'],
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
    category: '向量',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'x', label: 'X', type: 'number' },
      { id: 'y', label: 'Y', type: 'number' }
    ],
    outputs: [{ id: 'vector', label: '向量', type: 'vector2' }]
  },
  vector3: { 
    label: '三维向量', 
    icon: Move, 
    category: '向量',
    graphTypes: ['data', 'query', 'function'],
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
    category: '向量',
    graphTypes: ['data', 'query', 'function'],
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
    category: '高级',
    graphTypes: ['data', 'query', 'function'],
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
    category: '高级',
    graphTypes: ['data', 'query', 'function'],
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
    category: '黑板',
    graphTypes: ['data', 'query', 'function'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'any' }]
  },
  blackboard_set: { 
    label: 'Set', 
    icon: Upload, 
    category: '黑板',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'value', label: '值', type: 'any' }],
    outputs: []
  },
  
  // 查询专用节点
  entity_source: { 
    label: '实体源', 
    icon: Database, 
    category: '源',
    graphTypes: ['query'],
    inputs: [],
    outputs: [{ id: 'entities', label: '实体集', type: 'entities' }]
  },
  filter_prototype: { 
    label: '原型过滤', 
    icon: Filter, 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_attribute: { 
    label: '属性过滤', 
    icon: Filter, 
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
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_relation: { 
    label: '关系过滤', 
    icon: Link, 
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_relation_attribute: { 
    label: '关系属性过滤', 
    icon: Network, 
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
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  filter_related_entity_attribute: { 
    label: '关联实体属性过滤', 
    icon: Network, 
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
    category: '过滤',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  spatial_distance: { 
    label: '距离查询', 
    icon: MapPin, 
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
    category: '空间',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'filtered', label: '过滤结果', type: 'entities' }]
  },
  logic_intersect: { 
    label: '交集', 
    icon: GitMerge, 
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
    category: '排序',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'sorted', label: '排序结果', type: 'entities' }]
  },
  sort_by_relation: { 
    label: '按关系排序', 
    icon: ArrowUpDown, 
    category: '排序',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'sorted', label: '排序结果', type: 'entities' }]
  },
  sort_by_tag: { 
    label: '按标签排序', 
    icon: ArrowUpDown, 
    category: '排序',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: [{ id: 'sorted', label: '排序结果', type: 'entities' }]
  },
  limit_top: { 
    label: '取前N名', 
    icon: Hash, 
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
    category: '输出',
    graphTypes: ['query'],
    inputs: [{ id: 'entities', label: '实体集', type: 'entities' }],
    outputs: []
  },
  
  // 数据表节点
  data_table_read: {
    label: '读取数据表',
    icon: Table,
    category: '数据表',
    graphTypes: ['data', 'query', 'function'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'any' }],
    dynamicPorts: true
  },
  
  // 函数图专用节点 - 获取类
  get_entity_attribute: {
    label: '获取实体属性',
    icon: Eye,
    category: '函数-获取',
    graphTypes: ['function'],
    inputs: [{ id: 'entity', label: '实体', type: 'entity' }],
    outputs: [{ id: 'value', label: '属性值', type: 'any' }]
  },
  get_entity_tags: {
    label: '获取实体标签',
    icon: Tag,
    category: '函数-获取',
    graphTypes: ['function'],
    inputs: [{ id: 'entity', label: '实体', type: 'entity' }],
    outputs: [{ id: 'tags', label: '标签列表', type: 'array' }]
  },
  get_entity_relations: {
    label: '获取实体关系',
    icon: Link,
    category: '函数-获取',
    graphTypes: ['function'],
    inputs: [{ id: 'entity', label: '实体', type: 'entity' }],
    outputs: [{ id: 'relations', label: '关系列表', type: 'array' }]
  },
  get_relation_attribute: {
    label: '获取关系属性',
    icon: Network,
    category: '函数-获取',
    graphTypes: ['function'],
    inputs: [{ id: 'relation', label: '关系', type: 'relation' }],
    outputs: [{ id: 'value', label: '属性值', type: 'any' }]
  },
  get_relation_tags: {
    label: '获取关系标签',
    icon: Network,
    category: '函数-获取',
    graphTypes: ['function'],
    inputs: [{ id: 'relation', label: '关系', type: 'relation' }],
    outputs: [{ id: 'tags', label: '标签列表', type: 'array' }]
  },
  get_related_entities: {
    label: '获取关联实体',
    icon: Database,
    category: '函数-获取',
    graphTypes: ['function'],
    inputs: [
      { id: 'entity', label: '实体', type: 'entity' },
      { id: 'relation', label: '关系', type: 'relation' }
    ],
    outputs: [{ id: 'entities', label: '实体列表', type: 'entities' }]
  },
  
  // 函数图专用节点 - 比较类
  compare_equal: {
    label: '等于',
    icon: Equal,
    category: '函数-比较',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'any' },
      { id: 'b', label: 'B', type: 'any' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  compare_not_equal: {
    label: '不等于',
    icon: X,
    category: '函数-比较',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'any' },
      { id: 'b', label: 'B', type: 'any' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  compare_greater: {
    label: '大于',
    icon: ChevronRight,
    category: '函数-比较',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  compare_less: {
    label: '小于',
    icon: ChevronLeft,
    category: '函数-比较',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  compare_greater_equal: {
    label: '大于等于',
    icon: ChevronRight,
    category: '函数-比较',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  compare_less_equal: {
    label: '小于等于',
    icon: ChevronLeft,
    category: '函数-比较',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  
  // 函数图专用节点 - 集合类
  set_contains: {
    label: '包含',
    icon: CircleDot,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [
      { id: 'set', label: '集合', type: 'array' },
      { id: 'item', label: '元素', type: 'any' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  set_not_contains: {
    label: '不包含',
    icon: XCircle,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [
      { id: 'set', label: '集合', type: 'array' },
      { id: 'item', label: '元素', type: 'any' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  set_intersect: {
    label: '交集',
    icon: GitMerge,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'array' },
      { id: 'b', label: 'B', type: 'array' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'array' }]
  },
  set_union: {
    label: '并集',
    icon: GitMerge,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'array' },
      { id: 'b', label: 'B', type: 'array' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'array' }]
  },
  set_difference: {
    label: '差集',
    icon: GitMerge,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A (被减)', type: 'array' },
      { id: 'b', label: 'B (减去)', type: 'array' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'array' }]
  },
  set_is_subset: {
    label: '子集判断',
    icon: Layers,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [
      { id: 'subset', label: '子集', type: 'array' },
      { id: 'superset', label: '父集', type: 'array' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  set_size: {
    label: '集合大小',
    icon: Hash,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [{ id: 'set', label: '集合', type: 'array' }],
    outputs: [{ id: 'result', label: '大小', type: 'number' }]
  },
  set_is_empty: {
    label: '判空',
    icon: XCircle,
    category: '函数-集合',
    graphTypes: ['function'],
    inputs: [{ id: 'set', label: '集合', type: 'array' }],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  
  // 函数图专用节点 - 逻辑类
  logic_and: {
    label: '与',
    icon: CheckCircle,
    category: '函数-逻辑',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'boolean' },
      { id: 'b', label: 'B', type: 'boolean' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  logic_or: {
    label: '或',
    icon: CheckCircle,
    category: '函数-逻辑',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: 'A', type: 'boolean' },
      { id: 'b', label: 'B', type: 'boolean' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  logic_not: {
    label: '非',
    icon: XCircle,
    category: '函数-逻辑',
    graphTypes: ['function'],
    inputs: [{ id: 'value', label: '值', type: 'boolean' }],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  
  // 函数图专用节点 - 条件类
  if_else: {
    label: '条件分支',
    icon: GitBranch, 
    category: '函数-条件',
    graphTypes: ['function'],
    inputs: [
      { id: 'condition', label: '条件', type: 'boolean' },
      { id: 'true_value', label: '真值', type: 'any' },
      { id: 'false_value', label: '假值', type: 'any' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'any' }]
  },
  
  // 函数图专用节点 - 标签判断
  has_tag: {
    label: '拥有标签',
    icon: Tag,
    category: '函数-标签',
    graphTypes: ['function'],
    inputs: [
      { id: 'tags', label: '标签列表', type: 'array' },
      { id: 'tag_path', label: '标签路径', type: 'string' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  has_any_tags: {
    label: '拥有任意标签',
    icon: Tag,
    category: '函数-标签',
    graphTypes: ['function'],
    inputs: [
      { id: 'tags', label: '标签列表', type: 'array' },
      { id: 'tag_paths', label: '标签路径列表', type: 'array' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  has_all_tags: {
    label: '拥有所有标签',
    icon: Tag,
    category: '函数-标签',
    graphTypes: ['function'],
    inputs: [
      { id: 'tags', label: '标签列表', type: 'array' },
      { id: 'tag_paths', label: '标签路径列表', type: 'array' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  
  // 结构图专用节点
  structure_node: {
    label: '结构节点',
    icon: Network,
    category: '结构',
    graphTypes: ['structure'],
    inputs: [{ id: 'in', label: '入', type: 'relation' }],
    outputs: [{ id: 'out', label: '出', type: 'relation' }]
  },

  ...ACTION_NODE_TYPES
};

// 根据graphType获取可用节点（graphType: data / query / function / action）
// 动作图额外可用所有纯函数图节点（纯求值，无副作用）
export function getAvailableNodes(graphType) {
  return Object.entries(NODE_TYPES)
    .filter(([_, config]) =>
      config.graphTypes.includes(graphType) ||
      (graphType === 'action' && config.graphTypes.includes('function'))
    )
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

// 获取节点标签
export function getNodeLabel(nodeType) {
  return NODE_TYPES[nodeType]?.label || nodeType;
}

// 获取类型颜色
export function getTypeColor(type) {
  return TYPE_COLORS[type] || TYPE_COLORS.any;
}

// 获取类型形状
export function getTypeShape(type) {
  return TYPE_SHAPES[type] || TYPE_SHAPES.any;
}