import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, TextField, NumberField, SelectField } from '@/components/ludots/ui';
import VectorField from './VectorField';

const LANES = ['Float', 'Int', 'Vector'];

export default function PerformerParamsSection({ paramDefaults = [], onChangeParams }) {
  const patchParam = (i, next) => onChangeParams(paramDefaults.map((p, idx) => idx === i ? { ...p, ...next } : p));

  return <>
    <Section title="Param Defaults" right={
      <Button size="sm" onClick={() => onChangeParams([...paramDefaults, { paramKey: '', lane: 'Float', floatValue: 0 }])} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加参数</Button>
    }>
      <p className="text-xs text-gray-500">Performer 参数黑板的初始值；lane 决定写入 Float / Int / Vector 通道。</p>
      {paramDefaults.map((p, i) => <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr_auto] gap-3 items-end rounded border border-[#2A2E37] bg-[#0D0F14] p-3">
        <TextField label="Param Key" value={p.paramKey} onChange={paramKey => patchParam(i, { paramKey })} />
        <SelectField label="Lane" value={p.lane} options={LANES.map(value => ({ value, label: value }))} onChange={lane => patchParam(i, { lane })} />
        {p.lane === 'Vector'
          ? <VectorField label="vectorValue" length={4} value={p.vectorValue} onChange={vectorValue => patchParam(i, { vectorValue })} />
          : p.lane === 'Int'
            ? <NumberField label="intValue" value={p.intValue} onChange={intValue => patchParam(i, { intValue })} />
            : <NumberField label="floatValue" value={p.floatValue} onChange={floatValue => patchParam(i, { floatValue })} />}
        <Button size="sm" variant="ghost" onClick={() => onChangeParams(paramDefaults.filter((_, idx) => idx !== i))} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button>
      </div>)}
    </Section>
  </>;
}