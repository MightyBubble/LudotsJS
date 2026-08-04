import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BEHAVIOR_TEMPLATES } from '@/lib/quarks/quarksDocument';
export default function QuarksBehaviorsPanel({ value = [], onChange, onError }) {
  const [type, setType] = useState(Object.keys(BEHAVIOR_TEMPLATES)[0]);
  const edit = (index, text) => { try { const next = [...value]; next[index] = JSON.parse(text); onChange(next); onError(''); } catch { onError('行为 JSON 格式无效'); } };
  return <div className="space-y-2"><div className="flex gap-2"><select aria-label="行为类型" value={type} onChange={e => setType(e.target.value)} className="h-8 flex-1 rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs">{Object.keys(BEHAVIOR_TEMPLATES).map(name => <option key={name}>{name}</option>)}</select><Button size="sm" onClick={() => onChange([...value, structuredClone(BEHAVIOR_TEMPLATES[type])])} className="h-8"><Plus className="h-3 w-3"/>添加行为</Button></div>
    {value.map((behavior, index) => <div key={`${behavior.type}-${index}`} className="rounded border border-[#2A2E37] bg-[#15171C] p-2"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-medium text-gray-300">{behavior.type || 'CustomBehavior'}</span><button aria-label={`删除${behavior.type}`} onClick={() => onChange(value.filter((_, i) => i !== index))} className="text-gray-500 hover:text-red-400"><Trash2 className="h-3 w-3"/></button></div><Textarea aria-label={`${behavior.type} JSON`} key={JSON.stringify(behavior)} defaultValue={JSON.stringify(behavior, null, 2)} onBlur={e => edit(index, e.target.value)} className="min-h-28 border-[#424A55] bg-[#0D0F14] font-mono text-[10px]"/></div>)}
  </div>;
}