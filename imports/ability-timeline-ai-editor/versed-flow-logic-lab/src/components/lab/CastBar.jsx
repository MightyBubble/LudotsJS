import React from 'react';
import { ABILITY_DEFS } from '@/lib/commandLab';

const EVENT_COLORS = { swing: 'bg-red-500', search: 'bg-sky-500', projectile: 'bg-amber-500', damage: 'bg-red-500', pulse: 'bg-violet-500' };
const EFFECT_NAMES = { swing: '挥击', search: '搜索', projectile: '发射', damage: '伤害', pulse: '脉冲' };
const effectLabel = (fx) => EFFECT_NAMES[fx.type] + (fx.then ? '→' + effectLabel(fx.then) : '');

// Timeline-based cast bar: event markers + combo window band
export default function CastBar({ active }) {
  if (!active) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-300">
        空闲 — 可立即施放
      </div>
    );
  }
  const def = ABILITY_DEFS[active.id];
  const stage = def.stages[active.stage];
  const pct = Math.min(100, (active.elapsed / stage.duration) * 100);
  const remain = Math.max(0, stage.duration - active.elapsed);
  const win = stage.comboWindow;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-800">
          {def.label}
          {def.stages.length > 1 && (
            <span className="ml-1.5 text-[10px] font-medium text-slate-400">
              {stage.name}（{active.stage + 1}/{def.stages.length}）
            </span>
          )}
        </span>
        <span className="font-mono text-slate-500">{remain.toFixed(2)}s</span>
      </div>
      <div className="relative h-4 rounded bg-slate-100 overflow-hidden">
        {win && (
          <div
            className="absolute inset-y-0 bg-amber-200/70"
            style={{ left: `${(win.open / stage.duration) * 100}%`, width: `${((win.close - win.open) / stage.duration) * 100}%` }}
          />
        )}
        <div className="absolute inset-y-0 left-0 rounded-r" style={{ width: `${pct}%`, backgroundColor: def.color, opacity: 0.85 }} />
        {stage.timeline.map((ev, i) => (
          <div
            key={i}
            className={`absolute inset-y-0 w-0.5 ${EVENT_COLORS[ev.effect.type] || 'bg-slate-400'} ${active.fired.includes(i) ? 'opacity-40' : ''}`}
            style={{ left: `${(ev.t / stage.duration) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>
          {stage.timeline.map((ev, i) => (
            <span key={i} className="mr-2">
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-0.5 align-middle ${EVENT_COLORS[ev.effect.type]}`} />
              {effectLabel(ev.effect)}@{ev.t}s
            </span>
          ))}
        </span>
        {win && (
          <span className={active.comboQueued ? 'text-emerald-600 font-bold' : 'text-amber-600'}>
            {active.comboQueued ? '✓ 已预约下一段' : `连击窗口 ${win.open}–${win.close}s`}
          </span>
        )}
      </div>
    </div>
  );
}