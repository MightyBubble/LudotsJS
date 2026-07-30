import React from 'react';

export default function AbilityTimelineRuler({ ticks, pixelsPerTick }) {
  const step = pixelsPerTick >= 12 ? 5 : 10;
  const marks = Array.from({ length: Math.floor(ticks / step) + 1 }, (_, i) => i * step);
  return <div className="relative ml-32 h-7 border-b border-[#2A2E37] text-[9px] text-muted-foreground" style={{ width: ticks * pixelsPerTick }}>
    {marks.map(tick => <div key={tick} className="absolute bottom-0 h-full border-l border-[#2A2E37]" style={{ left: tick * pixelsPerTick }}>
      <span className="absolute left-1 top-1 font-mono">{tick}</span>
    </div>)}
  </div>;
}