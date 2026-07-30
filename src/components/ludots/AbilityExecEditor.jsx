import React from 'react';
import { Plus } from 'lucide-react';
import { ListField, Section, TextField } from '@/components/ludots/ui';
import AbilityExecItemEditor from './AbilityExecItemEditor';
import AbilityJsonField from './AbilityJsonField';

export default function AbilityExecEditor({ value = {}, onChange, title = '执行规格 Exec' }) {
  const patch = next => onChange({ ...value, ...next });
  const items = value.items || [];
  return <Section title={title} right={<button onClick={() => patch({ items: [...items, { kind: 'End', tick: 0 }] })} className="flex items-center gap-1 text-[10px] text-[#D97706]"><Plus className="h-3 w-3" />Item</button>}>
    <TextField label="时钟 ID clockId" value={value.clockId} onChange={clockId => patch({ clockId })} hint="AbilityExecLoader 必填字段，例如 FixedFrame" />
    <ListField label="任意中断标签 interruptAny" value={value.interruptAny || []} onChange={interruptAny => patch({ interruptAny })} />
    <AbilityJsonField label="调用参数池 callerParams" value={value.callerParams || []} onChange={callerParams => patch({ callerParams })} hint="EffectConfigParams entries 数组" />
    {items.map((item, index) => <AbilityExecItemEditor key={index} item={item} index={index} onChange={next => patch({ items: items.map((current, i) => i === index ? next : current) })} onRemove={() => patch({ items: items.filter((_, i) => i !== index) })} />)}
  </Section>;
}