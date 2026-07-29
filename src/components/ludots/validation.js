import {
  PHASE_IDS, PHASE_META, INSTANT_FORBIDDEN_PHASES, isDurableKind, normalizePhases,
} from './phaseModel';

const issue = (severity, field_path, message, fix) => ({ severity, field_path, message, fix });

/** Effect 校验：lifetime / phase 顺序与语义 / ActionGraph 引用 / Listener 递归 / 销毁协议 */
export function validateEffect(effect, refs = {}) {
  const out = [];
  const { actionGraphs = [], requirements = [], effects = [], events = [], abilities = [], attributes = [], dataGraphs = [] } = refs;
  const graphIds = new Set(actionGraphs.map(g => g.action_id));
  const reqIds = new Set(requirements.map(r => r.requirement_id));
  const effectIds = new Set(effects.map(e => e.effect_id));
  const eventIds = new Set(events.map(e => e.event_id));
  const abilityIds = new Set(abilities.map(a => a.ability_id));
  const attrIds = new Set(attributes.map(a => a.attribute_id));
  const dataGraphIds = new Set(dataGraphs.map(g => g.graph_id));

  const kind = effect.lifetime || 'Instant';
  const duration = effect.duration || {};
  const durable = isDurableKind(kind);

  if (!effect.effect_id) out.push(issue('error', 'effect_id', '缺少 C# id', '填写唯一 ID'));
  if (effect.participatesInResponse === undefined) out.push(issue('error', 'participatesInResponse', '必须明确是否参与 ResponseChain', '设置 true 或 false'));
  if (kind === 'After' && (!Number.isInteger(duration.durationTicks) || duration.durationTicks < 1)) out.push(issue('error', 'duration.durationTicks', 'After 必须配置正整数 durationTicks', '填写 tick 数'));
  if (!durable && duration.periodTicks !== undefined) out.push(issue('error', 'duration.periodTicks', 'Instant 不允许 periodTicks', '删除 periodTicks 或改为 After / Infinite'));
  if (kind === 'Infinite' && duration.durationTicks !== undefined) out.push(issue('warning', 'duration.durationTicks', 'Infinite 的 durationTicks 会被忽略', '移除 durationTicks'));
  if (effect.expireCondition && (!effect.expireCondition.kind || !effect.expireCondition.tag || !effect.expireCondition.sense)) {
    out.push(issue('error', 'expireCondition', 'ExpireCondition 的 kind、tag、sense 必须完整', '补全 C# ExpireConditionConfig'));
  }

  const phases = normalizePhases(effect.phases);
  phases.forEach((p, idx) => {
    const path = `phases.${p.phase_id}`;
    if (p.phase_id !== PHASE_IDS[idx]) out.push(issue('error', path, 'phase 顺序不符合固定阶段序列', '使用固定顺序：' + PHASE_IDS.join(' → ')));
    if (!p.enabled) return;

    if (!durable && INSTANT_FORBIDDEN_PHASES.includes(p.phase_id)) {
      out.push(issue('error', path, `instant 不允许启用 ${PHASE_META[p.phase_id].label}`, '关闭该阶段或将 lifetime 改为 after / infinite'));
    }

    [...(p.pre_action_graph_ids || []), ...(p.post_action_graph_ids || [])].forEach(id => {
      if (!graphIds.has(id)) out.push(issue('error', `${path}.action_graph`, `ActionGraph 引用无效：${id}`, '在图编辑器中创建该动作图或重新选择'));
    });

    const main = p.main || {};
    if (main.mode === 'action_graph') {
      if (!main.action_graph_id) out.push(issue('error', `${path}.main`, 'Main 选择了 action_graph 但未指定图', '选择一个 ActionGraph'));
      else if (!graphIds.has(main.action_graph_id)) out.push(issue('error', `${path}.main`, `Main ActionGraph 引用无效：${main.action_graph_id}`, '重新选择动作图'));
    }
    if (main.mode === 'builtin') {
      const b = main.builtin || {};
      if (!b.operation_type) out.push(issue('error', `${path}.main.builtin`, '未选择内置操作类型', '选择 builtin operation'));
      if (['modify_attribute', 'set_attribute'].includes(b.operation_type) && !attrIds.has(b.attribute_id)) {
        out.push(issue('error', `${path}.main.builtin.attribute_id`, '属性引用无效', '重新选择属性'));
      }
      if (['apply_effect', 'remove_effect'].includes(b.operation_type) && !effectIds.has(b.effect_id)) {
        out.push(issue('error', `${path}.main.builtin.effect_id`, '效果引用无效', '重新选择效果'));
      }
      if (b.operation_type === 'emit_event' && !eventIds.has(b.event_id)) {
        out.push(issue('error', `${path}.main.builtin.event_id`, '事件引用无效', '重新选择事件'));
      }
      if (b.operation_type === 'execute_data_graph' && !dataGraphIds.has(b.data_graph_id)) {
        out.push(issue('error', `${path}.main.builtin.data_graph_id`, '数据图引用无效', '重新选择数据图'));
      }
      if (b.operation_type === 'entity_lifecycle_request' && !b.lifecycle_request) {
        out.push(issue('error', `${path}.main.builtin.lifecycle_request`, '未选择生命周期请求类型', '选择 create / destroy'));
      }
      if (b.operation_type === 'entity_lifecycle_request' && b.lifecycle_request === 'destroy' && p.phase_id === 'on_remove') {
        out.push(issue('warning', `${path}.main.builtin`, 'OnRemove 中再发起销毁请求可能造成销毁递归', '交由销毁清理流程处理，或加入去重'));
      }
    }

    // Listener 校验
    (p.listeners || []).forEach((l, li) => {
      const lp = `${path}.listeners[${li}]`;
      (l.requirements || []).forEach(id => {
        if (!reqIds.has(id)) out.push(issue('error', `${lp}.requirements`, `需求引用无效：${id}`, '重新选择需求'));
      });
      if ((l.responses || []).length === 0) out.push(issue('warning', lp, 'Listener 未定义任何响应', '添加至少一个入队响应'));
      (l.responses || []).forEach((r, ri) => {
        const rp = `${lp}.responses[${ri}]`;
        if (r.response_type === 'apply_effect' && r.effect_id === effect.effect_id) {
          out.push(issue('error', rp, 'Listener 直接重新入队自身，存在递归风险', '改为其它效果或设置 max_executions'));
        }
        if (['apply_effect', 'remove_effect'].includes(r.response_type) && r.effect_id && !effectIds.has(r.effect_id)) {
          out.push(issue('error', rp, '效果引用无效', '重新选择效果'));
        }
        if (r.response_type === 'emit_event' && r.event_id && !eventIds.has(r.event_id)) {
          out.push(issue('error', rp, '事件引用无效', '重新选择事件'));
        }
        if (r.response_type === 'activate_ability' && r.ability_id && !abilityIds.has(r.ability_id)) {
          out.push(issue('error', rp, '能力引用无效', '重新选择能力'));
        }
        if (r.response_type === 'entity_lifecycle_request' && !r.lifecycle_request) {
          out.push(issue('error', rp, '未选择生命周期请求类型', '选择 create / destroy'));
        }
      });
      if (l.max_executions === undefined && (l.responses || []).some(r => r.response_type === 'apply_effect')) {
        out.push(issue('warning', lp, '入队 apply_effect 但未限制 max_executions', '设置 max_executions 以限制递归'));
      }
    });
  });

  const applyPhase = phases.find(p => p.phase_id === 'on_apply');
  if (!applyPhase?.enabled) out.push(issue('warning', 'phases.on_apply', 'OnApply 未启用，效果不会写入任何状态', '启用 OnApply 并配置 Main'));

  const removePhase = phases.find(p => p.phase_id === 'on_remove');
  const expirePhase = phases.find(p => p.phase_id === 'on_expire');
  if (expirePhase?.enabled && !removePhase?.enabled) {
    out.push(issue('warning', 'phases.on_remove', 'OnExpire 已启用但 OnRemove 未启用；强制移除路径将没有清理逻辑', '启用 OnRemove 承载清理'));
  }

  // ResponseChain 预算
  const rc = effect.response_chain || {};
  if (rc.enabled) {
    if (!rc.max_depth || rc.max_depth < 1) out.push(issue('error', 'response_chain.max_depth', '必须设置 ≥1 的最大响应深度', '设置 max_depth'));
    if (!rc.max_responses) out.push(issue('warning', 'response_chain.max_responses', '未限制最大响应数', '设置 max_responses'));
    if (!rc.root_budget) out.push(issue('warning', 'response_chain.root_budget', '未设置 root budget', '设置 root_budget'));
    if (!rc.dedupe_by_correlation) out.push(issue('warning', 'response_chain.dedupe_by_correlation', '未启用 correlationId 去重，可能形成无限反应', '启用去重'));
    (rc.entries || []).forEach((e, i) => {
      if (e.action === 'replace' && !effectIds.has(e.replacement_effect_id)) {
        out.push(issue('error', `response_chain.entries[${i}]`, 'replace 未指定有效的替换效果', '选择替换效果'));
      }
      if (e.action === 'append' && !effectIds.has(e.appended_effect_id)) {
        out.push(issue('error', `response_chain.entries[${i}]`, 'append 未指定有效的追加效果', '选择追加效果'));
      }
    });
  }

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