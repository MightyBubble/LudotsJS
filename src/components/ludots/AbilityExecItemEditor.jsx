import React from 'react';
import { Trash2 } from 'lucide-react';
import { NumberField, SelectField, TextField } from '@/components/ludots/ui';

export const EXEC_ITEM_KINDS = ['EffectClip','TagClip','TagClipTarget','EffectSignal','EventSignal','GraphSignal','TagSignal','TagSignalTarget','InputGate','EventGate','TargetCollectionGate','End'];
const options = values => values.map(value => ({ value, label: value }));

export default function AbilityExecItemEditor({ item, index, onChange, onRemove }) {
  const patch = next => onChange({ ...item, ...next });
  return <div className="rounded border border-[#2A2E37] bg-[#0D0F14] p-3 space-y-3">
    <div className="flex justify-between text-[11px] text-gray-400"><span>Exec Item #{index + 1}</span><button onClick={onRemove}><Trash2 className="h-3.5 w-3.5" /></button></div>
    <SelectField label="类型 kind" value={item.kind} options={options(EXEC_ITEM_KINDS)} onChange={value => patch({ kind: value })} />
    <NumberField label="时间点 tick" value={item.tick} onChange={value => patch({ tick: value })} />
    <NumberField label="持续 tick duration" value={item.duration} onChange={value => patch({ duration: value })} />
    <TextField label="覆盖时钟 clock" value={item.clock} onChange={value => patch({ clock: value })} />
    <TextField label="标签 tag" value={item.tag} onChange={value => patch({ tag: value })} />
    <TextField label="Effect 模板 template" value={item.template} onChange={value => patch({ template: value })} />
    <TextField label="Graph 程序 graph" value={item.graph} onChange={value => patch({ graph: value })} />
    <SelectField label="分发目标 dispatchTarget" value={item.dispatchTarget} options={options(['Default','Source','Target','TargetContext'])} onChange={value => patch({ dispatchTarget: value })} />
    <NumberField label="调用参数索引 callerParamsIdx" value={item.callerParamsIdx} onChange={value => patch({ callerParamsIdx: value })} />
    <NumberField label="载荷 payloadA" value={item.payloadA} onChange={value => patch({ payloadA: value })} />
  </div>;
}