import React from 'react';
import { Input } from '@/components/ui/input';
import { getLudotsFieldText } from './ludotsNodeI18n';

export default function RuntimeNodeFields({ fields, data, onChange, locale, optionSets = {} }) {
  if (!fields?.length) return null;
  return (
    <div className="mb-2 space-y-1.5 border-b border-[#2A2E37] pb-2">
      {fields.map(field => {
        const value = data[field.key] ?? field.defaultValue ?? '';
        const sourceOptions = field.optionsSource ? optionSets[field.optionsSource] || [] : field.options || [];
        const options = value && !sourceOptions.some(option => option.value === value)
          ? [{ value, label: `${value} · 已失效` }, ...sourceOptions]
          : sourceOptions;
        return (
          <label key={field.key} className="block">
            <span className="mb-0.5 block font-mono text-[9px] text-gray-500">{getLudotsFieldText(field.key, locale)}</span>
            {field.type === 'boolean' ? (
              <input type="checkbox" checked={Boolean(value)} onChange={e => onChange({ [field.key]: e.target.checked })} className="nodrag h-3.5 w-3.5 accent-primary" />
            ) : field.type === 'select' ? (
              <select value={value} onChange={e => onChange({ [field.key]: e.target.value })} className="nodrag h-6 w-full rounded border border-[#434343] bg-[#2d2d30] px-1 font-mono text-[10px] text-white/90">
                {!value && <option value="" disabled>{field.placeholder || '请选择'}</option>}
                {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            ) : (
              <Input
                type={field.type === 'number' ? 'number' : 'text'}
                value={value}
                onChange={e => onChange({ [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                className="nodrag h-6 border-[#434343] bg-[#2d2d30] px-2 font-mono text-[10px] text-white/90"
              />
            )}
          </label>
        );
      })}
    </div>
  );
}