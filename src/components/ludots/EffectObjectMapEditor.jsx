import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Section } from './ui';
import EffectFieldControl from './EffectFieldControl';

export default function EffectObjectMapEditor({ title, value = {}, fields, onChange, refs }) {
  const add = () => { const key = window.prompt('输入键名'); if (key?.trim() && !value[key.trim()]) onChange({ ...value, [key.trim()]: {} }); };
  const remove = (key) => { const next = { ...value }; delete next[key]; onChange(next); };
  const patch = (key, field, next) => onChange({ ...value, [key]: { ...value[key], [field]: next } });
  return (
    <Section title={title} action={<button onClick={add} className="flex items-center gap-1 text-xs text-[#E2D8B3]"><Plus className="w-3 h-3" />添加</button>}>
      {Object.keys(value).length === 0 && <p className="text-[11px] text-gray-600">未配置</p>}
      {Object.entries(value).map(([key, row]) => (
        <div key={key} className="border border-[#2A2E37] rounded p-2 space-y-2">
          <div className="flex justify-between text-xs text-[#E2D8B3]"><span>{key}</span><button onClick={() => remove(key)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
          {fields.map(field => <EffectFieldControl key={field.key} field={field} value={row?.[field.key]} onChange={(next) => patch(key, field.key, next)} refs={refs} />)}
        </div>
      ))}
    </Section>
  );
}