import React from 'react';
import { Section, NumberField, TextField, SelectField } from '@/components/ludots/ui';
import PanelAggregationEditor from './PanelAggregationEditor';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';
import PanelFixedSlotsEditor from './PanelFixedSlotsEditor';
import PanelDynamicLayoutEditor from './PanelDynamicLayoutEditor';

export default function CommandPanelProfileDetails({
  draft, patch, tags = [], actions = [], sortKeys = [], slotKeys = [], hotkeySequences = [], projections = [],
}) {
  return (
    <>
      <Section title="基础信息">
        <div className="grid grid-cols-2 gap-2">
          <TextField label="Panel ID" value={draft.panel_id} onChange={panel_id => patch({ panel_id })} />
          <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
        </div>
        <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
        <SelectField label="落位方式" value={draft.layout_mode || 'dynamic'}
          options={[{ value: 'fixed', label: '固定槽位' }, { value: 'dynamic', label: '动态排列' }]}
          onChange={layout_mode => patch({ layout_mode })} />
      </Section>

      <Section title="来源">
        <SelectField label="Actor 投影" value={draft.actor_collection_key}
          options={projections.map(p => ({ value: p.collection_key, label: p.label ? `${p.collection_key} · ${p.label}` : p.collection_key }))}
          onChange={actor_collection_key => patch({ actor_collection_key })}
          hint="引用 Actor Projections 中声明的投影；集合的排序与裁剪由投影规则负责，面板只消费结果" />
        {!projections.length && <p className="text-[10px] text-gray-500">请先在「Actor Projections」中声明投影键。</p>}
      </Section>

      <Section title="过滤：面板收哪些技能">
        <GameplayTagListSelect label="须全部命中" value={draft.required_all_tags} tags={tags}
          onChange={required_all_tags => patch({ required_all_tags })} />
        <GameplayTagListSelect label="排除" value={draft.blocked_any_tags} tags={tags}
          onChange={blocked_any_tags => patch({ blocked_any_tags })} />
      </Section>

      <PanelAggregationEditor draft={draft} patch={patch} tags={tags} />

      <Section title="网格">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="每行按钮数" value={draft.columns} onChange={columns => patch({ columns })} />
          <NumberField label="可视行数" value={draft.visible_rows} onChange={visible_rows => patch({ visible_rows })}
            hint="超出后面板内滚动" />
        </div>
      </Section>

      {draft.layout_mode === 'fixed'
        ? <PanelFixedSlotsEditor value={draft.slots || []} tags={tags} actions={actions} slotKeys={slotKeys}
            onChange={slots => patch({ slots })} />
        : <PanelDynamicLayoutEditor draft={draft} patch={patch} sortKeys={sortKeys} hotkeySequences={hotkeySequences} />}
    </>
  );
}