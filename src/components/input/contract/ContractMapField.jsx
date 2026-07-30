import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ContractArrayField from '@/components/input/contract/ContractArrayField';

export default function ContractMapField({ field, value = {}, onChange, refs }) {
  const rename = (oldKey, key) => { const next = {}; Object.entries(value).forEach(([k,v]) => { next[k === oldKey ? key : k] = v; }); onChange(next); };
  const patch = (key, nextValue) => onChange({ ...value, [key]: nextValue });
  const remove = key => { const next = { ...value }; delete next[key]; onChange(next); };
  const add = () => { let key = field.keyPlaceholder || 'Key'; while (key in value) key += '_'; patch(key, field.valueType === 'array' ? [] : ''); };
  return <div className="space-y-2">
    <div className="flex items-center justify-between"><span className="text-[11px] text-[#E2D8B3]">{field.label} · {Object.keys(value).length}</span><Button type="button" size="sm" variant="outline" onClick={add}><Plus className="mr-1 h-3 w-3" />新建</Button></div>
    {Object.entries(value).map(([key, entry]) => <div key={key} className="rounded border border-[#2A2E37] bg-[#15171C] p-2">
      <div className="mb-2 flex gap-2"><Input aria-label={`${field.label} Key`} value={key} onChange={e => rename(key, e.target.value)} className="h-8 bg-[#0D0F14] text-xs" />{field.valueType === 'text' && <Input aria-label={`${field.label} Value`} value={entry || ''} onChange={e => patch(key, e.target.value)} className="h-8 bg-[#0D0F14] text-xs" />}<Button type="button" size="icon" variant="ghost" onClick={() => remove(key)}><Trash2 className="h-4 w-4" /></Button></div>
      {field.valueType === 'array' && <ContractArrayField field={{ ...field, label: key }} value={entry} onChange={next => patch(key, next)} refs={refs} />}
    </div>)}
  </div>;
}