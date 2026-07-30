import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContractFields from '@/components/input/contract/ContractFields';

export default function ContractArrayField({ field, value = [], onChange, refs }) {
  const patch = (index, next) => onChange(value.map((item, i) => i === index ? next : item));
  const add = () => onChange([...value, structuredClone(field.itemDefault || {})]);
  return <div className="space-y-2">
    <div className="flex items-center justify-between"><span className="text-[11px] text-[#E2D8B3]">{field.label} · {value.length}</span><Button type="button" size="sm" variant="outline" onClick={add}><Plus className="mr-1 h-3 w-3" />新建</Button></div>
    {value.map((item, index) => <div key={index} className="rounded border border-[#2A2E37] bg-[#15171C] p-3">
      <div className="mb-2 flex justify-between text-[10px] text-gray-500"><span>{field.itemLabel || 'Item'} {index + 1}</span><Button type="button" aria-label={`删除 ${field.label} ${index + 1}`} size="icon" variant="ghost" onClick={() => onChange(value.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button></div>
      <ContractFields fields={field.fields} value={item} onChange={next => patch(index, next)} refs={refs} />
    </div>)}
  </div>;
}