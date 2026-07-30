import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TYPES = ['Button', 'Axis1D', 'Axis2D', 'Axis3D'];
export default function InputActionEditor({ actions = [], onChange }) {
  const patch = (i, data) => onChange(actions.map((a, n) => n === i ? { ...a, ...data } : a));
  return <div className="space-y-2">
    {actions.map((action, i) => <div key={`${action.id}-${i}`} className="grid grid-cols-1 gap-2 rounded border border-[#2A2E37] bg-[#15171C] p-2 md:grid-cols-[1fr_1fr_120px_30px]">
      <Input aria-label={`Action ${i + 1} ID`} value={action.id || ''} onChange={e => patch(i, { id: e.target.value })} placeholder="Action ID" className="h-8 bg-[#0D0F14] text-xs" />
      <Input aria-label={`Action ${i + 1} 名称`} value={action.name || ''} onChange={e => patch(i, { name: e.target.value })} placeholder="Name" className="h-8 bg-[#0D0F14] text-xs" />
      <Select value={action.type || 'Button'} onValueChange={type => patch(i, { type })}><SelectTrigger aria-label={`Action ${i + 1} 类型`} className="h-8 bg-[#0D0F14] text-xs"><SelectValue /></SelectTrigger><SelectContent>{TYPES.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select>
      <Button aria-label={`删除 Action ${i + 1}`} size="icon" variant="ghost" onClick={() => onChange(actions.filter((_, n) => n !== i))}><Trash2 className="h-4 w-4" /></Button>
    </div>)}
    <Button size="sm" variant="outline" onClick={() => onChange([...actions, { id: `Action${actions.length + 1}`, name: '', type: 'Button' }])}><Plus className="mr-1 h-4 w-4" />新增 Action</Button>
  </div>;
}