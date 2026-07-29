import React from 'react';
import { ABILITY_DEFS } from '@/lib/commandLab';

// utility 实时评分：选目标 graph 对每个候选的打分（⛔=被硬过滤出局，首位=当前胜出）
export default function UtilityScorePanel({ scores }) {
  const rows = Object.entries(scores).filter(([, list]) => list.length > 0);
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-500">Utility 评分（选目标 graph）</div>
      <div className="space-y-1">
        {rows.map(([id, list]) => (
          <div key={id} className="rounded-md border border-slate-100 px-2 py-1.5">
            <div className="text-[10px] font-bold mb-1" style={{ color: ABILITY_DEFS[id]?.color }}>{ABILITY_DEFS[id]?.label}</div>
            <div className="space-y-0.5">
              {list.map((c, i) => (
                <div key={c.id} className="flex items-center gap-1.5 text-[10px]">
                  <span className={`font-mono w-6 shrink-0 ${c.filtered ? 'text-slate-300 line-through' : i === 0 ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>{c.id}</span>
                  {c.filtered ? (
                    <span className="text-[9px] text-rose-400">⛔ 硬过滤出局</span>
                  ) : (
                    <>
                      <div className="flex-1 h-1.5 rounded bg-slate-100 overflow-hidden">
                        <div className="h-full rounded" style={{ width: `${c.total * 100}%`, backgroundColor: ABILITY_DEFS[id]?.color }} />
                      </div>
                      <span className="font-mono text-slate-600 w-8 shrink-0">{c.total.toFixed(2)}</span>
                      <span className="text-[8px] text-slate-400 truncate">{Object.entries(c.parts).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' · ')}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}