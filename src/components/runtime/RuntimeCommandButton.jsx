import React from 'react';

/** 单个命令按钮的可视化呈现：图标格 + 快捷键角标 + actor 数量角标。 */
export default function RuntimeCommandButton({ button, onActivate }) {
  const ability = button.ability || {};
  const accent = button.unavailable ? '#6b7280' : (ability.accentColor || '#cbd3dc');
  const hotkey = (button.action_id || '').split('.').pop();
  return (
    <button
      onClick={() => onActivate(button)}
      title={[ability.hintText, ...button.trace].filter(Boolean).join('\n')}
      className={`relative aspect-square w-full rounded bg-[#1E2128] border border-[#424a55] hover:border-[#cbd3dc] transition-colors flex flex-col items-center justify-center gap-1 p-1 ${button.unavailable ? 'opacity-45 grayscale' : ''}`}
      style={{ boxShadow: `inset 0 0 0 1px ${accent}22` }}
    >
      <span className="text-xl leading-none" style={{ color: accent }}>{ability.iconGlyph || '?'}</span>
      <span className="text-[10px] text-gray-300 leading-tight text-center truncate w-full px-0.5">
        {ability.displayName || button.ability_id}
      </span>
      {hotkey && (
        <span className="absolute top-0.5 left-1 text-[9px] font-mono text-gray-500">{hotkey}</span>
      )}
      {button.actors.length > 1 && (
        <span className="absolute bottom-0.5 right-1 text-[9px] font-mono text-[#E2D8B3]">×{button.actors.length}</span>
      )}
    </button>
  );
}