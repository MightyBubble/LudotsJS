import React from 'react';
import { Plus } from 'lucide-react';
import { Section } from './ui';
import EffectPhaseListenerRow from './EffectPhaseListenerRow';

export default function EffectPhaseListenersEditor({ value = [], onChange, refs }) {
  const add = () => onChange([...value, { phase: 'OnApply', scope: 'Target', action: 'Graph', priority: 0 }]);
  return (
    <Section title="Phase Listeners · 跨帧观察器" right={<button onClick={add} className="flex items-center gap-1 text-xs text-[#E2D8B3]"><Plus className="w-3 h-3" />添加</button>}>
      <p className="text-[11px] text-gray-500">挂在 ActiveEffect 持有者上；Target/Source 视角匹配，Graph 同帧执行，Event 下一帧发布。</p>
      {value.length === 0 && <p className="text-[11px] text-gray-600">未配置</p>}
      {value.map((row, index) => <EffectPhaseListenerRow key={index} value={row} refs={refs} onChange={(next) => onChange(value.map((item, i) => i === index ? next : item))} onRemove={() => onChange(value.filter((_, i) => i !== index))} />)}
    </Section>
  );
}