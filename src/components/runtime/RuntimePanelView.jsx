import React from 'react';
import RuntimeCommandButton from './RuntimeCommandButton';

/** 运行时面板渲染：按 runtime 解析结果落位按钮，点击即产出激活意图。 */
export default function RuntimePanelView({ result, onActivate }) {
  const columns = result.grid?.columns || 4;
  const visibleRows = result.grid?.visible_rows || null;
  return (
    <div className="space-y-3">
      <div
        className="inline-block bg-[#0D0F14] border border-[#2A2E37] rounded p-2 overflow-y-auto"
        style={{ maxHeight: visibleRows ? `${visibleRows * 76 + 16}px` : undefined }}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, 64px)` }}
        >
          {result.buttons.map(b => (
            <RuntimeCommandButton key={b.button_id} button={b} onActivate={onActivate} />
          ))}
        </div>
        {result.buttons.length === 0 && (
          <p className="text-[11px] text-gray-500 px-1">当前实体列表在此面板上没有任何按钮落位。</p>
        )}
      </div>
      {result.errors.length > 0 && (
        <div className="text-[10px] text-red-400 space-y-0.5">
          {result.errors.map((e, i) => <div key={i}>⚠ {e.reason} · {e.slot_id || e.entity_id} {e.role_id || e.ability_id || ''}</div>)}
        </div>
      )}
    </div>
  );
}