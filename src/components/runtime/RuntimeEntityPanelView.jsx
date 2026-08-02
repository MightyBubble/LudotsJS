import React from 'react';

export default function RuntimeEntityPanelView({ result }) {
  const columns = Math.max(result.profile.layout.columns || 4, 1);
  const rows = result.profile.layout.visible_rows;
  return <div className="overflow-y-auto" style={{ maxHeight: rows ? `${rows * 72}px` : '240px' }}>
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(64px, 1fr))` }}>
      {result.cards.map(card => <button key={card.key} className="min-h-16 rounded border border-[#424a55] bg-[#242a32] p-2 text-left hover:bg-[#303845]">
        <div className="truncate text-[11px] text-gray-200">{card.label}</div>
        <div className="mt-1 text-[10px] text-gray-500">{card.count > 1 ? `× ${card.count}` : card.entities[0]?.prototype_id}</div>
      </button>)}
    </div>
    {!result.cards.length && <p className="p-2 text-[11px] text-gray-500">当前集合没有符合 Profile 的实体。</p>}
  </div>;
}