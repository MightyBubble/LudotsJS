import React from 'react';
import { Section, NumberField, SelectField, TextField } from '@/components/ludots/ui';
import { normalizeEntityPanelProfile } from '@/lib/runtime/entityPanelRuntime';

export default function EntityPanelProfileDetails({ draft, patch, collections = [], queryGraphs = [], itemProfiles = [] }) {
  const panel = normalizeEntityPanelProfile(draft);
  const patchPart = (key, update) => patch({ [key]: { ...panel[key], ...update } });
  return <div className="max-w-4xl mx-auto grid gap-3 lg:grid-cols-2 items-start">
    <div>
      <Section title="基础与集合来源">
        <TextField label="Panel ID" value={panel.panel_id} onChange={panel_id => patch({ panel_id })} />
        <TextField label="显示名" value={panel.label} onChange={label => patch({ label })} />
        <SelectField label="Item Presenter" value={panel.item_presentation_profile_ref} options={itemProfiles.map(item => ({ value: item.profile_id, label: item.label ? `${item.label} · ${item.profile_id}` : item.profile_id }))} onChange={item_presentation_profile_ref => patch({ item_presentation_profile_ref })} />
        <SelectField label="Entity Collection" value={panel.source.collection_key}
          options={collections.map(item => ({ value: item.collection_key, label: item.label ? `${item.collection_key} · ${item.label}` : item.collection_key }))}
          onChange={collection_key => patchPart('source', { collection_key })} hint="Panel 只消费集合，不负责产生集合。" />
      </Section>
      <Section title="集合内过滤">
        <SelectField label="Entity Query Graph" value={panel.filter.entity_query_graph_ref}
          options={[{ value: '__none__', label: '不使用查询图' }, ...queryGraphs.map(query => ({ value: query.query_name, label: query.query_name }))]}
          onChange={value => patchPart('filter', { entity_query_graph_ref: value === '__none__' ? '' : value })}
          hint="查询图只在来源集合内执行；留空表示不过滤。技能、Buff、标签、属性与关系筛选统一在图中组合。" />
        {!queryGraphs.length && <p className="text-[10px] text-gray-500">请先在实体查询图中创建过滤查询。</p>}
      </Section>
    </div>
    <Section title="卡片投影">
      <SelectField label="模式" value={panel.layout.mode} options={[{ value: 'flat', label: '平铺实体' }, { value: 'aggregate', label: '聚合兵牌' }]} onChange={mode => patchPart('layout', { mode })} />
      {panel.layout.mode === 'aggregate' && <p className="text-[10px] text-gray-500">聚合固定按 Prototype ID 合并同类实体。</p>}
      <NumberField label="列数" value={panel.layout.columns} onChange={columns => patchPart('layout', { columns })} />
      <NumberField label="可视行数" value={panel.layout.visible_rows} onChange={visible_rows => patchPart('layout', { visible_rows })} />
      <SelectField label="选择模式" value={panel.selection.mode} options={[{ value: 'single', label: '单选' }, { value: 'multiple', label: '多选' }]} onChange={mode => patchPart('selection', { mode })} />
    </Section>
  </div>;
}