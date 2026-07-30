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
  const effectIds = new Set((refs.effects || []).map(effect => effect.effect_id));
  const graphIds = new Set([...(refs.actionGraphs || []).map(graph => graph.action_id), ...(refs.dataGraphs || []).map(graph => graph.graph_id)]);
  if (!ability.ability_id) out.push(issue('error', 'ability_id', '缺少 GAS ability id', '填写唯一 id'));
  if (!ability.exec?.clockId) out.push(issue('error', 'exec.clockId', 'AbilityExecLoader 要求 clockId', '填写 FixedFrame 等有效时钟'));
  if (!Array.isArray(ability.exec?.items)) out.push(issue('error', 'exec.items', 'AbilityExecLoader 要求 items 数组', '至少添加 End item'));
  if ((ability.exec?.items || []).length > 16) out.push(issue('error', 'exec.items', '超过 AbilityExecSpec.MAX_ITEMS 16', '减少 Exec Item'));
  if ((ability.exec?.callerParams || []).length > 4) out.push(issue('error', 'exec.callerParams', '超过 AbilityExecCallerParamsPool.MAX_SETS 4', '减少调用参数组'));
  (ability.exec?.items || []).forEach((item, index) => {
    if (!item.kind) out.push(issue('error', `exec.items[${index}].kind`, '缺少 ExecItemKind', '选择原生 kind'));
    if (!Number.isInteger(item.tick)) out.push(issue('error', `exec.items[${index}].tick`, 'tick 必须是整数', '填写执行 tick'));
    if (['EffectClip','EffectSignal'].includes(item.kind) && (!item.template || !effectIds.has(item.template))) out.push(issue('error', `exec.items[${index}].template`, 'Effect 模板引用无效', '选择现有 Effect'));
    if (item.kind === 'GraphSignal' && (!item.graph || !graphIds.has(item.graph))) out.push(issue('error', `exec.items[${index}].graph`, 'Graph 程序引用无效', '选择现有 Graph'));
    if (item.kind === 'InputGate' && item.payloadA === undefined) out.push(issue('error', `exec.items[${index}].payloadA`, 'InputGate 必须提供 payloadA', '填写输入门载荷'));
  });
  (ability.onActivateEffects || []).forEach((id, index) => { if (!effectIds.has(id)) out.push(issue('error', `onActivateEffects[${index}]`, `Effect 引用无效：${id}`, '选择现有 Effect')); });
  if ((ability.onActivateEffects || []).length > 16) out.push(issue('error', 'onActivateEffects', '超过 C# 容量 16', '减少 Effect 数量'));
  if ((ability.toggleSpec?.activeEffects || []).length > 4) out.push(issue('error', 'toggleSpec.activeEffects', '超过 C# 容量 4', '减少 activeEffects'));
  (ability.toggleSpec?.activeEffects || []).forEach((id, index) => { if (!effectIds.has(id)) out.push(issue('error', `toggleSpec.activeEffects[${index}]`, `Effect 引用无效：${id}`, '选择现有 Effect')); });
  if (ability.activationPrecondition?.validationGraph && !graphIds.has(ability.activationPrecondition.validationGraph)) out.push(issue('error', 'activationPrecondition.validationGraph', 'Graph 引用无效', '选择现有 Graph'));
  if (ability.targeting && (ability.targeting.castRangeCm === undefined || !ability.targeting.impactEffect)) out.push(issue('error', 'targeting', 'targeting 必须同时提供 castRangeCm 与 impactEffect', '补全目标字段'));
  if (ability.targeting?.impactEffect && !effectIds.has(ability.targeting.impactEffect)) out.push(issue('error', 'targeting.impactEffect', 'Effect 引用无效', '选择现有 Effect'));
  if (ability.input && !Object.values(ability.input).some(value => value !== undefined && value !== '')) out.push(issue('error', 'input', 'input 至少声明一个覆盖字段', '选择触发、策略或施法模式'));
  return out;
}