import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JsonArrayField from '@/components/input/JsonArrayField';

export default function InputBindingEditor({ binding, actions, onChange, onDelete }) {
  return <div className="space-y-2 rounded border border-[#2A2E37] bg-[#0D0F14] p-2">
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_1fr_30px]">
      <Select value={binding.actionId || ''} onValueChange={actionId => onChange({ ...binding, actionId })}><SelectTrigger aria-label="绑定 Action" className="h-8 text-xs"><SelectValue placeholder="Action" /></SelectTrigger><SelectContent>{actions.map(a => <SelectItem key={a.id} value={a.id}>{a.id}</SelectItem>)}</SelectContent></Select>
      <Input aria-label="物理输入路径" value={binding.path || ''} onChange={e => onChange({ ...binding, path: e.target.value })} placeholder="<Keyboard>/w" className="h-8 text-xs" />
      <Input aria-label="组合输入类型" value={binding.compositeType || ''} onChange={e => onChange({ ...binding, compositeType: e.target.value })} placeholder="CompositeType" className="h-8 text-xs" />
      <Button aria-label="删除 Binding" size="icon" variant="ghost" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
    </div>
    <div className="grid gap-2 xl:grid-cols-3">
      <JsonArrayField label="compositeParts" value={binding.compositeParts} onChange={compositeParts => onChange({ ...binding, compositeParts })} />
      <JsonArrayField label="processors" value={binding.processors} onChange={processors => onChange({ ...binding, processors })} />
      <JsonArrayField label="interactions" value={binding.interactions} onChange={interactions => onChange({ ...binding, interactions })} />
    </div>
  </div>;
}