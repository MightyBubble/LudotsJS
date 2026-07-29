import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NONE = '__none__';

export default function GameplayTagSelect({ label, value, tags = [], onChange }) {
  const options = [...tags].sort((a, b) => a.full_path.localeCompare(b.full_path));

  return (
    <div>
      <label className="text-[11px] text-gray-400 mb-1 block">{label}</label>
      <Select value={value || NONE} onValueChange={(next) => onChange(next === NONE ? '' : next)}>
        <SelectTrigger className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5] h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#15171C] border-[#2A2E37]">
          <SelectItem value={NONE} className="text-[#e5e5e5] text-xs">未设置</SelectItem>
          {options.map(tag => (
            <SelectItem key={tag.full_path} value={tag.full_path} className="text-[#e5e5e5] text-xs">
              {tag.full_path}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}