import React from 'react';

export default function QuarksValueField({ label, value, onChange }) {
  const current = value || { type: 'ConstantValue', value: 0 };
  const interval = current.type === 'IntervalValue';
  const setType = type => onChange(type === 'IntervalValue' ? { type, a: Number(current.value ?? 0), b: Number(current.value ?? 1) } : { type, value: Number(current.a ?? current.value ?? 0) });
  return <div className="space-y-1"><label className="text-[10px] text-gray-400">{label}</label><div className="flex gap-1">
    <select aria-label={`${label}类型`} value={interval ? 'IntervalValue' : 'ConstantValue'} onChange={e => setType(e.target.value)} className="h-7 w-24 rounded border border-[#424A55] bg-[#0D0F14] px-1 text-[10px] text-gray-300"><option value="ConstantValue">常量</option><option value="IntervalValue">区间</option></select>
    {interval ? <><input aria-label={`${label}最小值`} type="number" step="any" value={current.a ?? 0} onChange={e => onChange({ ...current, a: Number(e.target.value) })} className="h-7 min-w-0 flex-1 rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs"/><input aria-label={`${label}最大值`} type="number" step="any" value={current.b ?? 1} onChange={e => onChange({ ...current, b: Number(e.target.value) })} className="h-7 min-w-0 flex-1 rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs"/></> : <input aria-label={label} type="number" step="any" value={current.value ?? 0} onChange={e => onChange({ ...current, value: Number(e.target.value) })} className="h-7 min-w-0 flex-1 rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs"/>}
  </div></div>;
}