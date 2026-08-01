import React from 'react';
import { Section, SelectField } from '@/components/ludots/ui';

export default function PanelDynamicLayoutEditor({ draft, patch, sortKeys = [], hotkeySequences = [] }) {
  return (
    <Section title="动态排列">
      <SelectField label="排序规则" value={draft.sort_key}
        options={sortKeys.map(k => ({ value: k, label: k }))}
        onChange={sort_key => patch({ sort_key })} hint="按钮按此顺序填入网格；在全局常量中维护" />
      <SelectField label="快捷键序列" value={draft.hotkey_sequence_ref}
        options={hotkeySequences.map(k => ({ value: k, label: k }))}
        onChange={hotkey_sequence_ref => patch({ hotkey_sequence_ref })}
        hint="有序 action 序列（如 Q W E R），按钮按落位顺序依次取键" />
    </Section>
  );
}