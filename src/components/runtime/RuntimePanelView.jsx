import React from 'react';

/** 运行时面板渲染：按 runtime 解析结果落位按钮，点击即产出激活意图。 */
export default function RuntimePanelView({ result, onActivate }) {
  const columns = result.grid?.columns || 4;
  return (
    <div className="space-y-3">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {result.buttons.map(b => (
          <button
            key={b.button_id}
            onClick={() => onActivate(b)}
            title={b.trace.join('\n')}
            className="text-left bg-[#1E2128] border border-[#424a55] hover:border-[#cbd3dc] rounded p-2 min-h-[64px]"
          >
            <div className="text-[11px] text-[#e5e5e5] truncate">{b.ability?.displayName || b.ability_id}</div>
            <div className="text-[10px] text-gray-500 truncate">{b.action_id || '无快捷键'}</div>
            <div className="text-[10px] text-gray-600">{b.actors.length} actor{b.slot_id ? ` · ${b.slot_id}` : ''}</div>
          </button>
        ))}
      </div>
      {result.buttons.length === 0 && <p className="text-[11px] text-gray-500">当前实体列表在此面板上没有任何按钮落位。</p>}
      {result.errors.length > 0 && (
        <div className="text-[10px] text-red-400 space-y-0.5">
          {result.errors.map((e, i) => <div key={i}>⚠ {e.reason} · {e.slot_id || e.entity_id} {e.role_id || e.ability_id || ''}</div>)}
        </div>
      )}
    </div>
  );
}