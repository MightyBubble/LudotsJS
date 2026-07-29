import React from 'react';

const TYPE_STYLES = {
  instant: 'text-blue-600',
  'from-buffer': 'text-emerald-600',
  buffer: 'text-slate-500',
  drop: 'text-red-500',
  hit: 'text-orange-600',
  end: 'text-slate-400',
};

export default function LabEventLog({ events }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-slate-500">事件日志</div>
      <div className="h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2 space-y-0.5 font-mono text-[11px]">
        {events.length === 0 && <div className="text-slate-300">按 J / K / L 或点击按钮施放技能…</div>}
        {events.map((e, i) => (
          <div key={events.length - i} className={TYPE_STYLES[e.type] || 'text-slate-600'}>
            [{e.t.toFixed(2)}s] {e.text}
          </div>
        ))}
      </div>
    </div>
  );
}