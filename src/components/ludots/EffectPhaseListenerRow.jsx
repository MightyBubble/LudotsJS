import React from 'react';
import { Trash2 } from 'lucide-react';
import EffectFieldControl from './EffectFieldControl';
import { PHASE_LISTENER_BASE_FIELDS } from './effectConfigFields';

export default function EffectPhaseListenerRow({ value, onChange, onRemove, refs }) {
  const patch = (key, next) => onChange({ ...value, [key]: next });
  const usesGraph = value.action === 'Graph' || value.action === 'Both';
  const usesEvent = value.action === 'Event' || value.action === 'Both';
  return (
    <div className="border border-[#2A2E37] rounded p-3 space-y-2">
      <div className="flex justify-end"><button onClick={onRemove} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button></div>
      <div className="grid gap-2 md:grid-cols-2">{PHASE_LISTENER_BASE_FIELDS.map(field => <EffectFieldControl key={field.key} field={field} value={value[field.key]} onChange={(next) => patch(field.key, next)} refs={refs} />)}</div>
      {usesGraph && <EffectFieldControl field={{ key: 'graphProgram', label: 'graphProgram', type: 'graph' }} value={value.graphProgram} onChange={(next) => patch('graphProgram', next)} refs={refs} />}
      {usesEvent && <EffectFieldControl field={{ key: 'eventTag', label: 'eventTag', type: 'tag' }} value={value.eventTag} onChange={(next) => patch('eventTag', next)} refs={refs} />}
    </div>
  );
}