import React from 'react';
import { Section } from '@/components/ludots/ui';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';
import HotkeySequenceEditor from './HotkeySequenceEditor';

export default function PanelDynamicLayoutEditor({ draft, patch, tags = [], actions = [] }) {
  return (
    <Section title="动态排列">
      <GameplayTagListSelect label="排序优先级（自上而下）" value={draft.sort_tag_priority} tags={tags}
        onChange={sort_tag_priority => patch({ sort_tag_priority })} />
      <p className="text-[10px] text-gray-600">技能按命中的第一个标签在列表中的位置排列；都未命中的排在末尾。</p>
      <HotkeySequenceEditor label="快捷键序列" value={draft.hotkey_action_ids} actions={actions}
        onChange={hotkey_action_ids => patch({ hotkey_action_ids })}
        hint="按钮按落位顺序依次取键，用尽后不再分配" />
    </Section>
  );
}