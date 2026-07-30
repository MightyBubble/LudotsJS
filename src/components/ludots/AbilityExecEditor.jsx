import React from 'react';
import { Section, SelectField } from '@/components/ludots/ui';
import AbilityCallerParamsEditor from './AbilityCallerParamsEditor';
import AbilityTimelineEditor from './AbilityTimelineEditor';
import RefListSelector from './RefListSelector';

export default function AbilityExecEditor({ value = {}, refs = {}, onChange, title = '执行规格 Exec' }) {
  const patch = next => onChange({ ...value, ...next });
  const items = value.items || [];
  const tagOptions = (refs.tags || []).map(tag => ({ value: tag.full_path, label: tag.full_path }));
  return <>
    <Section title={`${title} · Context`}>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="时钟 ID clockId" value={value.clockId} options={['FixedFrame','Step','EntityLocal'].map(clock => ({ value: clock, label: clock }))} onChange={clockId => patch({ clockId })} hint="AbilityExecLoader 原生 GasClockId" />
        <RefListSelector label="任意中断标签 interruptAny" value={value.interruptAny || []} options={tagOptions} onChange={interruptAny => patch({ interruptAny })} emptyText="暂无中断标签" />
      </div>
    </Section>
    <AbilityCallerParamsEditor value={value.callerParams || []} onChange={callerParams => patch({ callerParams })} />
    <Section title={`${title} · Clip Timeline`}>
      <AbilityTimelineEditor items={items} callerParams={value.callerParams || []} refs={refs} onChange={items => patch({ items })} />
    </Section>
  </>;
}