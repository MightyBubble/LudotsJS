import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import GameplayTagSelect from './GameplayTagSelect';

export default function GameplayTagListSelect({ label, value = [], tags = [], onChange, hint }) {
  const setAt = (i, next) => onChange(value.map((v, idx) => (idx === i ? next : v)).filter(Boolean));

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[11px] text-gray-400">{label}</label>
        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => onChange([...value, ''])}>
          <Plus className="w-3 h-3 mr-1" />添加标签
        </Button>
      </div>
      {value.length === 0 && <p className="text-[10px] text-gray-600">未设置</p>}
      <div className="space-y-1">
        {value.map((tag, i) => (
          <div key={i} className="flex items-end gap-1">
            <div className="flex-1"><GameplayTagSelect value={tag} tags={tags} onChange={next => setAt(i, next)} /></div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
      {hint && <p className="text-[10px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}