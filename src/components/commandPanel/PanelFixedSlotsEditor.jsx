import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Section, SelectField, TextField, NumberField } from '@/components/ludots/ui';

export default function PanelFixedSlotsEditor({ value = [], roles = [], actions = [], onChange }) {
  const patchAt = (i, patch) => onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <Section title="语义槽位（固定落位）" right={
      <Button size="sm" variant="outline" className="h-6 text-[10px]"
        onClick={() => onChange([...value, { slot_id: '', role_id: '', container_slot_index: null, action_id: '' }])}>
        <Plus className="w-3 h-3 mr-1" />添加槽位
      </Button>
    }>
      {value.length === 0 && <p className="text-[10px] text-gray-600">还没有槽位。槽位通过语义角色解析实体原型绑定的技能，未绑定时保留空位。</p>}
      {value.map((slot, i) => (
        <div key={i} className="border border-[#2A2E37] rounded p-2 space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 grid grid-cols-4 gap-2">
              <TextField label="展示槽位 ID" value={slot.slot_id}
                onChange={slot_id => patchAt(i, { slot_id })} hint="面板内唯一，如 cell_0_0" />
              <SelectField label="技能语义角色" value={slot.role_id}
                options={roles.map(role => ({ value: role.role_id, label: role.label ? `${role.role_id} · ${role.label}` : role.role_id }))}
                onChange={role_id => patchAt(i, { role_id })} hint="设计师意图，玩家不可改" />
              <NumberField label="容器槽位索引" value={slot.container_slot_index ?? ''}
                onChange={v => patchAt(i, { container_slot_index: v ?? null })}
                hint="玩家可换位容器：填了就忽略语义角色，读实体 container_slots" />
              <SelectField label="Input Action" value={slot.action_id}
                options={actions.map(a => ({ value: a.id, label: a.name || a.id }))}
                onChange={action_id => patchAt(i, { action_id })} />
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 mt-4 text-red-400"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </Section>
  );
}