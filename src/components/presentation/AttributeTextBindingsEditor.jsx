import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';
import AttributeTextBindingRow from './AttributeTextBindingRow';

export default function AttributeTextBindingsEditor({ value = [], refs, onChange }) {
  const add = () => onChange([...value, { attribute_id: '', slot: 'stat', label_token_ref: '', value_token_ref: '', display_mode: 'current', priority: 0 }]);
  return <Section title="Attribute → Text 映射" right={<Button type="button" size="sm" onClick={add} className="h-7 bg-[#1E2128]"><Plus />添加映射</Button>}>
    {value.length === 0 && <p className="text-[11px] text-gray-500">未配置属性文本映射。</p>}
    {value.map((row, index) => <AttributeTextBindingRow key={`${row.attribute_id}-${index}`} row={row} refs={refs} onChange={next => onChange(value.map((item, i) => i === index ? next : item))} onRemove={() => onChange(value.filter((_, i) => i !== index))} />)}
  </Section>;
}