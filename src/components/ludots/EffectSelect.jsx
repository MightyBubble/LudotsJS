import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NONE = '__none__';

export default function EffectSelect({ label, value, effects = [], onChange }) {
  const options = [...new Map(effects.map(effect => [effect.effect_id, effect])).values()].sort((a, b) => a.effect_id.localeCompare(b.effect_id));
  const missing = value && !options.some(effect => effect.effect_id === value);
  return <div>
    <label className="mb-1 block text-[11px] text-gray-400">{label}</label>
    <Select value={value || NONE} onValueChange={next => onChange(next === NONE ? '' : next)}>
      <SelectTrigger aria-label={label} className="h-8 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]"><SelectValue /></SelectTrigger>
      <SelectContent className="border-[#2A2E37] bg-[#15171C]">
        <SelectItem value={NONE} className="text-xs text-[#e5e5e5]">未设置</SelectItem>
        {missing && <SelectItem value={value} className="text-xs text-yellow-400">{value}（引用缺失）</SelectItem>}
        {options.map(effect => <SelectItem key={effect.effect_id} value={effect.effect_id} className="text-xs text-[#e5e5e5]">{effect.effect_id}<span className="ml-2 text-muted-foreground">{effect.presetType}</span></SelectItem>)}
      </SelectContent>
    </Select>
  </div>;
}