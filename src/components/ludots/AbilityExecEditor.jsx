import React from 'react';
import { ListField, Section, SelectField } from '@/components/ludots/ui';
import AbilityCallerParamsEditor from './AbilityCallerParamsEditor';
import AbilityTimelineEditor from './AbilityTimelineEditor';

export default function AbilityExecEditor({ value = {}, onChange, title = '执行规格 Exec' }) {
  const patch = next => onChange({ ...value, ...next });
  const items = value.items || [];
  return <>
    <Section title={`${title} · Context`}>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="时钟 ID clockId" value={value.clockId} options={['FixedFrame','Step','EntityLocal'].map(clock => ({ value: clock, label: clock }))} onChange={clockId => patch({ clockId })} hint="AbilityExecLoader 原生 GasClockId" />
        <ListField label="任意中断标签 interruptAny" value={value.interruptAny || []} onChange={interruptAny => patch({ interruptAny })} />
      </div>
    </Section>
    <AbilityCallerParamsEditor value={value.callerParams || []} onChange={callerParams => patch({ callerParams })} />
    <Section title={`${title} · Clip Timeline`}>
      <AbilityTimelineEditor items={items} callerParams={value.callerParams || []} onChange={items => patch({ items })} />
    </Section>
  </>;
}