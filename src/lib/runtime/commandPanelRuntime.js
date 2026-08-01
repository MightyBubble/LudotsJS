import { normalizePanelProfile } from '@/components/commandPanel/panelProfileModel';

const hasAll = (tags, required = []) => required.every(t => tags.includes(t));
const hasAny = (tags, any = []) => any.some(t => tags.includes(t));

function matchBucketIndex(tags, buckets = []) {
  const i = buckets.findIndex(b => hasAll(tags, b.required_all_tags || []) && !hasAny(tags, b.blocked_any_tags || []));
  return i < 0 ? buckets.length : i;
}

/** 命令面板运行时：正式 API。输入有序 entity 列表 + 面板配置，输出按钮落位结果。 */
export function createCommandPanelRuntime({ panelProfile, abilityProvider, log, slotOverrides = {} }) {
  const panel = normalizePanelProfile(panelProfile || {});
  let entities = [];

  const resolveFixed = () => {
    const buttons = [];
    const errors = [];
    (panel.layout.fixed.slots || []).forEach((slot, index) => {
      // 覆盖表存的是引用：{ kind: 'role' | 'ability', id }。有语义走语义，没语义直接指技能
      const override = slotOverrides[slot.slot_id];
      const ref = override || { kind: 'role', id: slot.role_id };
      let roleId = null;
      let abilityId = null;
      let owner = null;
      if (ref.kind === 'ability') {
        abilityId = ref.id;
        owner = entities.find(e => (e.ability_ids || []).includes(abilityId));
        if (!owner) {
          errors.push({ slot_id: slot.slot_id, reason: 'no_entity_owns_ability', ability_id: abilityId });
          return;
        }
      } else {
        roleId = ref.id;
        owner = entities.find(e => (e.role_bindings || []).some(b => b.role_id === roleId));
        abilityId = owner && (owner.role_bindings.find(b => b.role_id === roleId) || {}).ability_id;
        if (!abilityId) {
          errors.push({ slot_id: slot.slot_id, reason: 'no_entity_bound_to_role', role_id: roleId });
          return;
        }
      }
      const ability = abilityProvider.get(abilityId);
      if (!ability) {
        errors.push({ slot_id: slot.slot_id, reason: 'ability_not_found', role_id: roleId, ability_id: abilityId });
        return;
      }
      buttons.push({
        button_id: slot.slot_id, index, ability_id: abilityId, ability,
        slot_id: slot.slot_id, role_id: roleId, configured_role_id: slot.role_id,
        source_ref: ref, action_id: slot.action_id || '',
        actors: [owner.entity_id],
        unavailable: false,
        trace: [
          `${override ? '覆盖表' : '配置'} ${slot.slot_id} → ${ref.kind} ${ref.id}`,
          roleId ? `role ${roleId} → ${owner.entity_id} → ${abilityId}` : `ability ${abilityId} → ${owner.entity_id}`,
        ],
      });
    });
    return { buttons, errors };
  };

  const resolveDynamic = () => {
    const errors = [];
    const groups = new Map();
    for (const entity of entities) {
      for (const { ability_id, ability } of abilityProvider.listForEntity(entity)) {
        if (!ability) { errors.push({ entity_id: entity.entity_id, reason: 'ability_not_found', ability_id }); continue; }
        const tags = ability.catalogTags;
        if (!hasAll(tags, panel.filter.required_all_tags || []) || hasAny(tags, panel.filter.blocked_any_tags || [])) continue;
        const rule = (panel.grouping.rules || []).find(r => hasAll(tags, r.match_all_tags || []));
        // aggregate_key_tags 是聚合维度（标签前缀）：取该实体技能在这些维度上的实际标签作为判等键
        const dims = rule?.aggregate_key_tags || [];
        const keyTags = tags.filter(t => dims.some(d => t === d || t.startsWith(`${d}.`)));
        const key = keyTags.length ? keyTags.join('|') : ability_id;
        const existing = groups.get(key);
        if (existing) { existing.actors.push(entity.entity_id); continue; }
        groups.set(key, {
          ability_id, ability, actors: [entity.entity_id],
          bucket: matchBucketIndex(tags, panel.layout.dynamic.buckets),
          aggregate_key: key,
          trace: [`tags [${tags.join(', ')}]`, rule ? `聚合键 ${key}` : '未命中聚合规则，按 ability_id 独立成键'],
        });
      }
    }
    const buttons = [...groups.values()]
      .sort((a, b) => a.bucket - b.bucket || a.ability_id.localeCompare(b.ability_id))
      .map((g, index) => ({
        ...g, button_id: `${g.aggregate_key}#${index}`, index,
        action_id: (panel.layout.dynamic.hotkey_action_ids || [])[index] || '',
        trace: [...g.trace, `落位桶 #${g.bucket + 1} · 序号 ${index + 1}`],
      }));
    return { buttons, errors };
  };

  return {
    panel,
    setEntities(next = []) {
      entities = next;
      log?.info('runtime', `注入实体列表：${next.length} 个`, next.map(e => e.entity_id));
      return this;
    },
    getEntities: () => entities,
    resolve() {
      const result = panel.layout.mode === 'fixed' ? resolveFixed() : resolveDynamic();
      log?.info('panel', `解析 ${panel.panel_id || '(未命名面板)'}：${panel.layout.mode} · ${result.buttons.length} 个按钮`);
      result.errors.forEach(e => log?.error('panel', `落位失败：${e.reason}`, e));
      return { ...result, grid: panel.layout.grid || {}, mode: panel.layout.mode || 'dynamic' };
    },
    /** 激活入口：当前打通到意图层，Ability 执行接口留在 onActivate 回调上 */
    activate(button, source = 'click') {
      if (button.unavailable) {
        log?.warn('intent', `${button.ability_id} 当前无实体拥有，忽略激活`, { slot_id: button.slot_id });
        return null;
      }
      const intent = {
        type: 'ActivateAbility', ability_id: button.ability_id, actors: button.actors,
        action_id: button.action_id || null, panel_id: panel.panel_id, source, at: Date.now(),
      };
      log?.info('intent', `激活 ${button.ability_id}（${button.actors.length} 个 actor · ${source}）`, intent);
      log?.warn('intent', 'Ability 执行层尚未接入，仅产出意图', { ability_id: button.ability_id });
      return intent;
    },
    /** 按 Input Action 触发，等价于玩家按下快捷键 */
    pressAction(actionId, buttons) {
      const button = buttons.find(b => b.action_id === actionId);
      if (!button) { log?.warn('input', `Action ${actionId} 当前无对应按钮`); return null; }
      return this.activate(button, `action:${actionId}`);
    },
  };
}