import React from 'react';
import { ABILITY_DEFS, ACTION_BINDINGS } from '@/lib/commandLab';

// LOL 式技能栏：方形技能格 + 角标键位 + 冷却扫黑（自下而上）+ 剩余秒数 + 就绪金边/施法发光
export default function SkillBar({ state, unit, onPress, onRelease }) {
  const time = state.time;
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg p-px bg-gradient-to-b from-amber-300/60 via-amber-500/40 to-amber-700/30 shadow-2xl">
      <div className="flex items-end gap-1 rounded-[7px] bg-black/85 backdrop-blur px-2 py-2">
        {Object.entries(ACTION_BINDINGS).filter(([, b]) => b.ability).map(([tag, b]) => {
          const id = b.ability;
          const def = ABILITY_DEFS[id];
          const cdTag = (unit?.timedTags || []).find((t) => t.tag === `Cooldown.${id}` && t.until > time);
          const rem = cdTag ? cdTag.until - time : 0;
          const frac = cdTag ? Math.min(1, rem / (def.cooldown || 1)) : 0;
          const active = unit?.ability?.id === id;
          const bound = unit?.skillTargets?.[id];
          return (
            <button
              key={tag}
              onPointerDown={(e) => onPress(tag, e.shiftKey)}
              onPointerUp={() => onRelease(tag)}
              onPointerLeave={() => onRelease(tag)}
              className="relative w-[52px] h-[52px] rounded-[4px] overflow-hidden border transition-transform active:scale-95 select-none"
              style={{
                borderColor: active ? '#fbbf24' : cdTag ? '#3e3e4a' : `${def.color}99`,
                boxShadow: active ? '0 0 12px #fbbf2470' : 'none',
              }}
              title={`${def.label}${def.cooldown ? ` · 冷却 ${def.cooldown}s` : ''}${def.stages.length > 1 ? ` · ${def.stages.length} 段连击` : ''}`}
            >
              {/* 技能底色 */}
              <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${def.color}d8 0%, ${def.color}55 55%, #000 130%)` }} />
              {/* 名称 */}
              <span
                className="absolute inset-x-0 top-1.5 text-center text-[10px] font-bold leading-tight px-0.5"
                style={{ color: '#f8f8fb', textShadow: '0 1px 2px rgba(0,0,0,0.8)', opacity: cdTag ? 0.5 : 1 }}
              >
                {def.label}
              </span>
              {/* 冷却扫黑 + 秒数 */}
              {cdTag && (
                <>
                  <div className="absolute inset-x-0 bottom-0 bg-black/75" style={{ height: `${frac * 100}%` }} />
                  <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-bold" style={{ color: '#fcd34d', textShadow: '0 1px 3px #000' }}>
                    {rem.toFixed(1)}
                  </span>
                </>
              )}
              {/* 键位角标 */}
              <kbd className="absolute bottom-0 right-0 rounded-tl-[4px] border-t border-l border-amber-400/50 bg-black/85 px-1 py-px font-mono text-[9px] font-bold" style={{ color: '#fbbf24' }}>
                {def.input}
              </kbd>
              {/* 绑定目标角标 */}
              {bound && (
                <span className="absolute top-0 left-0 rounded-br-[4px] bg-black/85 px-1 py-px text-[8px] font-bold" style={{ color: '#f8f8fb' }}>
                  →{bound}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}