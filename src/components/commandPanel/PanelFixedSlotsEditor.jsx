import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Section, SelectField, TextField } from '@/components/ludots/ui';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';

export default function PanelFixedSlotsEditor({ value = [], tags = [], actions = [], onChange }) {
  const patchAt = (i, patch) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <Section title="语义槽位（固定落位）" right={
      <Button size="sm" variant="outline" className="h-6 text-[10px]"
        onClick={() => onChange([...value, { slot_id: '' }])}>
        <Plus className="w-3 h-3 mr-1" />添加槽位
      </Button>
    }>
      {value.length === 0 && <p className="text-[10px] text-gray-600">还没有槽位。未命中条件的槽位会留空占位，不会塌缩。</p>}
      {value.map((slot, i) => (
        <div key={i} className="border border-[#2A2E37] rounded p-2 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <TextField label="槽位语义" value={slot.slot_id}
                onChange={slot_id => patchAt(i, { slot_id })} hint="本面板内唯一，如 primary" />
              <SelectField label="Input Action" value={slot.action_id}
                options={actions.map(a => ({ value: a.id, label: a.name || a.id }))}
                onChange={action_id => patchAt(i, { action_id })} />
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 mt-4 text-red-400"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <GameplayTagListSelect label="命中条件：须全部命中" value={slot.required_all_tags} tags={tags}
            onChange={required_all_tags => patchAt(i, { required_all_tags })} />
          <GameplayTagListSelect label="命中条件：排除" value={slot.blocked_any_tags} tags={tags}
            onChange={blocked_any_tags => patchAt(i, { blocked_any_tags })} />
        </div>
      ))}
    </Section>
  );
}