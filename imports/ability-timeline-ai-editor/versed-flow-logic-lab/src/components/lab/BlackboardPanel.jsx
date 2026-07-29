import React from 'react';
import { ABILITY_DEFS } from '@/lib/commandLab';
import { LAB_BITS, LAB_BELIEFS } from '@/lib/lab/knowledgeBridge.js';

const BELIEF_LABEL = { threat: '威胁', alertness: '警觉', confidence: '信心' };
const MEM_LABEL = { spotted: '发现', lost_sight: '丢失', attacked: '受击', stance_changed: '姿态', ability_cast: '施法' };

// 所控单位的黑板：感知快照（可见敌人）+ 记忆快照（脱离视野的最后目击）+ 每技能自动取目标
// 下方为统一知识层镜像（与 4X/BT/FSM/GOAP/HTN 同一套词汇）：
//   WS 位开关（客观事实）· Belief 主观标量（统一打分管线派生）· Mem 客观事件记录
export default function BlackboardPanel({ unit, autoTargets, time = 0 }) {
  const perceived = unit?.blackboard?.perceived || [];
  const memory = Object.values(unit?.blackboard?.memory || {}).filter((m) => !perceived.some((s) => s.id === m.id));
  const k = unit?.knowledge;
  const beliefs = k?.beliefs;
  const memRecent = k?.mem?.recent(6) || [];
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-slate-500">黑板（传感器只写 · 决策只读）</div>
      <div className="rounded-lg border border-slate-200 px-2.5 py-2 space-y-1.5">
        <div className="text-[9px] text-slate-400 font-mono">bb.perceived · 视野传感器（sight {unit?.sight ?? '—'}）｜ bb.memory · 记忆传感器</div>
        <div className="flex flex-wrap gap-1 text-[10px]">
          {perceived.length === 0 && memory.length === 0 && <span className="text-slate-300">视野内无单位</span>}
          {perceived.map((s) => (
            <span key={s.id} className={`font-mono rounded px-1.5 py-0.5 ${s.team === unit?.team ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
              {s.id}·{Math.round(s.health)}
            </span>
          ))}
          {memory.map((m) => (
            <span key={m.id} className="font-mono bg-slate-100 text-slate-400 rounded px-1.5 py-0.5" title="记忆快照（最后目击位置）">
              {m.id}?·{(time - m.seenAt).toFixed(1)}s
            </span>
          ))}
        </div>
        {unit?.blackboard?.lastHit && (
          <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100">
            bb.lastHit · 受击传感器 → <span className="text-red-600">{unit.blackboard.lastHit.by}</span> · {(time - unit.blackboard.lastHit.at).toFixed(1)}s 前
          </div>
        )}
        <div className="space-y-0.5 pt-1.5 border-t border-slate-100">
          <div className="text-[9px] text-slate-400">自动取目标（候选必然来自 bb.perceived）</div>
          {Object.entries(autoTargets || {}).map(([aid, tid]) => (
            <div key={aid} className="flex justify-between text-[10px]">
              <span className="font-bold" style={{ color: ABILITY_DEFS[aid].color }}>{ABILITY_DEFS[aid].label}</span>
              <span className="font-mono text-slate-600">{tid || '—'}</span>
            </div>
          ))}
        </div>

        {/* ── 统一知识层镜像（客观：WS 位 / Mem 记录 · 主观：Belief 标量） ── */}
        {k && (
          <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
            <div className="text-[9px] text-slate-400">WorldState 位开关（规划器事实词汇）</div>
            <div className="flex flex-wrap gap-1">
              {LAB_BITS.map((b) => (
                <span key={b} className={`font-mono text-[9px] rounded px-1 py-0.5 ${k.ws.get(b) ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-50 text-slate-300 border border-slate-100'}`}>
                  {b}
                </span>
              ))}
            </div>
            <div className="text-[9px] text-slate-400 pt-0.5">Belief 主观认识（黑板 → 映射曲线，与 Utility 同一管线）</div>
            <div className="space-y-0.5">
              {LAB_BELIEFS.map((d, i) => {
                const v = beliefs?.out?.[i] ?? 0;
                return (
                  <div key={d.key} className="flex items-center gap-1.5 text-[10px]">
                    <span className="w-8 shrink-0 text-slate-500">{BELIEF_LABEL[d.key] || d.key}</span>
                    <div className="flex-1 h-1.5 rounded bg-slate-100 overflow-hidden">
                      <div className="h-full rounded bg-violet-400" style={{ width: `${Math.round(v * 100)}%` }} />
                    </div>
                    <span className="font-mono text-slate-600 w-7 shrink-0">{v.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[9px] text-slate-400 pt-0.5">Mem 事件记录（客观流水，带时间戳）</div>
            <div className="space-y-0.5 max-h-20 overflow-y-auto">
              {memRecent.length === 0 && <div className="text-[9px] text-slate-300">暂无记录</div>}
              {memRecent.map((r, i) => (
                <div key={i} className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>{MEM_LABEL[r.type] || r.type} {r.data?.id || r.data?.by || r.data?.stance || r.data?.id || ''}</span>
                  <span className="text-slate-300">{(time - r.at).toFixed(1)}s 前</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
