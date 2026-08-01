import React from 'react';
import { Section, NumberField, TextField, BoolField } from '@/components/ludots/ui';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';
import PanelSlotsEditor from './PanelSlotsEditor';

export default function CommandPanelProfileDetails({ draft, patch, tags = [], actions = [] }) {
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

      <Section title="面板收哪些技能">
        <GameplayTagListSelect label="须命中标签" value={draft.required_all_tags} tags={tags}
          onChange={required_all_tags => patch({ required_all_tags })} />
        <GameplayTagListSelect label="排除标签" value={draft.blocked_any_tags} tags={tags}
          onChange={blocked_any_tags => patch({ blocked_any_tags })} />
        <BoolField label="聚合显示（集合内多个实体的同一技能合成一个按钮；关闭则每个实体各自平铺）"
          value={draft.aggregate} onChange={aggregate => patch({ aggregate })} />
      </Section>

      <Section title="排列">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="每行按钮数" value={draft.columns} onChange={columns => patch({ columns })} />
          <NumberField label="行数" value={draft.rows} onChange={rows => patch({ rows })}
            hint="留空 = 超出一行自动换行、不限行数" />
        </div>
        <TextField label="动态排序规则" value={draft.fallback_sort} onChange={fallback_sort => patch({ fallback_sort })}
          hint="未被固定槽位锁定的技能按此顺序填入剩余位置。" />
        <PanelSlotsEditor value={draft.slots || []} tags={tags} actions={actions}
          onChange={slots => patch({ slots })} />
      </Section>
    </>
  );
}