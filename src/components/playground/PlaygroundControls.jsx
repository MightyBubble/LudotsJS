import React from 'react';
import { RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PlaygroundControls({ abilities, selectedId, onSelect, onCast, onReset }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-[#2A2E37] bg-[#15171C] p-3">
    <Select value={selectedId} onValueChange={onSelect}><SelectTrigger aria-label="测试 Ability" className="w-72 bg-[#0D0F14]"><SelectValue placeholder="选择 Ability" /></SelectTrigger><SelectContent>{abilities.map(a => <SelectItem key={a.id} value={a.id}>{a.presentation?.displayName || a.ability_id}</SelectItem>)}</SelectContent></Select>
    <Button onClick={onCast} disabled={!selectedId}><Zap className="mr-1 h-4 w-4" />施放</Button>
    <Button variant="outline" onClick={onReset}><RotateCcw className="mr-1 h-4 w-4" />重置</Button>
    <span className="text-[11px] text-gray-500">右键地面移动；进入范围后施放，按 Exec tick 输出事件。</span>
  </div>;
}