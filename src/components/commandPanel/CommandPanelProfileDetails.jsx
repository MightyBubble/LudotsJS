import React from 'react';
import { Section, NumberField, TextField, SelectField } from '@/components/ludots/ui';
import PanelAggregationEditor from './PanelAggregationEditor';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';
import PanelFixedSlotsEditor from './PanelFixedSlotsEditor';
import PanelDynamicLayoutEditor from './PanelDynamicLayoutEditor';

export default function CommandPanelProfileDetails({
  draft, patch, tags = [], actions = [], collections = [],
}) {
  const isFixed = draft.layout_mode === 'fixed';

  return (
    <div className="max-w-[1100px] mx-auto grid gap-x-4 lg:grid-cols-2 items-start">
      {/* 左列：这个面板是什么、看哪儿 */}
      <div>
        <Section title="基础信息">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Panel ID" value={draft.panel_id} onChange={panel_id => patch({ panel_id })} />
            <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
          </div>
          <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
        </Section>

        <Section title="来源">
          <SelectField label="Actor 集合键" value={draft.actor_collection_key}
            options={collections.map(c => ({ value: c.collection_key, label: c.label ? `${c.collection_key} · ${c.label}` : c.collection_key }))}
            onChange={actor_collection_key => patch({ actor_collection_key })}
            hint="读取哪个实体集合；集合内容由生产者写入，面板只消费结果" />
          {!collections.length && <p className="text-[10px] text-gray-500">请先在「Entity Collections」中声明集合键。</p>}
        </Section>

        <Section title="过滤：面板收哪些技能">
          <GameplayTagListSelect label="须全部命中" value={draft.required_all_tags} tags={tags}
            onChange={required_all_tags => patch({ required_all_tags })} />
          <div className="h-px bg-[#2A2E37]" />
          <GameplayTagListSelect label="排除" value={draft.blocked_any_tags} tags={tags}
            onChange={blocked_any_tags => patch({ blocked_any_tags })} />
        </Section>

        <PanelAggregationEditor draft={draft} patch={patch} tags={tags} />
      </div>

      {/* 右列：怎么摆 */}
      <div>
        <Section title="落位方式">
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="模式" value={draft.layout_mode || 'dynamic'}
              options={[{ value: 'fixed', label: '固定槽位' }, { value: 'dynamic', label: '动态排列' }]}
              onChange={layout_mode => patch({ layout_mode })} />
            <NumberField label="每行按钮数" value={draft.columns} onChange={columns => patch({ columns })} />
            <NumberField label="可视行数" value={draft.visible_rows} onChange={visible_rows => patch({ visible_rows })} />
          </div>
          <p className="text-[10px] text-gray-600">
            {isFixed
              ? '固定槽位：按语义槽位摆放，未命中的槽位留空占位，不塌缩。'
              : '动态排列：按排序优先级依次填入网格，并按顺序取快捷键。'}
            {' '}按钮超出可视行数后面板内滚动。
          </p>
        </Section>

        {isFixed
          ? <PanelFixedSlotsEditor value={draft.slots || []} tags={tags} actions={actions}
              onChange={slots => patch({ slots })} />
          : <PanelDynamicLayoutEditor draft={draft} patch={patch} tags={tags} actions={actions} />}
      </div>
    </div>
  );
}