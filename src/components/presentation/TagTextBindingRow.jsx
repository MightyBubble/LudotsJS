import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NumberField, SelectField } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';

const slots = ['title', 'subtitle', 'body', 'badge', 'tooltip'].map(value => ({ value, label: value }));

export default function TagTextBindingRow({ row, refs, onChange, onRemove }) {
  const patch = data => onChange({ ...row, ...data });
  return <div className="grid gap-3 rounded border border-[#424a55] bg-[#0D0F14] p-3 sm:grid-cols-2 lg:grid-cols-4 items-end">
    <ReferenceSelect label="Gameplay Tag" value={row.tag_id} options={refs.tags} onChange={tag_id => patch({ tag_id })} />
    <SelectField label="输出槽位" value={row.slot || 'badge'} options={slots} onChange={slot => patch({ slot })} />
    <ReferenceSelect label="Text Token" value={row.text_token_ref} options={refs.tokens} onChange={text_token_ref => patch({ text_token_ref })} />
    <NumberField label="优先级" value={row.priority ?? 0} onChange={priority => patch({ priority })} />
    <div className="lg:col-start-4 flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={onRemove} className="text-red-400"><Trash2 />删除</Button></div>
  </div>;
}