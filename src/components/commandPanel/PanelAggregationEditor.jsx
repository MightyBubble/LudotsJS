import React from 'react';
import { Section, BoolField } from '@/components/ludots/ui';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';

export default function PanelAggregationEditor({ draft, patch, tags = [] }) {
  const rules = draft.aggregate_rules || [];
  const patchAt = (i, p) => patch({ aggregate_rules: rules.map((r, idx) => idx === i ? { ...r, ...p } : r) });

  return (
    <Section
      title="聚合：多个 Actor 的技能怎么合并"
      right={
        <Button size="sm" variant="outline" className="h-6 text-[11px]"
          onClick={() => patch({ aggregate_rules: [...rules, { match_all_tags: [], aggregate: true, aggregate_key_tags: [] }] })}>
          <Plus className="w-3 h-3 mr-1" />添加覆盖规则
        </Button>
      }
    >
      <div className="border border-[#2A2E37] rounded p-2 space-y-2">
        <div className="text-[10px] text-gray-500">默认（未被下方规则命中的技能）</div>
        <BoolField label="聚合成一个按钮（关闭则每个 Actor 的技能各自成独立按钮）"
          value={draft.aggregate} onChange={aggregate => patch({ aggregate })} />
        <GameplayTagListSelect label="聚合身份维度" value={draft.aggregate_key_tags} tags={tags}
          onChange={aggregate_key_tags => patch({ aggregate_key_tags })}
          hint="取技能标签中落在这些维度下的部分作为聚合 key，key 相同即同一按钮；留空则按 ability_id 判等" />
      </div>

      {rules.length === 0 && <p className="text-[10px] text-gray-600">同一面板内需要区分合并与不合并时，按标签添加覆盖规则；先命中先生效</p>}

      {rules.map((rule, i) => (
        <div key={i} className="border border-[#2A2E37] rounded p-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">覆盖规则 #{i + 1}</span>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
              onClick={() => patch({ aggregate_rules: rules.filter((_, idx) => idx !== i) })}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <GameplayTagListSelect label="命中条件：技能须全部带这些标签" value={rule.match_all_tags} tags={tags}
            onChange={match_all_tags => patchAt(i, { match_all_tags })} />
          <BoolField label="聚合成一个按钮" value={rule.aggregate} onChange={aggregate => patchAt(i, { aggregate })} />
          <GameplayTagListSelect label="聚合身份维度" value={rule.aggregate_key_tags} tags={tags}
            onChange={aggregate_key_tags => patchAt(i, { aggregate_key_tags })} />
        </div>
      ))}
    </Section>
  );
}