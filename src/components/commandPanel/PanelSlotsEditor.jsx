import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { TextField, SelectField } from '@/components/ludots/ui';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';

export default function PanelSlotsEditor({ value = [], tags = [], actions = [], onChange }) {
  const patchAt = (i, patch) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-gray-400">固定槽位（留空 = 全部动态排列）</span>
        <Button size="sm" variant="outline" className="h-6 text-[10px]"
          onClick={() => onChange([...value, { slot_id: `slot_${value.length + 1}` }])}>
          <Plus className="w-3 h-3 mr-1" />添加槽位
        </Button>
      </div>
      <div className="space-y-2">
        {value.map((slot, i) => (
          <div key={i} className="border border-[#2A2E37] rounded p-2 space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <TextField label="槽位" value={slot.slot_id} onChange={slot_id => patchAt(i, { slot_id })} />
                <SelectField label="Input Action" value={slot.action_id}
                  options={actions.map(a => ({ value: a.id, label: a.name || a.id }))}
                  onChange={action_id => patchAt(i, { action_id })} />
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 mt-4 text-red-400"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <GameplayTagListSelect label="锁定条件：须命中" value={slot.required_all_tags} tags={tags}
              onChange={required_all_tags => patchAt(i, { required_all_tags })}
              hint="留空则该槽位不锁定，交给动态填充" />
            <GameplayTagListSelect label="锁定条件：排除" value={slot.blocked_any_tags} tags={tags}
              onChange={blocked_any_tags => patchAt(i, { blocked_any_tags })} />
          </div>
        ))}
      </div>
    </div>
  );
}