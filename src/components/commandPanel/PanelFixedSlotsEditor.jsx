import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Section, SelectField, TextField } from '@/components/ludots/ui';

export default function PanelFixedSlotsEditor({ value = [], roles = [], actions = [], onChange }) {
  const patchAt = (i, patch) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <Section title="语义槽位（固定落位）" right={
      <Button size="sm" variant="outline" className="h-6 text-[10px]"
        onClick={() => onChange([...value, { slot_id: '', role_id: '' }])}>
        <Plus className="w-3 h-3 mr-1" />添加槽位
      </Button>
    }>
      {value.length === 0 && <p className="text-[10px] text-gray-600">还没有槽位。未命中条件的槽位会留空占位，不会塌缩。</p>}
      {value.map((slot, i) => (
        <div key={i} className="border border-[#2A2E37] rounded p-2 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <TextField label="物理槽位 ID" value={slot.slot_id}
                onChange={slot_id => patchAt(i, { slot_id })} hint="本面板内唯一，如 row0_col0" />
              <SelectField label="Ability Role" value={slot.role_id}
                options={roles.map(role => ({ value: role.role_id, label: role.label }))}
                onChange={role_id => patchAt(i, { role_id })} />
              <SelectField label="Input Action" value={slot.action_id}
                options={actions.map(a => ({ value: a.id, label: a.name || a.id }))}
                onChange={action_id => patchAt(i, { action_id })} />
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 mt-4 text-red-400"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-[10px] text-gray-500">运行时通过 Actor 原型的 role_bindings 解析技能；槽位不读取 Ability 的表现层标签。</p>
        </div>
      ))}
    </Section>
  );
}