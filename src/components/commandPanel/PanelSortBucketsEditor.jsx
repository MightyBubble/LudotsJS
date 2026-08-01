import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';

export default function PanelSortBucketsEditor({ value = [], tags = [], onChange }) {
  const patchAt = (i, patch) => onChange(value.map((rule, n) => n === i ? { ...rule, ...patch } : rule));
  const move = (i, offset) => {
    const next = [...value];
    [next[i], next[i + offset]] = [next[i + offset], next[i]];
    onChange(next);
  };
  return <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-gray-400">排序桶（自上而下）</span>
      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => onChange([...value, { required_all_tags: [], blocked_any_tags: [] }])}>
        <Plus className="w-3 h-3 mr-1" />添加排序桶
      </Button>
    </div>
    {!value.length && <p className="text-[10px] text-gray-600">没有排序桶时，按钮按 ability_id 保持稳定顺序。</p>}
    {value.map((rule, i) => <div key={i} className="border border-[#2A2E37] rounded p-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">优先级 #{i + 1} · 首个命中桶生效</span>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={!i} onClick={() => move(i, -1)}><ChevronUp className="w-3 h-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={i === value.length - 1} onClick={() => move(i, 1)}><ChevronDown className="w-3 h-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400" onClick={() => onChange(value.filter((_, n) => n !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
      </div>
      <GameplayTagListSelect label="须全部命中" value={rule.required_all_tags} tags={tags} onChange={required_all_tags => patchAt(i, { required_all_tags })} />
      <GameplayTagListSelect label="排除任一命中" value={rule.blocked_any_tags} tags={tags} onChange={blocked_any_tags => patchAt(i, { blocked_any_tags })} />
    </div>)}
  </div>;
}