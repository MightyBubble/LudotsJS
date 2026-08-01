import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Field, SelectField } from '@/components/ludots/ui';

export default function HotkeySequenceEditor({ label, value = [], actions = [], onChange, hint }) {
  const options = actions.map(a => ({ value: a.id, label: a.name || a.id }));

  return (
    <Field label={label} hint={hint}>
      <div className="space-y-1">
        {value.length === 0 && <p className="text-[10px] text-gray-600">还没有按键，按钮不会分配快捷键。</p>}
        {value.map((actionId, i) => (
          <div key={i} className="flex items-end gap-2">
            <span className="text-[10px] text-gray-500 w-8 pb-2">#{i + 1}</span>
            <div className="flex-1">
              <SelectField label="" value={actionId} options={options}
                onChange={next => onChange(value.map((v, idx) => (idx === i ? next : v)))} />
            </div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => onChange([...value, ''])}>
          <Plus className="w-3 h-3 mr-1" />添加按键
        </Button>
        {!actions.length && <p className="text-[10px] text-gray-500">请先在 Input Config 中定义 action。</p>}
      </div>
    </Field>
  );
}