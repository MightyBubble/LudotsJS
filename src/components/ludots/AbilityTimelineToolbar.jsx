import React, { useState } from 'react';
import { Plus, ZoomIn, ZoomOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIMELINE_KINDS } from './abilityTimelineModel';

export default function AbilityTimelineToolbar({ count, zoom, onZoom, onAdd }) {
  const [kind, setKind] = useState('EffectClip');
  return <div className="flex flex-wrap items-center gap-2 border-b border-[#2A2E37] bg-[#0D0F14] px-3 py-2">
    <Select value={kind} onValueChange={setKind}>
      <SelectTrigger className="h-7 w-44 border-[#2A2E37] bg-[#15171C] text-[11px]"><SelectValue /></SelectTrigger>
      <SelectContent className="border-[#2A2E37] bg-[#15171C]">
        {TIMELINE_KINDS.map(value => <SelectItem key={value} value={value} className="text-xs text-foreground">{value}</SelectItem>)}
      </SelectContent>
    </Select>
    <button disabled={count >= 16} onClick={() => onAdd(kind)} className="flex h-7 items-center gap-1 rounded border border-primary bg-primary px-2 text-[11px] text-primary-foreground disabled:opacity-40"><Plus className="h-3 w-3" />添加</button>
    <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground"><span>{count}/16</span>
      <button aria-label="缩小时间轴" onClick={() => onZoom(Math.max(4, zoom - 2))} className="rounded border border-[#2A2E37] p-1"><ZoomOut className="h-3.5 w-3.5" /></button>
      <button aria-label="放大时间轴" onClick={() => onZoom(Math.min(20, zoom + 2))} className="rounded border border-[#2A2E37] p-1"><ZoomIn className="h-3.5 w-3.5" /></button>
      <span className="w-8 text-center">{zoom}px</span>
    </div>
  </div>;
}