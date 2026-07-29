import React from 'react';
import { ABILITY_DEFS } from '@/lib/commandLab';

// Input buffer slots with expiry countdown
export default function BufferPanel({ buffer, time, config }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-500">
        输入缓冲 ({buffer.length}/{config.bufferSize})
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${config.bufferSize}, 1fr)` }}>
        {Array.from({ length: config.bufferSize }).map((_, i) => {
          const entry = buffer[i];
          if (!entry) {
            return (
              <div key={i} className="h-12 rounded-md border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">
                空
              </div>
            );
          }
          const remain = Math.max(0, config.bufferWindow - (time - entry.at));
          const pct = (remain / config.bufferWindow) * 100;
          return (
            <div key={i} className="h-12 rounded-md border border-slate-200 bg-white px-1.5 py-1 flex flex-col justify-between">
              <div className="text-[10px] font-bold text-slate-700 truncate">{ABILITY_DEFS[entry.key]?.label}</div>
              <div className="text-[9px] font-mono text-slate-400">{remain.toFixed(2)}s</div>
              <div className="h-1 rounded bg-slate-100 overflow-hidden">
                <div className={`h-full ${pct < 30 ? 'bg-red-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}