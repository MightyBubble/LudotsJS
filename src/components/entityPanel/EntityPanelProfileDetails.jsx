import React from 'react';
import { Section, ListField, NumberField, SelectField, TextField } from '@/components/ludots/ui';
import { normalizeEntityPanelProfile } from '@/lib/runtime/entityPanelRuntime';

export default function EntityPanelProfileDetails({ draft, patch, collections = [] }) {
  const panel = normalizeEntityPanelProfile(draft);
  const patchPart = (key, update) => patch({ [key]: { ...panel[key], ...update } });
  return <div className="max-w-4xl mx-auto grid gap-3 lg:grid-cols-2 items-start">
    <div>
      <Section title="基础与集合来源">
        <TextField label="Panel ID" value={panel.panel_id} onChange={panel_id => patch({ panel_id })} />
        <TextField label="显示名" value={panel.label} onChange={label => patch({ label })} />
        <SelectField label="Entity Collection" value={panel.source.collection_key}
          options={collections.map(item => ({ value: item.collection_key, label: item.label ? `${item.collection_key} · ${item.label}` : item.collection_key }))}
          onChange={collection_key => patchPart('source', { collection_key })} hint="Panel 只消费集合，不负责产生集合。" />
      </Section>
      <Section title="集合内过滤">
        <ListField label="Prototype IDs" value={panel.filter.prototype_ids} onChange={prototype_ids => patchPart('filter', { prototype_ids })} />
        <ListField label="必须拥有的 Ability IDs" value={panel.filter.required_ability_ids} onChange={required_ability_ids => patchPart('filter', { required_ability_ids })} />
        <ListField label="必须绑定的 Role IDs" value={panel.filter.required_role_ids} onChange={required_role_ids => patchPart('filter', { required_role_ids })} />
      </Section>
    </div>
    <Section title="卡片投影">
      <SelectField label="模式" value={panel.layout.mode} options={[{ value: 'flat', label: '平铺实体' }, { value: 'aggregate', label: '聚合兵牌' }]} onChange={mode => patchPart('layout', { mode })} />
      {panel.layout.mode === 'aggregate' && <SelectField label="聚合维度" value={panel.layout.aggregate_by} options={[{ value: 'prototype', label: '实体原型' }, { value: 'semantic_profile', label: '技能语义 Profile' }]} onChange={aggregate_by => patchPart('layout', { aggregate_by })} />}
      <NumberField label="列数" value={panel.layout.columns} onChange={columns => patchPart('layout', { columns })} />
      <NumberField label="可视行数" value={panel.layout.visible_rows} onChange={visible_rows => patchPart('layout', { visible_rows })} />
      <SelectField label="选择模式" value={panel.selection.mode} options={[{ value: 'single', label: '单选' }, { value: 'multiple', label: '多选' }]} onChange={mode => patchPart('selection', { mode })} />
    </Section>
  </div>;
}