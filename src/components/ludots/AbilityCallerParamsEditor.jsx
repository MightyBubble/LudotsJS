import React from 'react';
import { Plus } from 'lucide-react';
import { Section } from '@/components/ludots/ui';
import AbilityCallerParamGroup from './AbilityCallerParamGroup';

export default function AbilityCallerParamsEditor({ value = [], onChange }) {
  const groups = Array.isArray(value) ? value : [];
  const update = (index, group) => onChange(groups.map((current, i) => i === index ? group : current));
  const remove = index => onChange(groups.filter((_, i) => i !== index));
  const add = () => groups.length < 4 && onChange([...groups, { entries: [] }]);
  return <Section title="参数透传 Caller Params" right={<span className="text-[10px] text-muted-foreground">{groups.length}/4 Groups</span>}>
    <p className="text-[10px] text-muted-foreground">每个 Clip 通过 callerParamsIdx 引用一个参数组；参数不会与 Clip 自身字段混合。</p>
    <div className="grid gap-3 xl:grid-cols-2">{groups.map((group, index) => <AbilityCallerParamGroup key={index} index={index} group={group} onChange={next => update(index, next)} onRemove={() => remove(index)} />)}</div>
    {groups.length < 4 && <button onClick={add} className="flex h-8 items-center gap-1 rounded border border-[#2A2E37] px-3 text-[11px] text-primary hover:bg-accent"><Plus className="h-3.5 w-3.5" />新建参数组</button>}
  </Section>;
}