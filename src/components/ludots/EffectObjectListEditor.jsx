import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Section } from './ui';
import EffectFieldControl from './EffectFieldControl';

export default function EffectObjectListEditor({ title, value = [], fields, onChange, refs }) {
  const patch = (index, key, next) => onChange(value.map((row, i) => i === index ? { ...row, [key]: next } : row));
  return (
    <Section title={title} right={<button onClick={() => onChange([...value, {}])} className="flex items-center gap-1 text-xs text-[#E2D8B3]"><Plus className="w-3 h-3" />添加</button>}>
      {value.length === 0 && <p className="text-[11px] text-gray-600">未配置</p>}
      {value.map((row, index) => (
        <div key={index} className="border border-[#2A2E37] rounded p-2 space-y-2">
          <div className="flex justify-end"><button onClick={() => onChange(value.filter((_, i) => i !== index))} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
          {fields.map(field => <EffectFieldControl key={field.key} field={field} value={row[field.key]} onChange={(next) => patch(index, field.key, next)} refs={refs} />)}
        </div>
      ))}
    </Section>
  );
}