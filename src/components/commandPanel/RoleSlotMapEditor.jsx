import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Field, SelectField, TextField } from '@/components/ludots/ui';

export default function RoleSlotMapEditor({ value = [], slots = [], roles = [], onChange }) {
  const update = (index, next) => onChange(value.map((row, i) => (i === index ? { ...row, ...next } : row)));

  return (
    <Field label="语义 → 槽位" hint="聚合完成后才做落位；未列出的技能按下方兜底排序填空槽。">
      <div className="space-y-2">
        {value.map((row, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="w-32">
              {slots.length
                ? <SelectField label="槽位" value={row.slot} options={slots.map(s => ({ value: s, label: s }))}
                    onChange={slot => update(index, { slot })} />
                : <TextField label="槽位" value={row.slot} onChange={slot => update(index, { slot })} />}
            </div>
            <div className="flex-1">
              {roles.length
                ? <SelectField label="语义角色" value={row.role_id} options={roles.map(r => ({ value: r.role_id, label: r.label || r.role_id }))}
                    onChange={role_id => update(index, { role_id })} />
                : <TextField label="语义角色" value={row.role_id} onChange={role_id => update(index, { role_id })} />}
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 shrink-0"
              onClick={() => onChange(value.filter((_, i) => i !== index))}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button size="sm" className="bg-[#1E2128] h-7 text-xs"
          onClick={() => onChange([...value, { slot: slots[value.length] || '', role_id: '' }])}>
          <Plus className="w-3 h-3 mr-1" />添加映射
        </Button>
      </div>
    </Field>
  );
}