import React from 'react';
import QuarksValueField from '@/components/quarks/QuarksValueField';

const Toggle = ({ label, value, onChange }) => <label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />{label}</label>;
export default function QuarksCorePanel({ ps, patch }) {
  return <div className="space-y-3">
    <label className="block text-[10px] text-gray-400">持续时间（秒）<input aria-label="持续时间" type="number" min="0.01" step="0.1" value={ps.duration ?? 1} onChange={e => patch({ duration: Number(e.target.value) })} className="mt-1 h-8 w-full rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs"/></label>
    <div className="grid grid-cols-2 gap-2"><Toggle label="循环" value={ps.looping} onChange={looping => patch({ looping })}/><Toggle label="预热" value={ps.prewarm} onChange={prewarm => patch({ prewarm })}/><Toggle label="世界空间" value={ps.worldSpace} onChange={worldSpace => patch({ worldSpace })}/><Toggle label="仅作子发射器" value={ps.onlyUsedByOther} onChange={onlyUsedByOther => patch({ onlyUsedByOther })}/></div>
    <QuarksValueField label="初始生命周期" value={ps.startLife} onChange={startLife => patch({ startLife })}/>
    <QuarksValueField label="初始速度" value={ps.startSpeed} onChange={startSpeed => patch({ startSpeed })}/>
    <QuarksValueField label="初始尺寸" value={ps.startSize} onChange={startSize => patch({ startSize })}/>
    <QuarksValueField label="初始旋转" value={ps.startRotation} onChange={startRotation => patch({ startRotation })}/>
  </div>;
}