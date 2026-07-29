import { EFFECT_PRESET_TYPES } from './effectPresetTypes';

const issue = (severity, field_path, message, fix) => ({ severity, field_path, message, fix });

/** Effect 校验：严格对应 C# EffectTemplateConfig / EffectTemplateLoader。 */
export function validateEffect(effect, refs = {}) {
  const out = [];
  const attrIds = new Set((refs.attributes || []).map(a => a.attribute_id));
  const effectIds = new Set((refs.effects || []).map(e => e.effect_id));
  if (!effect.effect_id) out.push(issue('error', 'effect_id', '缺少 C# id', '填写唯一 ID'));
  if (!EFFECT_PRESET_TYPES.includes(effect.presetType)) out.push(issue('error', 'presetType', '不是 C# EffectPresetType', '选择有效枚举'));
  if (!['Instant', 'After', 'Infinite'].includes(effect.lifetime)) out.push(issue('error', 'lifetime', '不是 C# LifetimeKind', '选择有效枚举'));
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
  (effect.grantedTags || []).forEach((g, i) => { if (!g.tag || !g.formula) out.push(issue('error', `grantedTags[${i}]`, '授予标签需要 tag 与 formula', '补全字段')); });
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