import { Radio, Play, Download, Upload, ListTree, GitBranch, ScrollText, PanelsTopLeft, XCircle, Crosshair, Network, Terminal, Boxes } from 'lucide-react';
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
  level_create_control_plane: {
    label: '创建 ControlPlane', icon: Network, category: '关卡 UI · ControlPlane', graphTypes: ['level'],
    configFields: [
      { key: 'profileId', type: 'select', optionsSource: 'controlPlanes', placeholder: '选择 ControlPlane Profile' },
      { key: 'instanceKey', type: 'text', defaultValue: 'control-plane' },
    ],
    defaultData: { profileId: '', instanceKey: 'control-plane' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'context', label: '控制上下文', type: 'any' }],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_create_command_panel: {
    label: '创建 Command Panel', icon: PanelsTopLeft, category: '关卡 UI · Panel', graphTypes: ['level'],
    configFields: [
      { key: 'profileId', type: 'select', optionsSource: 'commandPanels', placeholder: '选择 Command Panel Profile' },
      { key: 'instanceKey', type: 'text', defaultValue: 'command-panel' },
      { key: 'anchorHorizontal', type: 'select', options: [{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }] },
      { key: 'anchorVertical', type: 'select', options: [{ value: 'top', label: '上' }, { value: 'center', label: '中' }, { value: 'bottom', label: '下' }] },
      { key: 'offsetX', type: 'number', defaultValue: 12 }, { key: 'offsetY', type: 'number', defaultValue: 12 },
    ],
    defaultData: { profileId: '', instanceKey: 'command-panel', anchorHorizontal: 'right', anchorVertical: 'bottom', offsetX: 12, offsetY: 12 },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }], outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_create_entity_panel: {
    label: '创建 Entity Panel', icon: PanelsTopLeft, category: '关卡 UI · Panel', graphTypes: ['level'],
    configFields: [
      { key: 'profileId', type: 'select', optionsSource: 'entityPanels', placeholder: '选择 Entity Panel Profile' },
      { key: 'instanceKey', type: 'text', defaultValue: 'entity-panel' },
      { key: 'anchorHorizontal', type: 'select', options: [{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }] },
      { key: 'anchorVertical', type: 'select', options: [{ value: 'top', label: '上' }, { value: 'center', label: '中' }, { value: 'bottom', label: '下' }] },
      { key: 'offsetX', type: 'number', defaultValue: 12 }, { key: 'offsetY', type: 'number', defaultValue: 12 },
    ],
    defaultData: { profileId: '', instanceKey: 'entity-panel', anchorHorizontal: 'right', anchorVertical: 'bottom', offsetX: 12, offsetY: 12 },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }], outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_mount_ui_screen: {
    label: '挂载 UI Screen', icon: PanelsTopLeft, category: '关卡 UI · Panel', graphTypes: ['level'],
    configFields: [
      { key: 'screenProfileId', type: 'select', optionsSource: 'uiScreens', placeholder: '选择 UI Screen Profile' },
      { key: 'routeProfileId', type: 'select', optionsSource: 'uiSelectionRoutes', placeholder: '选择选中路由 Profile' },
      { key: 'instanceKey', type: 'text', defaultValue: 'ui-screen' },
    ],
    defaultData: { screenProfileId: '', routeProfileId: '', instanceKey: 'ui-screen' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }], outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_create_runtime_console: {
    label: '创建 Runtime Console', icon: Terminal, category: '关卡 UI · 工具', graphTypes: ['level'],
    configFields: [
      { key: 'instanceKey', type: 'text', defaultValue: 'runtime-console' },
      { key: 'anchorHorizontal', type: 'select', options: [{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }] },
      { key: 'anchorVertical', type: 'select', options: [{ value: 'top', label: '上' }, { value: 'center', label: '中' }, { value: 'bottom', label: '下' }] },
      { key: 'offsetX', type: 'number', defaultValue: 0 }, { key: 'offsetY', type: 'number', defaultValue: 16 },
    ],
    defaultData: { instanceKey: 'runtime-console', anchorHorizontal: 'center', anchorVertical: 'top', offsetX: 0, offsetY: 16 },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }], outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_create_entity_palette: {
    label: '创建实体放置 Palette', icon: Boxes, category: '关卡 UI · 工具', graphTypes: ['level'],
    configFields: [
      { key: 'instanceKey', type: 'text', defaultValue: 'entity-palette' },
      { key: 'anchorHorizontal', type: 'select', options: [{ value: 'left', label: '左' }, { value: 'center', label: '中' }, { value: 'right', label: '右' }] },
      { key: 'anchorVertical', type: 'select', options: [{ value: 'top', label: '上' }, { value: 'center', label: '中' }, { value: 'bottom', label: '下' }] },
      { key: 'offsetX', type: 'number', defaultValue: 16 }, { key: 'offsetY', type: 'number', defaultValue: 0 },
    ],
    defaultData: { instanceKey: 'entity-palette', anchorHorizontal: 'left', anchorVertical: 'center', offsetX: 16, offsetY: 0 },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }], outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_close_runtime_profile: {
    label: '关闭运行时 Profile', icon: XCircle, category: '关卡 UI · Panel', graphTypes: ['level'],
    configFields: [{ key: 'instanceKey', type: 'text', defaultValue: '' }], defaultData: { instanceKey: '' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }], outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
  },
  level_set_collection_context: {
    label: '更新集合上下文', icon: Crosshair, category: '关卡 UI · Context', graphTypes: ['level'],
    configFields: [{ key: 'collectionKey', type: 'select', optionsSource: 'entityCollections', placeholder: '选择 EntityCollection' }],
    defaultData: { collectionKey: '' }, inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'entities', label: '实体集合', type: 'any' }],
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