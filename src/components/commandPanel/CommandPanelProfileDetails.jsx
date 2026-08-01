import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Section, TextField } from '@/components/ludots/ui';
import CommandPanelEditor from './CommandPanelEditor';

const newPanel = index => ({
  panel_id: `panel_${index}`,
  source_kind: 'actor_collection',
  actor_sort: 'SelectionOrder',
  aggregation_mode: 'Intersect',
  partial_coverage: 'Hide',
  active_only: true,
  slots: [],
  role_slot_map: [],
  fallback_sort: 'CatalogTagOrder',
});

export default function CommandPanelProfileDetails({ draft, patch, semanticProfiles = [] }) {
  const panels = draft.panels || [];
  const patchPanel = (index, next) =>
    patch({ panels: panels.map((p, i) => (i === index ? { ...p, ...next } : p)) });

  return (
    <>
      <Section title="基础信息">
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Profile ID" value={draft.panel_profile_id}
            onChange={panel_profile_id => patch({ panel_profile_id })} />
          <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
        </div>
        <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
      </Section>

      <Section title="面板区" right={
        <Button size="sm" className="bg-[#1E2128] h-7 text-xs"
          onClick={() => patch({ panels: [...panels, newPanel(panels.length)] })}>
          <Plus className="w-3 h-3 mr-1" />添加面板
        </Button>
      }>
        {panels.length === 0 && <p className="text-[11px] text-gray-500">还没有面板区，添加一个开始配置。</p>}
        {panels.map((panel, index) => (
          <CommandPanelEditor key={index} panel={panel} semanticProfiles={semanticProfiles}
            patch={next => patchPanel(index, next)}
            onRemove={() => patch({ panels: panels.filter((_, i) => i !== index) })} />
        ))}
      </Section>
    </>
  );
}