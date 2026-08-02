import { Radio, Play, Download, Upload, ListTree, GitBranch, ScrollText } from 'lucide-react';
import { LEVEL_LIFECYCLE_EVENTS, levelBuiltinEventNodeType } from '@/lib/levelBlueprint/levelLifecycle';

const eventOutputs = [
  { id: 'exec', label: '触发', type: 'exec' },
  { id: 'payload', label: '事件数据', type: 'object' },
];

const builtinEventNodes = Object.fromEntries(LEVEL_LIFECYCLE_EVENTS.map(event => [
  levelBuiltinEventNodeType(event.value),
  {
    label: event.label,
    icon: Radio,
    category: '关卡事件 · Builtin',
    graphTypes: ['level'],
    defaultData: { eventId: event.value },
    inputs: [],
    outputs: eventOutputs,
  },
]));

export const LEVEL_BLUEPRINT_NODE_TYPES = {
  ...builtinEventNodes,
  level_custom_event_listener: {
    label: '监听自定义事件', icon: Radio, category: '关卡事件 · 自定义', graphTypes: ['level'],
    configFields: [{ key: 'eventId', type: 'select', optionsSource: 'gameEvents', placeholder: '选择 GameEvent' }],
    defaultData: { eventId: '' }, inputs: [], outputs: eventOutputs,
  },
  level_event_listener: {
    label: '旧版关卡事件', icon: Radio, category: '关卡事件 · 旧版', graphTypes: ['level'], hidden: true,
    configFields: [{ key: 'eventId', type: 'select', options: LEVEL_LIFECYCLE_EVENTS }],
    defaultData: { eventId: 'Level.Started' }, inputs: [], outputs: eventOutputs,
  },
  level_sequence: {
    label: '顺序执行', icon: ListTree, category: '关卡控制流', graphTypes: ['level'],
    defaultData: {}, inputs: [{ id: 'exec', label: '执行', type: 'exec' }],
    outputs: [
      { id: 'then_0', label: '步骤 1', type: 'exec' },
      { id: 'then_1', label: '步骤 2', type: 'exec' },
      { id: 'then_2', label: '步骤 3', type: 'exec' },
    ],
  },
  level_branch: {
    label: '条件分支', icon: GitBranch, category: '关卡控制流', graphTypes: ['level'],
    defaultData: { condition: true },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'condition', label: '条件', type: 'boolean' }],
    outputs: [{ id: 'true', label: 'True', type: 'exec' }, { id: 'false', label: 'False', type: 'exec' }],
  },
  level_log: {
    label: '记录日志', icon: ScrollText, category: '关卡调试', graphTypes: ['level'],
    configFields: [{ key: 'message', type: 'text', defaultValue: '' }],
    defaultData: { message: '' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'payload', label: '数据', type: 'any' }],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_execute_action: {
    label: '执行 ActionGraph', icon: Play, category: '关卡动作', graphTypes: ['level'],
    configFields: [{ key: 'actionId', type: 'select', optionsSource: 'actionGraphs', placeholder: '选择 ActionGraph' }],
    defaultData: { actionId: '' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'payload', label: '参数', type: 'object' }],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_variable_read: {
    label: '读取关卡变量', icon: Download, category: '关卡变量', graphTypes: ['level'],
    configFields: [{ key: 'variableKey', type: 'select', optionsSource: 'levelVariables', placeholder: '选择关卡变量' }],
    defaultData: { variableKey: '' }, inputs: [], outputs: [{ id: 'value', label: '值', type: 'any' }],
  },
  level_variable_write: {
    label: '写入关卡变量', icon: Upload, category: '关卡变量', graphTypes: ['level'],
    configFields: [{ key: 'variableKey', type: 'select', optionsSource: 'levelVariables', placeholder: '选择关卡变量' }],
    defaultData: { variableKey: '' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'value', label: '值', type: 'any' }],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
};