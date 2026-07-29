import { Activity, Crosshair, HeartPulse, MapPin, PackagePlus, Radar, RefreshCw, Rocket, Send, Sparkles, Swords, Users, Eye, EyeOff } from 'lucide-react';

const ports = {
  inputs: [{ id: 'exec', label: '执行', type: 'exec' }],
  outputs: [{ id: 'exec_out', label: '完成', type: 'exec' }],
};

const effectNode = (label, icon, outputs = []) => ({
  label,
  icon,
  category: '效果-Preset',
  graphTypes: ['action'],
  inputs: ports.inputs,
  outputs: [...ports.outputs, ...outputs],
});

export const EFFECT_ACTION_NODE_TYPES = {
  effect_apply_force: effectNode('施加二维力', Activity),
  effect_apply_modifiers: effectNode('应用 Modifier', HeartPulse),
  effect_spatial_query: effectNode('空间目标查询', Radar, [{ id: 'targets', label: '目标集', type: 'entities' }]),
  effect_dispatch_payload: effectNode('分发 Payload Effect', Send),
  effect_reresolve_dispatch: effectNode('重新查询并分发', RefreshCw, [{ id: 'targets', label: '目标集', type: 'entities' }]),
  effect_create_projectile: effectNode('创建投射物', Rocket, [{ id: 'projectile', label: '投射物', type: 'entity' }]),
  effect_create_unit: effectNode('创建单位', PackagePlus, [{ id: 'unit', label: '新单位', type: 'entity' }]),
  effect_apply_displacement: effectNode('执行位移', Crosshair),
  effect_apply_relation: effectNode('执行关系操作', Users),
  effect_execute_exchange: effectNode('执行交换', Swords),
  effect_complete_progression: effectNode('完成成长进度', Sparkles),
  effect_submit_order: effectNode('提交 Blackboard Order', Send),
  effect_deploy_consume_source: effectNode('部署并消耗 Source', PackagePlus, [{ id: 'deployed', label: '部署实体', type: 'entity' }]),
  effect_reveal_area: effectNode('揭示区域', Eye),
  effect_decay_reveal_area: effectNode('衰减揭示区域', EyeOff),
};