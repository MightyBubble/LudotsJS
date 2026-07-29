import { Play, Plus, Minus, Tag, Link, Zap, GitBranch, Repeat, Database, Sigma } from 'lucide-react';

// 动作图专用节点：带执行流（exec）引脚，允许产生副作用
export const ACTION_NODE_TYPES = {
  action_entry: {
    label: '动作入口',
    icon: Play,
    category: '动作-流程',
    graphTypes: ['action'],
    inputs: [],
    outputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'source', label: '施法者', type: 'entity' },
      { id: 'target', label: '目标', type: 'entity' }
    ]
  },
  action_branch: {
    label: '分支',
    icon: GitBranch,
    category: '动作-流程',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'condition', label: '条件', type: 'boolean' }
    ],
    outputs: [
      { id: 'exec_true', label: '真', type: 'exec' },
      { id: 'exec_false', label: '假', type: 'exec' }
    ]
  },
  action_sequence: {
    label: '顺序执行',
    icon: Sigma,
    category: '动作-流程',
    graphTypes: ['action'],
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }],
    outputs: [
      { id: 'exec_0', label: '然后 1', type: 'exec' },
      { id: 'exec_1', label: '然后 2', type: 'exec' },
      { id: 'exec_2', label: '然后 3', type: 'exec' }
    ]
  },
  action_for_each: {
    label: '遍历实体集',
    icon: Repeat,
    category: '动作-流程',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'entities', label: '实体集', type: 'entities' }
    ],
    outputs: [
      { id: 'exec_body', label: '循环体', type: 'exec' },
      { id: 'item', label: '当前实体', type: 'entity' },
      { id: 'exec_done', label: '完成', type: 'exec' }
    ]
  },

  modify_attribute: {
    label: '修改属性',
    icon: Plus,
    category: '动作-副作用',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'entity', label: '实体', type: 'entity' },
      { id: 'value', label: '数值', type: 'number' }
    ],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  },
  add_tag: {
    label: '添加标签',
    icon: Tag,
    category: '动作-副作用',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'entity', label: '实体', type: 'entity' }
    ],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  },
  remove_tag: {
    label: '移除标签',
    icon: Minus,
    category: '动作-副作用',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'entity', label: '实体', type: 'entity' }
    ],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  },
  create_relation: {
    label: '建立关系',
    icon: Link,
    category: '动作-副作用',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'source', label: '源实体', type: 'entity' },
      { id: 'target', label: '目标实体', type: 'entity' }
    ],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  },
  remove_relation: {
    label: '解除关系',
    icon: Link,
    category: '动作-副作用',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'source', label: '源实体', type: 'entity' },
      { id: 'target', label: '目标实体', type: 'entity' }
    ],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  },
  fire_event: {
    label: '触发事件',
    icon: Zap,
    category: '动作-副作用',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'entity', label: '实体', type: 'entity' }
    ],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  },

  call_pure_function: {
    label: '调用纯函数图',
    icon: Sigma,
    category: '动作-调用',
    graphTypes: ['action'],
    inputs: [],
    outputs: [{ id: 'result', label: '返回值', type: 'any' }]
  },
  run_entity_query: {
    label: '运行实体查询',
    icon: Database,
    category: '动作-调用',
    graphTypes: ['action'],
    inputs: [],
    outputs: [{ id: 'entities', label: '实体集', type: 'entities' }]
  },
  call_action_graph: {
    label: '调用动作图',
    icon: Play,
    category: '动作-调用',
    graphTypes: ['action'],
    inputs: [
      { id: 'exec', label: '执行', type: 'exec' },
      { id: 'source', label: '施法者', type: 'entity' },
      { id: 'target', label: '目标', type: 'entity' }
    ],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  }
};