import { Radio, Play, Download, Upload } from 'lucide-react';
import { LEVEL_LIFECYCLE_EVENTS } from '@/lib/levelBlueprint/levelLifecycle';

export const LEVEL_BLUEPRINT_NODE_TYPES = {
  level_event_listener: {
    label: '监听关卡事件', icon: Radio, category: '关卡-事件', graphTypes: ['level'],
    configFields: [{ key: 'eventId', type: 'select', defaultValue: 'Level.Started', options: LEVEL_LIFECYCLE_EVENTS }],
    defaultData: { eventId: 'Level.Started' }, inputs: [],
    outputs: [{ id: 'exec', label: '触发', type: 'exec' }, { id: 'payload', label: '事件数据', type: 'object' }]
  },
  level_execute_action: {
    label: '执行 ActionGraph', icon: Play, category: '关卡-动作', graphTypes: ['level'],
    configFields: [{ key: 'actionId', type: 'text', defaultValue: '' }],
    defaultData: { actionId: '' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'payload', label: '参数', type: 'object' }],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  },
  level_variable_read: {
    label: '读取关卡变量', icon: Download, category: '关卡-变量', graphTypes: ['level'],
    configFields: [{ key: 'variableKey', type: 'text', defaultValue: '' }],
    defaultData: { variableKey: '' }, inputs: [], outputs: [{ id: 'value', label: '值', type: 'any' }]
  },
  level_variable_write: {
    label: '写入关卡变量', icon: Upload, category: '关卡-变量', graphTypes: ['level'],
    configFields: [{ key: 'variableKey', type: 'text', defaultValue: '' }],
    defaultData: { variableKey: '' },
    inputs: [{ id: 'exec', label: '执行', type: 'exec' }, { id: 'value', label: '值', type: 'any' }],
    outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }]
  }
};