import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { BoolField, ListField, NumberField, SelectField, TextField } from '@/components/ludots/ui';
import RoleSlotMapEditor from './RoleSlotMapEditor';

const SOURCE_KINDS = [
  { value: 'actor_collection', label: 'Actor 集合（看选择集）' },
  { value: 'global', label: '全局（不依赖选中）' },
];
const ACTOR_SORTS = ['None', 'SelectionOrder', 'PrototypePriority', 'AbilityCountDesc'].map(v => ({ value: v, label: v }));
const AGG_MODES = [
  { value: 'Intersect', label: 'Intersect（全体都有才显示）' },
  { value: 'Union', label: 'Union（任一拥有即显示）' },
];
const PARTIAL = [{ value: 'Hide', label: 'Hide' }, { value: 'Dim', label: 'Dim（灰显）' }];
const FALLBACK_SORTS = ['None', 'CatalogTagOrder', 'AbilityIdAlpha', 'SelectionOrder'].map(v => ({ value: v, label: v }));

export default function CommandPanelEditor({ panel, patch, onRemove, semanticProfiles = [] }) {
  const profile = semanticProfiles.find(p => p.profile_id === panel.semantic_profile_ref);

  return (
    <div className="border border-[#2A2E37] rounded p-3 space-y-3 bg-[#0D0F14]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#E2D8B3]">{panel.panel_id || '未命名面板'}</span>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400" onClick={onRemove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <TextField label="Panel ID" value={panel.panel_id} onChange={panel_id => patch({ panel_id })} />
        <TextField label="显示名" value={panel.label} onChange={label => patch({ label })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <SelectField label="来源" value={panel.source_kind} options={SOURCE_KINDS}
          onChange={source_kind => patch({ source_kind })} />
        {panel.source_kind !== 'global' && (
          <TextField label="Actor 集合键" value={panel.actor_collection_key}
            onChange={actor_collection_key => patch({ actor_collection_key })}
            hint="由 ControlPlane 查询图输出" />
        )}
      </div>

      {panel.source_kind !== 'global' && (
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Actor 排序" value={panel.actor_sort} options={ACTOR_SORTS}
            onChange={actor_sort => patch({ actor_sort })} />
          <NumberField label="Actor 上限" value={panel.max_actors}
            onChange={max_actors => patch({ max_actors })} hint="1 = 只看排序后的第一个单位；留空为全体" />
        </div>
      )}

      <ListField label="必须命中的技能标签" value={panel.required_all_tags}
        onChange={required_all_tags => patch({ required_all_tags })} />
      <ListField label="排除的技能标签" value={panel.blocked_any_tags}
        onChange={blocked_any_tags => patch({ blocked_any_tags })} />
      <BoolField label="只收主动技能" value={panel.active_only} onChange={active_only => patch({ active_only })} />

      <div className="grid grid-cols-2 gap-2">
        <SelectField label="聚合模式" value={panel.aggregation_mode} options={AGG_MODES}
          onChange={aggregation_mode => patch({ aggregation_mode })} />
        <SelectField label="部分覆盖时" value={panel.partial_coverage} options={PARTIAL}
          onChange={partial_coverage => patch({ partial_coverage })} />
      </div>
      <ListField label="聚合对齐标签" value={panel.aggregation_key_tags}
        onChange={aggregation_key_tags => patch({ aggregation_key_tags })}
        hint="按标签判定跨单位是否同一个技能（如 Ability.Blink），与 ability_id 无关" />

      <SelectField label="槽位语义组" value={panel.semantic_profile_ref}
        options={semanticProfiles.map(p => ({ value: p.profile_id, label: p.label || p.profile_id }))}
        onChange={semantic_profile_ref => patch({ semantic_profile_ref, role_slot_map: [] })} />
      <ListField label="槽位布局" value={panel.slots} onChange={slots => patch({ slots })}
        hint="按顺序，如 Q, W, E, R" />
      <RoleSlotMapEditor value={panel.role_slot_map || []} slots={panel.slots || []}
        roles={profile?.roles || []} onChange={role_slot_map => patch({ role_slot_map })} />
      <SelectField label="兜底排序" value={panel.fallback_sort} options={FALLBACK_SORTS}
        onChange={fallback_sort => patch({ fallback_sort })} />
    </div>
  );
}