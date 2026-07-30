import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AbilityCallerParamGroup({ index, group, onChange, onRemove }) {
  const entries = group.entries || [];
  const update = (entryIndex, next) => onChange({ entries: entries.map((entry, i) => i === entryIndex ? next : entry) });
  const add = () => onChange({ entries: [...entries, { key: '', value: '' }] });
  const remove = entryIndex => onChange({ entries: entries.filter((_, i) => i !== entryIndex) });
  return <div className="rounded-md border border-[#2A2E37] bg-[#0D0F14]">
    <div className="flex items-center justify-between border-b border-[#2A2E37] px-3 py-2">
      <span className="text-[11px] font-medium text-foreground">参数组 {index} <span className="ml-1 text-[9px] text-muted-foreground">Caller Params #{index}</span></span>
      <button onClick={onRemove} className="text-muted-foreground hover:text-red-400" aria-label={`删除参数组 ${index}`}><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
    <div className="space-y-2 p-3">{entries.map((entry, entryIndex) => <div key={entryIndex} className="grid grid-cols-[1fr_6rem_1fr_auto] gap-2">
      <Input aria-label={`参数组 ${index} 键 ${entryIndex + 1}`} value={entry.key || ''} placeholder="Key" onChange={e => update(entryIndex, { ...entry, key: e.target.value })} className="h-8 bg-[#15171C] text-xs" />
      <select value={typeof entry.value === 'number' ? 'number' : 'string'} onChange={e => update(entryIndex, { ...entry, value: e.target.value === 'number' ? Number(entry.value) || 0 : String(entry.value ?? '') })} className="h-8 rounded border border-input bg-[#15171C] px-2 text-xs text-foreground"><option value="string">String</option><option value="number">Number</option></select>
      <Input aria-label={`参数组 ${index} 值 ${entryIndex + 1}`} type={typeof entry.value === 'number' ? 'number' : 'text'} value={entry.value ?? ''} placeholder="Value" onChange={e => update(entryIndex, { ...entry, value: typeof entry.value === 'number' ? Number(e.target.value) : e.target.value })} className="h-8 bg-[#15171C] text-xs" />
      <button onClick={() => remove(entryIndex)} className="text-muted-foreground hover:text-red-400" aria-label={`删除参数 ${entryIndex + 1}`}><Trash2 className="h-3.5 w-3.5" /></button>
    </div>)}
      <button onClick={add} className="flex items-center gap-1 text-[10px] text-primary hover:text-foreground"><Plus className="h-3 w-3" />添加 Key / Value</button>
    </div>
  </div>;
}