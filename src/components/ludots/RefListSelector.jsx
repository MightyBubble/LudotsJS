import React from 'react';
import { X, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/** 引用选择器：从 options 中多选 id 列表 */
export default function RefListSelector({ label, value = [], options = [], onChange, emptyText = '暂无引用' }) {
  const uniqueOptions = [...new Map(options.map(option => [option.value, option])).values()];
  const available = uniqueOptions.filter(option => !(value || []).includes(option.value));

  return (
    <div>
      <label className="text-[11px] text-gray-400 mb-1 block">{label}</label>
      <div className="space-y-1 mb-2">
        {(value || []).length === 0 && <p className="text-[11px] text-gray-600">{emptyText}</p>}
        {(value || []).map(id => (
          <div key={id} className="flex items-center justify-between bg-[#0D0F14] border border-[#2A2E37] rounded px-2 py-1">
            <span className="text-[11px] text-gray-300">{uniqueOptions.find(option => option.value === id)?.label || id}</span>
            <button onClick={() => onChange(value.filter(v => v !== id))} className="text-gray-500 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <Select value="" onValueChange={(v) => onChange([...(value || []), v])}>
        <SelectTrigger aria-label={label} className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5] h-7 text-[11px]">
          <SelectValue placeholder={<span className="flex items-center gap-1"><Plus className="w-3 h-3" />添加引用</span>} />
        </SelectTrigger>
        <SelectContent className="bg-[#15171C] border-[#2A2E37]">
          {available.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-[#e5e5e5] text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}