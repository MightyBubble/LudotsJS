import React, { useRef, useState } from 'react';
import RuntimeCommandButton from './RuntimeCommandButton';

/** 运行时面板渲染：按 runtime 解析结果落位按钮，点击即产出激活意图。fixed 模式支持拖拽换位。 */
export default function RuntimePanelView({ result, onActivate, onSwapSlots, onResetSlots, hasOverrides }) {
  const columns = result.grid?.columns || 4;
  const visibleRows = result.grid?.visible_rows || null;
  const swappable = result.mode === 'fixed' && !!onSwapSlots;
  const [dragging, setDragging] = useState(null);
  const draggingRef = useRef(null);

  return (
    <div className="space-y-3">
      {swappable && (
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <span>拖拽按钮可交换栏位（写入运行时覆盖表，不影响配置）</span>
          {hasOverrides && (
            <button onClick={onResetSlots} className="text-[#cbd3dc] underline">重置为出厂预设</button>
          )}
        </div>
      )}
      <div
        className="inline-block bg-[#0D0F14] border border-[#2A2E37] rounded p-2 overflow-y-auto"
        style={{ maxHeight: visibleRows ? `${visibleRows * 76 + 16}px` : undefined }}
      >
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, 64px)` }}
        >
          {result.buttons.map(b => (
            <div
              key={b.button_id}
              draggable={swappable}
              onDragStart={() => { draggingRef.current = b.slot_id; setDragging(b.slot_id); }}
              onDragEnd={() => { draggingRef.current = null; setDragging(null); }}
              onDragOver={(e) => { if (swappable && draggingRef.current && draggingRef.current !== b.slot_id) e.preventDefault(); }}
              onDrop={() => {
                const from = draggingRef.current;
                if (from && from !== b.slot_id) onSwapSlots(from, b.slot_id);
                draggingRef.current = null;
                setDragging(null);
              }}
              className={dragging === b.slot_id ? 'opacity-40' : ''}
            >
              <RuntimeCommandButton button={b} onActivate={onActivate} />
            </div>
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