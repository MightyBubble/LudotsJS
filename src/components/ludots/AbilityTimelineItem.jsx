import React from 'react';
import { GripVertical } from 'lucide-react';
import { KIND_STYLE, itemSummary } from './abilityTimelineModel';

function startPointer(e, initial, scale, apply) {
  e.preventDefault(); e.stopPropagation();
  const origin = e.clientX;
  const move = event => apply(Math.max(0, Math.round(initial + (event.clientX - origin) / scale)));
  const end = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', end); };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', end);
}

export default function AbilityTimelineItem({ item, index, selected, pixelsPerTick, ticks, onSelect, onChange }) {
  const duration = Math.max(0, item.duration || 0);
  const left = Math.max(0, item.tick || 0) * pixelsPerTick;
  const width = Math.max(28, duration * pixelsPerTick);
  const patchTick = tick => onChange({ ...item, tick });
  return <div className="flex h-11 border-b border-[#2A2E37]/70">
    <button onClick={onSelect} className={`sticky left-0 z-10 flex w-32 shrink-0 items-center gap-1 border-r border-[#2A2E37] px-2 text-left text-[10px] ${selected ? 'bg-accent text-accent-foreground' : 'bg-[#15171C] text-muted-foreground'}`}>
      <GripVertical className="h-3 w-3" /><span className="truncate">{index + 1}. {item.kind}</span>
    </button>
    <div className="relative h-full" style={{ width: ticks * pixelsPerTick }} onDoubleClick={e => patchTick(Math.round(e.nativeEvent.offsetX / pixelsPerTick))}>
      <button type="button" aria-label={`${item.kind} at tick ${item.tick}`} onClick={onSelect} onPointerDown={e => startPointer(e, item.tick || 0, pixelsPerTick, patchTick)} onKeyDown={e => { if (e.key === 'ArrowLeft') patchTick(Math.max(0, item.tick - 1)); if (e.key === 'ArrowRight') patchTick((item.tick || 0) + 1); }} className={`absolute top-2 flex h-7 cursor-ew-resize items-center overflow-hidden rounded border px-2 text-[10px] shadow ${KIND_STYLE[item.kind] || KIND_STYLE.End} ${selected ? 'ring-1 ring-primary' : ''}`} style={{ left, width }}>
        <span className="truncate">{itemSummary(item)}</span>
        {duration > 0 && <span onPointerDown={e => startPointer(e, duration, pixelsPerTick, value => onChange({ ...item, duration: value }))} className="absolute right-0 h-full w-2 cursor-col-resize border-l border-current/40" />}
      </button>
    </div>
  </div>;
}