import React from 'react';
import { Section, ListField, NumberField, SelectField, TextField } from '@/components/ludots/ui';
import RoleSlotMapEditor from './RoleSlotMapEditor';

export default function CommandPanelProfileDetails({ draft, patch, semanticProfiles = [] }) {
  const profile = semanticProfiles.find(p => p.profile_id === draft.semantic_profile_ref);

  return (
    <>
      <Section title="基础信息">
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Panel ID" value={draft.panel_id} onChange={panel_id => patch({ panel_id })} />
          <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
        </div>
        <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
      </Section>

      <Section title="来源">
        <TextField label="Actor 集合键" value={draft.actor_collection_key}
          onChange={actor_collection_key => patch({ actor_collection_key })}
          hint="由 ControlPlane 查询图输出；不依赖选中的面板引用一个不依赖选中的集合即可。" />
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Actor 排序规则" value={draft.actor_sort} onChange={actor_sort => patch({ actor_sort })} />
          <NumberField label="Actor 上限" value={draft.max_actors} onChange={max_actors => patch({ max_actors })}
            hint="1 = 只看排序后的第一个单位；留空为全体" />
        </div>
      </Section>

      <Section title="技能过滤与聚合">
        <ListField label="必须命中的标签" value={draft.required_all_tags}
          onChange={required_all_tags => patch({ required_all_tags })} />
        <ListField label="排除的标签" value={draft.blocked_any_tags}
          onChange={blocked_any_tags => patch({ blocked_any_tags })} />
        <ListField label="聚合对齐标签" value={draft.aggregation_key_tags}
          onChange={aggregation_key_tags => patch({ aggregation_key_tags })}
          hint="按标签判定跨单位是否同一个技能（如 Ability.Blink），与 ability_id 无关。" />
      </Section>

      <Section title="槽位落位">
        <SelectField label="槽位语义组" value={draft.semantic_profile_ref}
          options={semanticProfiles.map(p => ({ value: p.profile_id, label: p.label || p.profile_id }))}
          onChange={semantic_profile_ref => patch({ semantic_profile_ref, role_slot_map: [] })} />
        <ListField label="槽位布局" value={draft.slots} onChange={slots => patch({ slots })} hint="按顺序，如 Q, W, E, R" />
        <RoleSlotMapEditor value={draft.role_slot_map || []} slots={draft.slots || []}
          roles={profile?.roles || []} onChange={role_slot_map => patch({ role_slot_map })} />
        <TextField label="兜底排序规则" value={draft.fallback_sort} onChange={fallback_sort => patch({ fallback_sort })}
          hint="未命中语义的技能按此规则填充剩余空槽。" />
      </Section>
    </>
  );
}