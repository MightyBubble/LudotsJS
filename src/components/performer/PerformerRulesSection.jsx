import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, TextField, NumberField, SelectField } from '@/components/ludots/ui';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import { EVENT_KIND_OPTIONS, INLINE_CONDITION_OPTIONS, getEventKeyOptions } from './performerRuleOptions';

const blankRule = () => ({
  event: { kind: 'TagEffectiveChanged', keyId: '' },
  condition: { inline: 'None', graphProgramId: 0 },
  command: { kind: 'SetParam', paramKey: '', paramLane: 'Float', valueSource: 'Fixed', paramValue: 1 },
});

export default function PerformerRulesSection({ rules = [], refs = {}, onChange }) {
  const patch = (i, part, next) => onChange(rules.map((r, idx) => idx === i ? { ...r, [part]: { ...(r[part] || {}), ...next } } : r));
  return <Section title="Rules" right={
    <Button size="sm" onClick={() => onChange([...rules, blankRule()])} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加规则</Button>
  }>
    <p className="text-xs text-gray-500">运行时事件 → 可选条件 → 单个 Performer command；多个命令请新增相同事件的规则。</p>
    {rules.map((r, i) => <div key={i} className="rounded border border-[#2A2E37] bg-[#0D0F14] p-3 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField label="Event Kind" value={r.event?.kind} options={EVENT_KIND_OPTIONS} onChange={kind => patch(i, 'event', { kind, keyId: '' })} />
        <ReferenceSelect label="Event Key" hint="按事件类型选择；* 表示任意键" value={r.event?.keyId} options={getEventKeyOptions(r.event?.kind, refs)} onChange={keyId => patch(i, 'event', { keyId })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectField label="Condition Inline" value={r.condition?.inline || 'None'} options={INLINE_CONDITION_OPTIONS} onChange={inline => patch(i, 'condition', { inline })} />
        <NumberField label="Condition Graph Program ID" value={r.condition?.graphProgramId ?? 0} onChange={graphProgramId => patch(i, 'condition', { graphProgramId })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <TextField label="Command Kind" hint="SetParam" value={r.command?.kind} onChange={kind => patch(i, 'command', { kind })} />
        <TextField label="Param Key" value={r.command?.paramKey} onChange={paramKey => patch(i, 'command', { paramKey })} />
        <TextField label="Param Lane" hint="Float / Int / Vector" value={r.command?.paramLane} onChange={paramLane => patch(i, 'command', { paramLane })} />
        <TextField label="Value Source" hint="Fixed" value={r.command?.valueSource} onChange={valueSource => patch(i, 'command', { valueSource })} />
        <NumberField label="Param Value" value={r.command?.paramValue} onChange={paramValue => patch(i, 'command', { paramValue })} />
      </div>
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => onChange(rules.filter((_, idx) => idx !== i))} className="h-7 text-red-400"><Trash2 className="w-3 h-3" />删除</Button>
      </div>
    </div>)}
  </Section>;
}