import React from 'react';
import { Ban, Box, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PrototypePlacementControls({ prototypes, selectedId, onSelect, onBegin, onCancel, onClear, count }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-[#2A2E37] bg-[#15171C] px-3 py-2">
    <span className="text-[11px] font-semibold text-[#E2D8B3]">Entity Prototype</span>
    <Select value={selectedId} onValueChange={onSelect}><SelectTrigger aria-label="放置 Entity Prototype" className="w-64 bg-[#0D0F14]"><SelectValue placeholder="选择原型" /></SelectTrigger><SelectContent>{prototypes.map(p => <SelectItem key={p.id} value={p.id}>{p.name} · {p.prototype_id}</SelectItem>)}</SelectContent></Select>
    <Button size="sm" onClick={onBegin} disabled={!selectedId}><Box className="mr-1 h-4 w-4" />进入放置</Button>
    <Button size="sm" variant="outline" onClick={onCancel}><Ban className="mr-1 h-4 w-4" />取消</Button>
    <Button size="sm" variant="outline" onClick={onClear}><Trash2 className="mr-1 h-4 w-4" />清空</Button>
    <span className="text-[11px] text-gray-500">Runtime Entities: {count} · 左键地面提交，右键取消</span>
  </div>;
}