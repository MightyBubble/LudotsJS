import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';
import TagTextBindingRow from './TagTextBindingRow';

export default function TagTextBindingsEditor({ value = [], refs, onChange }) {
  const add = () => onChange([...value, { tag_id: '', slot: 'badge', text_token_ref: '', priority: 0 }]);
  return <Section title="Gameplay Tag → Text 映射" right={<Button type="button" size="sm" onClick={add} className="h-7 bg-[#1E2128]"><Plus />添加映射</Button>}>
    {value.length === 0 && <p className="text-[11px] text-gray-500">未配置 Tag 文本映射。</p>}
    {value.map((row, index) => <TagTextBindingRow key={`${row.tag_id}-${index}`} row={row} refs={refs} onChange={next => onChange(value.map((item, i) => i === index ? next : item))} onRemove={() => onChange(value.filter((_, i) => i !== index))} />)}
  </Section>;
}