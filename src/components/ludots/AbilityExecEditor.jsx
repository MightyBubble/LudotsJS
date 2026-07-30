import React from 'react';
import { Section, SelectField } from '@/components/ludots/ui';
import AbilityCallerParamsEditor from './AbilityCallerParamsEditor';
import AbilityTimelineEditor from './AbilityTimelineEditor';
import RefListSelector from './RefListSelector';
import { getGlobalTableOptions, LUDOTS_TABLE_IDS } from './globalTableRefs';

export default function AbilityExecEditor({ value = {}, refs = {}, onChange, title = '执行规格 Exec' }) {
  const patch = next => onChange({ ...value, ...next });
  const items = value.items || [];
  const tagOptions = (refs.tags || []).map(tag => ({ value: tag.full_path, label: tag.full_path }));
  const clockOptions = getGlobalTableOptions(refs.constants, LUDOTS_TABLE_IDS.gasClockIds, ['FixedFrame', 'Step', 'EntityLocal']);
  return <>
    <Section title={`${title} · Context`}>
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField label="时钟 ID clockId" value={value.clockId} options={clockOptions} onChange={clockId => patch({ clockId })} hint="全局表 ludots_gas_clock_ids · AbilityExecLoader GasClockId" />
        <RefListSelector label="任意中断标签 interruptAny" value={value.interruptAny || []} options={tagOptions} onChange={interruptAny => patch({ interruptAny })} emptyText="暂无中断标签" />
      </div>
    </Section>
    <AbilityCallerParamsEditor value={value.callerParams || []} onChange={callerParams => patch({ callerParams })} />
    <Section title={`${title} · Clip Timeline`}>
      <AbilityTimelineEditor items={items} callerParams={value.callerParams || []} refs={refs} onChange={items => patch({ items })} />
    </Section>
  </>;
}