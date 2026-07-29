import React from 'react';
import { getTrackUsage } from '@/lib/commandLab';

const TRACK_LABEL = { legs: '运动轨 · legs', arms: '动作轨 · arms' };
const CMD_LABEL = { move: '移动', attack: '攻击', attackmove: 'A-move', patrol: '巡逻', follow: '跟随' };

// 轨道占用面板：同轨互斥、异轨并行的实时可视化
export default function TracksPanel({ unit }) {
  const usage = getTrackUsage(unit);
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 mb-1.5">轨道占用（异轨并行）</div>
      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(TRACK_LABEL).map(([t, label]) => {
          const o = usage[t];
          const cls = o
            ? o.kind === 'cast'
              ? 'border-amber-400/50 bg-amber-400/10'
              : 'border-sky-400/40 bg-sky-400/10'
            : 'border-slate-200 bg-slate-100';
          return (
            <div key={t} className={`rounded-md border px-2 py-1.5 ${cls}`}>
              <div className="text-[9px] font-mono text-slate-400">{label}</div>
              <div className={`text-[11px] font-bold ${o ? (o.kind === 'cast' ? 'text-amber-400' : 'text-sky-400') : 'text-slate-400'}`}>
                {o ? `${o.kind === 'cast' ? '施法 ' : ''}${CMD_LABEL[o.label] || o.label}` : '空闲'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}