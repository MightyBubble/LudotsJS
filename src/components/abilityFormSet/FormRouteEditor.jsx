import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';
import { NumberField, ListField } from '@/components/ludots/ui';

const inputCls = 'bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5] h-8 text-xs';

export default function FormRouteEditor({ route, index, abilities, onChange, onRemove }) {
  const overrides = route.slotOverrides || [];
  const patch = (p) => onChange({ ...route, ...p });
  const patchOverride = (i, p) => patch({ slotOverrides: overrides.map((o, k) => (k === i ? { ...o, ...p } : o)) });

  return (
    <div className="border border-[#2A2E37] rounded p-3 space-y-3 bg-[#0D0F14]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-400">路由 {index}</span>
        <Button size="sm" variant="ghost" onClick={onRemove} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ListField label="requiredAll（全部持有才匹配）" value={route.requiredAll} onChange={(v) => patch({ requiredAll: v })} />
        <ListField label="blockedAny（持有任一则不匹配）" value={route.blockedAny} onChange={(v) => patch({ blockedAny: v })} />
        <NumberField label="priority（越大越优先）" value={route.priority} onChange={(v) => patch({ priority: v ?? 0 })} />
      </div>
      <div className="space-y-2">
        <span className="text-[11px] text-gray-400">slotOverrides（命中后覆盖的槽位，至少一项，槽位不可重复）</span>
        {overrides.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input type="number" value={o.slotIndex ?? 0} onChange={(e) => patchOverride(i, { slotIndex: Number(e.target.value) })} className={`${inputCls} w-20`} />
            <select value={o.abilityId || ''} onChange={(e) => patchOverride(i, { abilityId: e.target.value })}
              className="flex-1 bg-[#0D0F14] border border-[#2A2E37] text-[#e5e5e5] h-8 text-xs rounded px-2">
              <option value="">选择技能…</option>
              {abilities.map(a => <option key={a.ability_id} value={a.ability_id}>{a.ability_id}</option>)}
            </select>
            <Button size="sm" variant="ghost" onClick={() => patch({ slotOverrides: overrides.filter((_, k) => k !== i) })} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => patch({ slotOverrides: [...overrides, { slotIndex: overrides.length, abilityId: '' }] })} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />添加槽位覆盖
        </Button>
      </div>
    </div>
  );
}