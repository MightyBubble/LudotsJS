import React from 'react';
import RuntimeEntityCard from './RuntimeEntityCard';

export default function RuntimeEntityPanelView({ result }) {
  const columns = Math.max(result.profile.layout.columns || 4, 1);
  const rows = result.profile.layout.visible_rows;
  return <div className="overflow-y-auto" style={{ maxHeight: rows ? `${rows * 72}px` : '240px' }}>
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(64px, 1fr))` }}>
      {result.cards.map(card => <RuntimeEntityCard key={card.key} card={card} />)}
    </div>
    {!result.cards.length && <p className="p-2 text-[11px] text-gray-500">当前集合没有符合 Profile 的实体。</p>}
  </div>;
}