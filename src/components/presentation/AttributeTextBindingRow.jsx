import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberField, SelectField } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';

const slots = ['stat', 'badge', 'body', 'tooltip'].map(value => ({ value, label: value }));
const modes = ['current', 'current_over_base', 'integer', 'decimal'].map(value => ({ value, label: value }));

export default function AttributeTextBindingRow({ row, onChange, onRemove, refs }) {
  const patch = data => onChange({ ...row, ...data });
  return <div className="grid gap-3 rounded border border-[#424a55] bg-[#0D0F14] p-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
    <ReferenceSelect label="Attribute" value={row.attribute_id} options={refs.attributes} onChange={attribute_id => patch({ attribute_id })} />
    <SelectField label="输出槽位" value={row.slot || 'stat'} options={slots} onChange={slot => patch({ slot })} />
    <ReferenceSelect label="标签 Token" value={row.label_token_ref} options={refs.tokens} onChange={label_token_ref => patch({ label_token_ref })} />
    <ReferenceSelect label="数值 Token" value={row.value_token_ref} options={refs.tokens} onChange={value_token_ref => patch({ value_token_ref })} />
    <SelectField label="数值格式" value={row.display_mode || 'current'} options={modes} onChange={display_mode => patch({ display_mode })} />
    <NumberField label="优先级" value={row.priority ?? 0} onChange={priority => patch({ priority })} />
    <div className="lg:col-start-4 flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={onRemove} className="text-red-400"><Trash2 />删除</Button></div>
  </div>;
}