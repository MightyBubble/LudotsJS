import React from 'react';
import { ABILITY_DEFS } from '@/lib/commandLab';

// 路由编辑器共用小件：分段选择器 + 动作描述
export const Seg = ({ options, value, onPick }) => (
  <div className="flex gap-1 flex-wrap">
    {options.map(([v, lbl]) => {
      const active = v === value || (v === null && value == null);
      return (
        <button
          key={String(v)}
          onClick={() => onPick(v)}
          className={`text-[10px] rounded px-1.5 py-0.5 border ${active ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-500 border-slate-200 hover:border-slate-300'}`}
        >
          {lbl}
        </button>
      );
    })}
  </div>
);

export const ACTION_LABELS = { attack: '攻击目标', move: '移动到点', follow: '跟随目标' };

export const describeDo = (d) =>
  d?.type === 'ability'
    ? `施放「${ABILITY_DEFS[d.ability]?.label || d.ability || '?'}」`
    : ACTION_LABELS[d?.type] || '—';