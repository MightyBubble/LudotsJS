import React from 'react';
import { MapPin, Swords, Zap, Footprints, Crosshair, Repeat } from 'lucide-react';
import { ABILITY_DEFS, cmdTracks } from '@/lib/commandLab';

// RTS-style command queue display: head is executing, rest are shift-queued
export default function CommandQueuePanel({ queue, casting }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-500">
        指令队列 ({queue.length}/8) {casting && queue.length > 0 && <span className="text-amber-500">— 同轨等待 · 异轨并行</span>}
      </div>
      {queue.length === 0 ? (
        <div className="h-9 rounded-md border border-dashed border-slate-200 flex items-center justify-center text-[11px] text-slate-300">
          空 — 点击/技能 + Shift 预约
        </div>
      ) : (
        <div className="space-y-1">
          {queue.map((cmd, i) => (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                i === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}
            >
              <span className="font-mono text-[9px] w-4 text-center opacity-60">{i === 0 ? '▶' : i}</span>
              {cmd.type === 'move' && <MapPin className="w-3 h-3" />}
              {cmd.type === 'attack' && <Swords className="w-3 h-3" />}
              {cmd.type === 'attackmove' && <Crosshair className="w-3 h-3" />}
              {cmd.type === 'patrol' && <Repeat className="w-3 h-3" />}
              {cmd.type === 'follow' && <Footprints className="w-3 h-3" />}
              {cmd.type === 'ability' && (
                <Zap className="w-3 h-3" style={{ color: ABILITY_DEFS[cmd.id]?.color }} />
              )}
              {cmd.type === 'move' && `移动到 (${cmd.x.toFixed(1)}, ${cmd.z.toFixed(1)})`}
              {cmd.type === 'attack' && `攻击敌人 ${cmd.targetId}${cmd.auto ? '（autocast）' : ''}`}
              {cmd.type === 'attackmove' && `A-move 到 (${cmd.x.toFixed(1)}, ${cmd.z.toFixed(1)})`}
              {cmd.type === 'patrol' && `巡逻（${cmd.points.length} 点循环 · 去第 ${cmd.idx + 1} 点）`}
              {cmd.type === 'follow' && `跟随 ${cmd.targetId}`}
              {cmd.type === 'ability' && (
                <span>
                  施放 <b style={{ color: ABILITY_DEFS[cmd.id]?.color }}>{ABILITY_DEFS[cmd.id]?.label}</b>
                  {cmd.params?.targetId && <span className="opacity-70"> → {cmd.params.targetId}{cmd.params.origin === 'auto' ? '·自动' : ''}</span>}
                  {cmd.params?.kind === 'point' && <span className="opacity-70"> @ ({cmd.params.x.toFixed(1)}, {cmd.params.z.toFixed(1)})</span>}
                  {cmd.params?.kind === 'direction' && <span className="opacity-70"> ↗方向快照</span>}
                  {cmd.source === 'resumed' && (
                    <span className="ml-1 text-[9px] rounded px-1 bg-amber-100 text-amber-700 border border-amber-200">
                      {cmd.resume ? `续跑 · 已进行 ${cmd.resume.elapsed.toFixed(2)}s` : '重来'}
                    </span>
                  )}
                  <kbd className="ml-1 text-[9px] bg-slate-200 rounded px-1">{ABILITY_DEFS[cmd.id]?.input}</kbd>
                </span>
              )}
              <span className="ml-auto flex gap-0.5 shrink-0">
                {cmdTracks(cmd).map((t) => (
                  <span key={t} className="text-[8px] font-mono rounded px-1 border border-slate-200 bg-slate-100 text-slate-500">{t}</span>
                ))}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}