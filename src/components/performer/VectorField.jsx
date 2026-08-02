import React from 'react';
import { NumberField } from '@/components/ludots/ui';

/** 定长数值向量编辑（localOffset / localScale / 四元数等）。 */
export default function VectorField({ label, value = [], length = 3, onChange }) {
  const labels = length === 4 ? ['X', 'Y', 'Z', 'W'] : ['X', 'Y', 'Z'];
  const set = (i, v) => {
    const next = Array.from({ length }, (_, idx) => Number(idx === i ? v : (value[idx] ?? 0)));
    onChange(next);
  };
  return <div>
    <p className="text-[11px] text-gray-400 mb-1">{label}</p>
    <div className={`grid gap-2 ${length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {labels.map((l, i) => <NumberField key={l} label={l} value={value[i] ?? 0} onChange={v => set(i, v)} />)}
    </div>
  </div>;
}