import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, TextField, NumberField, SelectField, BoolField } from '@/components/ludots/ui';
import VectorField from './VectorField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import { BEHAVIOR_KINDS, BEHAVIOR_SPECS, blankBehavior } from './performerBehaviorSpecs';

export default function PerformerBehaviorList({ behaviors = [], refs = {}, onChange, title = 'Behaviors', description = '每个 behavior 占一个 slot；kind 决定运行时读取哪一组子配置。' }) {
  const patch = (i, next) => onChange(behaviors.map((b, idx) => idx === i ? { ...b, ...next } : b));
  const patchPayload = (i, field, next) => patch(i, { [field]: { ...(behaviors[i][field] || {}), ...next } });

  return <Section title={title} right={
    <Button size="sm" onClick={() => onChange([...behaviors, blankBehavior()])} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加 Behavior</Button>
  }>
    <p className="text-xs text-gray-500">{description}</p>
    {behaviors.map((b, i) => {
      const spec = BEHAVIOR_SPECS[b.kind] || BEHAVIOR_SPECS.AssetBinding;
      const payload = b[spec.field] || {};
      return <div key={i} className="rounded border border-[#2A2E37] bg-[#0D0F14] p-3 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <TextField label="Slot" value={b.slot} onChange={slot => patch(i, { slot })} />
          <SelectField label="Kind" value={b.kind} options={BEHAVIOR_KINDS.map(value => ({ value, label: value }))}
            onChange={kind => patch(i, { kind, [BEHAVIOR_SPECS[kind].field]: b[BEHAVIOR_SPECS[kind].field] || {} })} />
          <TextField label="Activation Inline" value={b.activationCondition?.inline}
            onChange={inline => patch(i, { activationCondition: { ...(b.activationCondition || {}), inline } })} />
          <div className="pt-5"><BoolField label="Active By Default" value={b.activeByDefault !== false} onChange={activeByDefault => patch(i, { activeByDefault })} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {spec.fields.map(f => {
            const set = v => patchPayload(i, spec.field, { [f.k]: v });
            if (f.ref) return <ReferenceSelect key={f.k} label={f.k} value={payload[f.k]} options={refs[f.ref]} onChange={set} />;
            if (f.t === 'vec3') return <VectorField key={f.k} label={f.k} value={payload[f.k]} length={3} onChange={set} />;
            if (f.t === 'vec4') return <VectorField key={f.k} label={f.k} value={payload[f.k]} length={4} onChange={set} />;
            if (f.t === 'number') return <NumberField key={f.k} label={f.k} value={payload[f.k]} onChange={set} />;
            if (f.t === 'bool') return <div key={f.k} className="pt-5"><BoolField label={f.k} value={Boolean(payload[f.k])} onChange={set} /></div>;
            if (f.options) return <SelectField key={f.k} label={f.k} value={payload[f.k]} options={f.options.map(value => ({ value, label: value }))} onChange={set} />;
            return <TextField key={f.k} label={f.k} hint={f.hint} value={payload[f.k]} onChange={set} />;
          })}
        </div>
        <div className="flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => onChange(behaviors.filter((_, idx) => idx !== i))} className="h-7 text-red-400"><Trash2 className="w-3 h-3" />删除</Button>
        </div>
      </div>;
    })}
  </Section>;
}