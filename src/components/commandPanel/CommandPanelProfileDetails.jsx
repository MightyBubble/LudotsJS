import React from 'react';
import { Section, NumberField, TextField, SelectField } from '@/components/ludots/ui';
import PanelAggregationEditor from './PanelAggregationEditor';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';
import PanelFixedSlotsEditor from './PanelFixedSlotsEditor';
import PanelDynamicLayoutEditor from './PanelDynamicLayoutEditor';
import { normalizePanelProfile } from './panelProfileModel';

export default function CommandPanelProfileDetails({ draft, patch, tags = [], actions = [], collections = [] }) {
  const panel = normalizePanelProfile(draft);
  const patchSection = (key, update) => patch({ [key]: { ...panel[key], ...update } });
  const layout = panel.layout;
  const patchLayoutPart = (key, update) => patchSection('layout', { [key]: { ...layout[key], ...update } });
  const isFixed = layout.mode === 'fixed';

  return (
    <div className="max-w-[1100px] mx-auto grid gap-x-4 lg:grid-cols-2 items-start">
      <div>
        <Section title="基础信息">
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Panel ID" value={panel.panel_id} onChange={panel_id => patch({ panel_id })} />
            <TextField label="显示名" value={panel.label} onChange={label => patch({ label })} />
          </div>
          <TextField label="说明" value={panel.description} onChange={description => patch({ description })} />
        </Section>

        <Section title="来源">
          <SelectField label="Actor 集合键" value={panel.source.collection_key}
            options={collections.map(c => ({ value: c.collection_key, label: c.label ? `${c.collection_key} · ${c.label}` : c.collection_key }))}
            onChange={collection_key => patchSection('source', { collection_key })}
            hint="读取哪个实体集合；集合内容由生产者写入，面板只消费结果" />
          {!collections.length && <p className="text-[10px] text-gray-500">请先在「Entity Collections」中声明集合键。</p>}
        </Section>

        <Section title="过滤：面板收哪些技能">
          <GameplayTagListSelect label="须全部命中" value={panel.filter.required_all_tags} tags={tags}
            onChange={required_all_tags => patchSection('filter', { required_all_tags })} />
          <div className="h-px bg-[#2A2E37]" />
          <GameplayTagListSelect label="排除" value={panel.filter.blocked_any_tags} tags={tags}
            onChange={blocked_any_tags => patchSection('filter', { blocked_any_tags })} />
        </Section>

        <PanelAggregationEditor value={panel.grouping.rules} tags={tags}
          onChange={rules => patchSection('grouping', { rules })} />
      </div>

      <div>
        <Section title="落位方式">
          <div className="grid grid-cols-3 gap-3">
            <SelectField label="模式" value={layout.mode}
              options={[{ value: 'fixed', label: '固定槽位' }, { value: 'dynamic', label: '动态排列' }]}
              onChange={mode => patchSection('layout', { mode })} />
            <NumberField label="每行按钮数" value={layout.grid.columns} onChange={columns => patchLayoutPart('grid', { columns })} />
            <NumberField label="可视行数" value={layout.grid.visible_rows} onChange={visible_rows => patchLayoutPart('grid', { visible_rows })} />
          </div>
          <p className="text-[10px] text-gray-600">
            {isFixed ? '固定槽位：按语义槽位摆放，未命中的槽位留空占位，不塌缩。' : '动态排列：按排序桶依次填入网格，并按最终顺序取快捷键。'}
            {' '}按钮超出可视行数后面板内滚动。
          </p>
        </Section>

        {isFixed
          ? <PanelFixedSlotsEditor value={layout.fixed.slots} tags={tags} actions={actions}
              onChange={slots => patchLayoutPart('fixed', { slots })} />
          : <PanelDynamicLayoutEditor value={layout.dynamic} tags={tags} actions={actions}
              onChange={dynamic => patchSection('layout', { dynamic })} />}
      </div>
    </div>
  );
}