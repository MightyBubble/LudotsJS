import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function Section({ title, right, children }) {
  return (
    <div className="bg-[#15171C] border border-[#2A2E37] rounded mb-3">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2E37]">
        <span className="text-xs font-semibold text-[#E2D8B3]">{title}</span>
        {right}
      </div>
      <div className="p-3 space-y-3">{children}</div>
    </div>
  );
}

export function Field({ label, hint, helpIndex, children }) {
  return (
    <div>
      <label className="text-[11px] text-gray-400 mb-1 flex items-center gap-1.5">{helpIndex && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-[#303845] px-1 text-[9px] text-[#dce2e8]">{helpIndex}</span>}{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-600 mt-1">{hint}</p>}
    </div>
  );
}

const inputCls = "bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5] h-8 text-xs";

export function TextField({ label, value, onChange, placeholder, hint, helpIndex }) {
  return (
    <Field label={label} hint={hint} helpIndex={helpIndex}>
      <Input aria-label={label} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </Field>
  );
}

export function NumberField({ label, value, onChange, hint, helpIndex }) {
  return (
    <Field label={label} hint={hint} helpIndex={helpIndex}>
      <Input aria-label={label} type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} className={inputCls} />
    </Field>
  );
}

export function SelectField({ label, value, options, onChange, hint, helpIndex }) {
  return (
    <Field label={label} hint={hint} helpIndex={helpIndex}>
      <Select value={value ?? ''} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className={inputCls}><SelectValue placeholder="未设置" /></SelectTrigger>
        <SelectContent className="bg-[#15171C] border-[#2A2E37]">
          {options.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-[#e5e5e5] text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function ListField({ label, value = [], onChange, hint, helpIndex }) {
  return (
    <Field label={label} hint={hint || '多个值用逗号分隔'} helpIndex={helpIndex}>
      <Input
        aria-label={label}
        value={(value || []).join(', ')}
        onChange={(e) => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        className={inputCls}
      />
    </Field>
  );
}

export function BoolField({ label, value, onChange, helpIndex }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="accent-[#D97706]" />
      {helpIndex && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-[#303845] px-1 text-[9px] text-[#dce2e8]">{helpIndex}</span>}
      <span className="text-[11px] text-gray-300">{label}</span>
    </label>
  );
}