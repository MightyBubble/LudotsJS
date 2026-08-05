import React, { useRef } from 'react';
import { Move3D, Rotate3D, Scaling } from 'lucide-react';
import usePerformerPreviewScene from './usePerformerPreviewScene';

const MODES = [
  { value: 'translate', label: '移动', Icon: Move3D },
  { value: 'rotate', label: '旋转', Icon: Rotate3D },
  { value: 'scale', label: '缩放', Icon: Scaling },
];

export default function PerformerPreviewViewport({ root, selectedInstancePath, performers, bindings, assets, effects, targetSlot, mode, onModeChange, onSelectPath, onTransform }) {
  const containerRef = useRef(null);
  const status = usePerformerPreviewScene(containerRef, root, performers, bindings, assets, effects, selectedInstancePath, targetSlot, mode, onSelectPath, onTransform);
  return <div className="relative h-[480px] overflow-hidden rounded border border-[#424a55] bg-[#0D0F14]">
    <div ref={containerRef} data-testid="performer-preview" className="h-full w-full" />
    <div className="absolute left-2 top-2 flex gap-1 rounded border border-[#424a55] bg-[#171b21] p-1">
      {MODES.map(({ value, label, Icon }) => <button key={value} type="button" aria-label={label} onClick={() => onModeChange(value)} className={`flex h-7 items-center gap-1 rounded px-2 text-[11px] ${mode === value ? 'bg-primary text-primary-foreground' : 'text-gray-300 hover:bg-[#303845]'}`}><Icon className="h-3 w-3" />{label}</button>)}
    </div>
    <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-[#0D0F14]/80 px-2 py-1 text-[10px] text-gray-400">{status}</div>
  </div>;
}