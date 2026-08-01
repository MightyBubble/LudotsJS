import React from 'react';
import { Section } from '@/components/ludots/ui';
import HotkeySequenceEditor from './HotkeySequenceEditor';
import PanelSortBucketsEditor from './PanelSortBucketsEditor';

export default function PanelDynamicLayoutEditor({ value = {}, onChange, tags = [], actions = [] }) {
  const patch = update => onChange({ ...value, ...update });
  return (
    <Section title="动态排列">
      <PanelSortBucketsEditor value={value.buckets || []} tags={tags}
        onChange={buckets => patch({ buckets })} />
      <p className="text-[10px] text-gray-600">按钮进入首个命中的排序桶；未命中的排在末尾，同一桶内按 ability_id 保持稳定。</p>
      <div className="h-px bg-[#2A2E37]" />
      <HotkeySequenceEditor label="快捷键序列" value={value.hotkey_action_ids || []} actions={actions}
        onChange={hotkey_action_ids => patch({ hotkey_action_ids })}
        hint="按钮按最终落位顺序依次取键，用尽后不再分配" />
    </Section>
  );
}