import React from 'react';

const TEAM_HEX = { 1: '#3b82f6', 2: '#ef4444' };

// 切换控制单位：对称双阵营，可控任意存活单位（Tab 循环）
export default function UnitSwitcher({ units, controlledId, onSwitch }) {
  return (
    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg border border-slate-200 p-2 space-y-1.5">
      <div className="text-[9px] font-medium text-slate-400">控制单位（Tab 循环）</div>
      {[1, 2].map((team) => (
        <div key={team} className="flex gap-1">
          {units.filter((u) => u.team === team).map((u) => {
            const active = u.id === controlledId;
            const hex = TEAM_HEX[team];
            return (
              <button
                key={u.id}
                disabled={!u.alive}
                onClick={() => onSwitch(u.id)}
                className={`text-[10px] font-bold rounded px-2 py-1 border transition-colors ${!u.alive ? 'opacity-30' : ''}`}
                style={{
                  borderColor: hex,
                  backgroundColor: active ? hex : 'transparent',
                  color: active ? '#fff' : hex,
                }}
              >
                {u.id}
                <span className="block text-[8px] font-normal">{Math.ceil(u.health)}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}