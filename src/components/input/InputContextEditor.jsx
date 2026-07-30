import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import InputBindingEditor from '@/components/input/InputBindingEditor';

export default function InputContextEditor({ contexts = [], actions, onChange }) {
  const patch = (i, data) => onChange(contexts.map((c, n) => n === i ? { ...c, ...data } : c));
  return <div className="space-y-3">{contexts.map((context, i) => <div key={`${context.id}-${i}`} className="space-y-2 rounded border border-[#2A2E37] bg-[#15171C] p-3">
    <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_100px_30px]">
      <Input aria-label={`Context ${i + 1} ID`} value={context.id || ''} onChange={e => patch(i, { id: e.target.value })} placeholder="Context ID" className="h-8 bg-[#0D0F14] text-xs" />
      <Input aria-label={`Context ${i + 1} 名称`} value={context.name || ''} onChange={e => patch(i, { name: e.target.value })} placeholder="Name" className="h-8 bg-[#0D0F14] text-xs" />
      <Input aria-label={`Context ${i + 1} 优先级`} type="number" value={context.priority ?? 0} onChange={e => patch(i, { priority: Number(e.target.value) })} className="h-8 bg-[#0D0F14] text-xs" />
      <Button aria-label={`删除 Context ${i + 1}`} size="icon" variant="ghost" onClick={() => onChange(contexts.filter((_, n) => n !== i))}><Trash2 className="h-4 w-4" /></Button>
    </div>
    {(context.bindings || []).map((binding, n) => <InputBindingEditor key={n} binding={binding} actions={actions} onChange={next => patch(i, { bindings: context.bindings.map((b, x) => x === n ? next : b) })} onDelete={() => patch(i, { bindings: context.bindings.filter((_, x) => x !== n) })} />)}
    <Button size="sm" variant="outline" onClick={() => patch(i, { bindings: [...(context.bindings || []), { actionId: actions[0]?.id || '', path: '', processors: [], interactions: [] }] })}><Plus className="mr-1 h-4 w-4" />新增 Binding</Button>
  </div>)}
    <Button size="sm" variant="outline" onClick={() => onChange([...contexts, { id: `Context${contexts.length + 1}`, name: '', priority: 0, bindings: [] }])}><Plus className="mr-1 h-4 w-4" />新增 Context</Button>
  </div>;
}