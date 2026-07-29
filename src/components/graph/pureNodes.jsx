import { Type, ToggleLeft, Settings, Percent, Divide, ChevronsDown, ChevronsUp, CircleDot, Sigma, Move, Tag, Shield, CheckSquare, Shuffle } from 'lucide-react';

// 纯节点（无副作用）：可用于数据图 / 查询图 / 纯函数图
export const PURE_NODE_TYPES = {
  // ── 字面量与常量 ──
  string_value: {
    label: '字符串',
    icon: Type,
    category: '基础',
    graphTypes: ['data', 'query', 'function'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'string' }]
  },
  boolean_value: {
    label: '布尔值',
    icon: ToggleLeft,
    category: '基础',
    graphTypes: ['data', 'query', 'function'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'boolean' }]
  },
  constant_get: {
    label: '全局常量',
    icon: Settings,
    category: '基础',
    graphTypes: ['data', 'query', 'function'],
    inputs: [],
    outputs: [{ id: 'value', label: '值', type: 'any' }]
  },

  // ── 数学补充 ──
  modulo: {
    label: '取余',
    icon: Percent,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  absolute: {
    label: '绝对值',
    icon: Divide,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'value', label: '值', type: 'number' }],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  negate: {
    label: '取负',
    icon: Divide,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'value', label: '值', type: 'number' }],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  floor: {
    label: '向下取整',
    icon: ChevronsDown,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'value', label: '值', type: 'number' }],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  ceil: {
    label: '向上取整',
    icon: ChevronsUp,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'value', label: '值', type: 'number' }],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  round: {
    label: '四舍五入',
    icon: CircleDot,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'value', label: '值', type: 'number' }],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  sqrt: {
    label: '平方根',
    icon: Sigma,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [{ id: 'value', label: '值', type: 'number' }],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  lerp: {
    label: '线性插值',
    icon: Move,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'a', label: 'A', type: 'number' },
      { id: 'b', label: 'B', type: 'number' },
      { id: 't', label: '权重 T', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },
  remap: {
    label: '区间映射',
    icon: Move,
    category: '数学',
    graphTypes: ['data', 'query', 'function'],
    inputs: [
      { id: 'value', label: '值', type: 'number' },
      { id: 'in_min', label: '源最小', type: 'number' },
      { id: 'in_max', label: '源最大', type: 'number' },
      { id: 'out_min', label: '目标最小', type: 'number' },
      { id: 'out_max', label: '目标最大', type: 'number' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'number' }]
  },

  // ── 实体读取补充（纯函数图） ──
  get_tag_count: {
    label: '标签计数',
    icon: Tag,
    category: '函数-标签',
    graphTypes: ['function'],
    inputs: [
      { id: 'entity', label: '实体', type: 'entity' },
      { id: 'tag_path', label: '标签路径', type: 'string' }
    ],
    outputs: [{ id: 'count', label: '计数', type: 'number' }]
  },
  get_entity_position: {
    label: '实体坐标',
    icon: Move,
    category: '函数-实体',
    graphTypes: ['function'],
    inputs: [{ id: 'entity', label: '实体', type: 'entity' }],
    outputs: [{ id: 'position', label: '坐标', type: 'vector3' }]
  },
  is_prototype: {
    label: '属于原型',
    icon: CheckSquare,
    category: '函数-实体',
    graphTypes: ['function'],
    inputs: [{ id: 'entity', label: '实体', type: 'entity' }],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  distance_between: {
    label: '实体间距离',
    icon: Move,
    category: '函数-实体',
    graphTypes: ['function'],
    inputs: [
      { id: 'a', label: '实体 A', type: 'entity' },
      { id: 'b', label: '实体 B', type: 'entity' }
    ],
    outputs: [{ id: 'distance', label: '距离', type: 'number' }]
  },

  // ── 逻辑调用 ──
  call_validator: {
    label: '调用验证器',
    icon: Shield,
    category: '函数-逻辑',
    graphTypes: ['function'],
    inputs: [
      { id: 'source', label: '源实体', type: 'entity' },
      { id: 'target', label: '目标实体', type: 'entity' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  call_requirement: {
    label: '调用需求',
    icon: CheckSquare,
    category: '函数-逻辑',
    graphTypes: ['function'],
    inputs: [
      { id: 'source', label: '源实体', type: 'entity' },
      { id: 'target', label: '目标实体', type: 'entity' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'boolean' }]
  },
  call_data_graph: {
    label: '调用数据图',
    icon: Sigma,
    category: '函数-逻辑',
    graphTypes: ['data', 'function'],
    inputs: [],
    outputs: [{ id: 'result', label: '结果', type: 'any' }]
  },
  select_value: {
    label: '二选一',
    icon: Shuffle,
    category: '函数-逻辑',
    graphTypes: ['data', 'function'],
    inputs: [
      { id: 'condition', label: '条件', type: 'boolean' },
      { id: 'if_true', label: '真时', type: 'any' },
      { id: 'if_false', label: '假时', type: 'any' }
    ],
    outputs: [{ id: 'result', label: '结果', type: 'any' }]
  }
};