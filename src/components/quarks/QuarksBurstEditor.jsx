import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QuarksBurstEditor({ value = [], onChange }) {
  const patch = (index, field, next) => onChange(value.map((item, i) => i === index ? { ...item, [field]: Number(next) } : item));
  return <div className="space-y-2"><div className="flex items-center justify-between"><span className="text-[10px] text-gray-400">爆发</span><Button size="sm" onClick={() => onChange([...value, { time: 0, count: 10, cycleCount: 1, probability: 1 }])} className="h-6 px-2"><Plus className="h-3 w-3"/>添加</Button></div>
    {value.map((item, index) => <div key={index} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-1 rounded border border-[#2A2E37] p-2">{[['time','时间'],['count','数量'],['cycleCount','循环'],['probability','概率']].map(([field,label]) => <label key={field} className="text-[9px] text-gray-500">{label}<input aria-label={`爆发${index + 1}${label}`} type="number" step="any" value={item[field] ?? (field === 'probability' ? 1 : 0)} onChange={e => patch(index, field, e.target.value)} className="mt-1 h-7 w-full rounded border border-[#424A55] bg-[#0D0F14] px-1 text-xs"/></label>)}<button aria-label={`删除爆发${index + 1}`} onClick={() => onChange(value.filter((_, i) => i !== index))} className="mt-4 text-gray-500 hover:text-red-400"><Trash2 className="h-3 w-3"/></button></div>)}
  </div>;
}