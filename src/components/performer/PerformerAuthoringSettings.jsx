import React from 'react';
import { NumberField, Section, SelectField, TextField } from '@/components/ludots/ui';
import VectorField from './VectorField';

const lifecycleOptions = [
  { value: 'duration', label: '限时（durationSeconds）' },
  { value: 'scoped', label: '作用域持续（Scoped）' },
];

export default function PerformerAuthoringSettings({ draft, patch, compact }) {
  const lifecycleMode = draft.lifecycle?.durationSeconds != null ? 'duration' : draft.lifecycle?.persistence ? 'scoped' : '';
  const setLifecycleMode = mode => patch({ lifecycle: mode === 'duration' ? { durationSeconds: draft.lifecycle?.durationSeconds || 1 } : { persistence: 'Scoped' } });
  return <Section title="Performer 作者契约">
    <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'md:grid-cols-3'}`}>
      <SelectField label="Lifecycle" value={lifecycleMode} options={lifecycleOptions} onChange={setLifecycleMode} hint="durationSeconds 与 persistence 二选一" />
      {lifecycleMode === 'duration' && <NumberField label="Duration Seconds" value={draft.lifecycle?.durationSeconds} onChange={durationSeconds => patch({ lifecycle: { durationSeconds } })} />}
      <TextField label="Visibility Inline" value={draft.visibility?.inline} onChange={inline => patch({ visibility: { inline } })} hint="graphProgramId 已被 C# 作者契约禁止" />
    </div>
    <VectorField label="Anchor Offset (XYZ)" length={3} value={draft.anchor?.offset || [0, 0, 0]} onChange={offset => patch({ anchor: { offset } })} />
    <p className="text-[10px] text-gray-500">颜色、字体、漂移、Surface 与 Instanced Batch 已迁移到对应 Behavior。</p>
  </Section>;
}