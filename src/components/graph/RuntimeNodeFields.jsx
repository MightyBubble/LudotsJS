import React from 'react';
import { Input } from '@/components/ui/input';

export default function RuntimeNodeFields({ fields, data, onChange }) {
  if (!fields?.length) return null;
  return (
    <div className="mb-2 space-y-1.5 border-b border-[#2A2E37] pb-2">
      {fields.map(field => (
        <label key={field.key} className="block">
          <span className="mb-0.5 block font-mono text-[9px] text-gray-500">{field.key}</span>
          {field.type === 'boolean' ? (
            <input type="checkbox" checked={Boolean(data[field.key])} onChange={e => onChange({ [field.key]: e.target.checked })} className="nodrag h-3.5 w-3.5 accent-primary" />
          ) : (
            <Input
              type={field.type === 'number' ? 'number' : 'text'}
              value={data[field.key] ?? field.defaultValue ?? ''}
              onChange={e => onChange({ [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
              className="nodrag h-6 border-[#434343] bg-[#2d2d30] px-2 font-mono text-[10px] text-white/90"
            />
          )}
        </label>
      ))}
    </div>
  );
}