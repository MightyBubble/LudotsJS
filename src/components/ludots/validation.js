import { EFFECT_PRESET_TYPES } from './effectPresetTypes';
import { EFFECT_PHASES, EFFECT_PRESETS } from './effectPresetDefinitions';

const issue = (severity, field_path, message, fix) => ({ severity, field_path, message, fix });

/** Effect 校验：严格对应 C# EffectTemplateConfig / EffectTemplateLoader。 */
export function validateEffect(effect, refs = {}) {
  const out = [];
  const attrIds = new Set((refs.attributes || []).map(a => a.attribute_id));
  const effectIds = new Set((refs.effects || []).map(e => e.effect_id));
  const graphIds = new Set((refs.actionGraphs || []).map(g => g.action_id));
  const preset = EFFECT_PRESETS[effect.presetType] || EFFECT_PRESETS.None;
  if (!effect.effect_id) out.push(issue('error', 'effect_id', '缺少 C# id', '填写唯一 ID'));
  if (!EFFECT_PRESET_TYPES.includes(effect.presetType)) out.push(issue('error', 'presetType', '不是 C# EffectPresetType', '选择有效枚举'));
  if (!preset.allowedLifetimes.includes(effect.lifetime)) out.push(issue('error', 'lifetime', '不符合 preset_types.json 的 allowedLifetimes', `选择 ${preset.allowedLifetimes.join(' / ')}`));
  (preset.fields || []).forEach(field => { if (field === 'modifiers' ? !(effect.modifiers || []).length : effect[field] == null) out.push(issue('error', field, `${effect.presetType} 需要 ${field}`, '配置 Preset 必需字段')); });
  if (effect.participatesInResponse === undefined) out.push(issue('error', 'participatesInResponse', '必须明确是否参与响应', '设置 true 或 false'));
  if ((effect.tags || []).length > 1) out.push(issue('error', 'tags', 'C# Loader 最多允许一个顶层 tag', '只保留一个 tag'));
  if (effect.lifetime === 'After' && (!Number.isInteger(effect.duration?.durationTicks) || effect.duration.durationTicks < 1)) out.push(issue('error', 'duration.durationTicks', 'After 需要正整数 durationTicks', '填写 tick 数'));
  if (effect.expireCondition && (!effect.expireCondition.kind || !effect.expireCondition.tag || !effect.expireCondition.sense)) out.push(issue('error', 'expireCondition', '到期条件不完整', '补全 kind、tag、sense'));
  if (effect.stack && (!Number.isInteger(effect.stack.limit) || effect.stack.limit < 1)) out.push(issue('error', 'stack.limit', '叠加上限必须为正整数', '填写 limit'));
  (effect.modifiers || []).forEach((m, i) => {
    if (!attrIds.has(m.attribute)) out.push(issue('error', `modifiers[${i}].attribute`, '属性引用无效', '选择现有 Attribute'));
    if (!['Add', 'Multiply', 'Override'].includes(m.op)) out.push(issue('error', `modifiers[${i}].op`, '修改操作无效', '选择 C# 支持的操作'));
  });
  ['impactEffect', 'hitEffect', 'presentationEffect'].forEach(key => { const id = effect.projectile?.[key]; if (id && !effectIds.has(id)) out.push(issue('error', `projectile.${key}`, 'Effect 引用无效', '选择现有 Effect')); });
  if (effect.targetDispatch?.payloadEffect && !effectIds.has(effect.targetDispatch.payloadEffect)) out.push(issue('error', 'targetDispatch.payloadEffect', 'Effect 引用无效', '选择现有 Effect'));
  Object.entries(effect.phaseGraphs || {}).forEach(([phase, config]) => {
    if (!EFFECT_PHASES.includes(phase)) out.push(issue('error', `phaseGraphs.${phase}`, '不是 C# EffectPhaseId', '使用固定八阶段'));
    ['pre', 'post'].forEach(slot => { if (config?.[slot] && !graphIds.has(config[slot])) out.push(issue('error', `phaseGraphs.${phase}.${slot}`, 'ActionGraph 引用无效', '选择现有 ActionGraph')); });
  });
  if (effect.lifetime === 'Instant' && (effect.phaseListeners || []).length) out.push(issue('error', 'phaseListeners', 'C# Loader 禁止 Instant Effect 持有 Phase Listener', '改为 After / Infinite 或删除监听器'));
  (effect.phaseListeners || []).forEach((listener, i) => {
    if (!['Source', 'Target'].includes(listener.scope)) out.push(issue('error', `phaseListeners[${i}].scope`, '监听视角无效', '选择 Source / Target'));
    if (!['Graph', 'Event', 'Both'].includes(listener.action)) out.push(issue('error', `phaseListeners[${i}].action`, '监听动作无效', '选择 Graph / Event / Both'));
    if (['Graph', 'Both'].includes(listener.action) && (!listener.graphProgram || !graphIds.has(listener.graphProgram))) out.push(issue('error', `phaseListeners[${i}].graphProgram`, '需要有效 ActionGraph', '选择图程序'));
  });
  (effect.grantedTags || []).forEach((g, i) => { if (!g.tag || !g.formula) out.push(issue('error', `grantedTags[${i}]`, '授予标签需要 tag 与 formula', '补全字段')); });
  const cp = effect.configParams || {};
  if (effect.presetType === 'ApplyForce2D' && (!cp['_ep.forceXTargetAttrId'] || !cp['_ep.forceYTargetAttrId'])) out.push(issue('error', 'configParams', 'ApplyForce2D 缺少两个目标 Attribute 参数', '配置 ForceParams'));
  if (effect.presetType === 'Exchange' && !cp['_ep.exchangeOperationId']) out.push(issue('error', 'configParams._ep.exchangeOperationId', 'Exchange 缺少 operation', '配置保留参数'));
  if (effect.presetType === 'DeployConsumeSource' && (!cp['_ep.targetEntityTemplate'] || !cp['_ep.lifecycleAttributeValueSource'] || ![0,1,2,3].some(i => cp[`_ep.lifecycleAttribute${i}`]))) out.push(issue('error', 'configParams', 'DeployConsumeSource 保留参数不完整', '配置模板、值来源和至少一个 Attribute'));
  return out;
}

export function validateAbility(ability, refs = {}) {
  const out = [];
  const { effects = [], requirements = [], assets = [], triggers = [] } = refs;
  const effectIds = new Set(effects.map(e => e.effect_id));
  const reqIds = new Set(requirements.map(r => r.requirement_id));

  if (!ability.ability_id) out.push(issue('error', 'ability_id', '缺少 ability_id', '填写唯一 ID'));
  ['cost_effect_ids', 'cooldown_effect_ids', 'activation_effect_ids', 'cancellation_effect_ids'].forEach(field => {
    (ability[field] || []).forEach(id => {
      if (!effectIds.has(id)) out.push(issue('error', field, `效果引用无效：${id}`, '重新选择效果'));
    });
  });
  (ability.activation_requirements || []).forEach(id => {
    if (!reqIds.has(id)) out.push(issue('error', 'activation_requirements', `需求引用无效：${id}`, '重新选择需求'));
  });
  if (ability.icon_asset_id && !assets.some(a => a.asset_id === ability.icon_asset_id)) {
    out.push(issue('warning', 'icon_asset_id', '图标资源引用无效', '重新选择资源'));
  }
  if ((ability.activation_effect_ids || []).length === 0) {
    out.push(issue('warning', 'activation_effect_ids', '未配置激活效果，激活后不会产生任何结果', '添加激活效果'));
  }
  if (ability.activation_mode === 'event_driven' && !triggers.some(t => (t.requests || []).some(r => r.ability_id === ability.ability_id))) {
    out.push(issue('warning', 'activation_mode', '事件驱动能力应由 Trigger 发起 Ability Request', '在触发器中配置 activate_ability 请求'));
  }
  (ability.listeners || []).forEach((l, i) => {
    (l.responses || []).forEach((r, ri) => {
      if (r.response_type === 'activate_ability' && r.ability_id === ability.ability_id) {
        out.push(issue('error', `listeners[${i}].responses[${ri}]`, 'Listener 重新激活自身，存在递归风险', '改为其它能力或设置 max_executions'));
      }
    });
  });
  return out;
}