import React from 'react';
import { Input } from '@/components/ui/input';
import { ChevronUp, ChevronDown, Trash2, EyeOff } from 'lucide-react';
import { ABILITY_DEFS } from '@/lib/commandLab';
import { Seg } from '@/components/routes/routeUi';

const TARGETS = [['enemy', '敌方'], ['ally', '友方'], ['ground', '地面'], [null, '任意']];
const ACTIONS = [['attack', '攻击'], ['move', '移动'], ['follow', '跟随'], ['ability', '施放技能']];
const ABILITIES = Object.entries(ABILITY_DEFS).filter(([k]) => k !== 'atk');

// 单条路由规则卡片：条件（when）+ 动作（do）。matched=模拟器命中；shadowed=被前面规则遮蔽（不可达）
export default function RuleCard({ rule, index, matched, shadowed, onChange, onMove, onRemove, isFirst, isLast }) {
  const w = rule.when || {};
  const d = rule.do || {};
  const setW = (k, v) => onChange({ ...rule, when: { ...w, [k]: v } });
  const setD = (patch) => onChange({ ...rule, do: { ...d, ...patch } });
  const parseTags = (s) => s.split(',').map((x) => x.trim()).filter(Boolean);

  return (
    <div className={`rounded-lg border px-3 py-2.5 space-y-2 ${matched ? 'border-emerald-400 bg-emerald-50/50' : shadowed ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-400">#{index + 1}</span>
          {matched && <span className="text-[9px] bg-emerald-500 text-white rounded px-1.5 py-0.5">模拟命中</span>}
          {shadowed && (
            <span className="flex items-center gap-1 text-[9px] bg-amber-400 text-white rounded px-1.5 py-0.5" title="被更靠前且条件更宽的规则完全遮蔽">
              <EyeOff className="w-2.5 h-2.5" /> 不可达
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 text-slate-400">
          <button disabled={isFirst} onClick={() => onMove(-1)} className="p-1 hover:text-slate-700 disabled:opacity-25"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button disabled={isLast} onClick={() => onMove(1)} className="p-1 hover:text-slate-700 disabled:opacity-25"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button onClick={onRemove} className="p-1 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center text-[10px] text-slate-400">
        <span>目标关系</span>
        <Seg options={TARGETS} value={w.target ?? null} onPick={(v) => setW('target', v)} />
        <span>自身标签</span>
        <Input key={`st${index}`} className="h-6 text-[10px]" placeholder="如 Role.Healer（逗号分隔，失焦生效）"
          defaultValue={(w.selfTags || []).join(', ')} onBlur={(e) => setW('selfTags', parseTags(e.target.value))} />
        <span>目标标签</span>
        <Input key={`tt${index}`} className="h-6 text-[10px]" placeholder="不限"
          defaultValue={(w.targetTags || []).join(', ')} onBlur={(e) => setW('targetTags', parseTags(e.target.value))} />
        <span>血量低于%</span>
        <Input type="number" min={0} max={100} className="h-6 w-20 text-[10px]" placeholder="不限"
          value={w.targetHpBelow != null ? Math.round(w.targetHpBelow * 100) : ''}
          onChange={(e) => setW('targetHpBelow', e.target.value === '' ? null : Number(e.target.value) / 100)} />
      </div>

      <div className="border-t border-slate-100 pt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 items-center text-[10px] text-slate-400">
        <span>动作</span>
        <Seg options={ACTIONS} value={d.type} onPick={(v) => setD({ type: v, ability: v === 'ability' ? (d.ability || 'heal') : undefined })} />
        {d.type === 'ability' && (
          <>
            <span>技能</span>
            <div className="flex gap-1 flex-wrap">
              {ABILITIES.map(([id, def]) => (
                <button key={id} onClick={() => setD({ ability: id })}
                  className={`text-[10px] rounded px-1.5 py-0.5 border ${d.ability === id ? 'text-white border-transparent' : 'border-slate-200 text-slate-500'}`}
                  style={d.ability === id ? { backgroundColor: def.color } : {}}>
                  {def.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}