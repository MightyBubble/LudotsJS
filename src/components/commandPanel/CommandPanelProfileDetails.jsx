import React from 'react';
import { Section, NumberField, TextField, BoolField, SelectField } from '@/components/ludots/ui';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';
import PanelFixedSlotsEditor from './PanelFixedSlotsEditor';
import PanelDynamicLayoutEditor from './PanelDynamicLayoutEditor';

export default function CommandPanelProfileDetails({
  draft, patch, tags = [], actions = [], sortKeys = [], slotKeys = [], hotkeySequences = [],
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
        <TextField label="Actor 集合键" value={draft.actor_collection_key}
          onChange={actor_collection_key => patch({ actor_collection_key })}
          hint="由 ControlPlane 查询图输出" />
        <div className="grid grid-cols-2 gap-2">
          <SelectField label="Actor 排序规则" value={draft.actor_sort_key}
            options={sortKeys.map(k => ({ value: k, label: k }))}
            onChange={actor_sort_key => patch({ actor_sort_key })} hint="在全局常量中维护" />
          <NumberField label="Actor 上限" value={draft.max_actors} onChange={max_actors => patch({ max_actors })}
            hint="1 = 只看排序后的第一个单位；留空为全体" />
        </div>
      </Section>

      <Section title="过滤：面板收哪些技能">
        <GameplayTagListSelect label="须全部命中" value={draft.required_all_tags} tags={tags}
          onChange={required_all_tags => patch({ required_all_tags })} />
        <GameplayTagListSelect label="排除" value={draft.blocked_any_tags} tags={tags}
          onChange={blocked_any_tags => patch({ blocked_any_tags })} />
      </Section>

      <Section title="聚合：多个 Actor 的技能怎么合并">
        <BoolField label="聚合成一个按钮（关闭则每个 Actor 的技能各自成独立按钮）"
          value={draft.aggregate} onChange={aggregate => patch({ aggregate })} />
        <GameplayTagListSelect label="聚合身份维度" value={draft.aggregate_key_tags} tags={tags}
          onChange={aggregate_key_tags => patch({ aggregate_key_tags })}
          hint="取技能标签中落在这些维度下的部分作为聚合 key，key 相同即同一按钮；留空则按 ability_id 判等" />
      </Section>

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