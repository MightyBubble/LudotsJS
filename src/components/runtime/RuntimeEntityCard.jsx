import React from 'react';

export default function RuntimeEntityCard({ card }) {
  const display = card.display || {};
  return <button title={display.tooltip || display.body} className="min-h-16 rounded border border-[#424a55] bg-[#242a32] p-2 text-left hover:bg-[#303845]" style={{ borderColor: display.accentColor || undefined }}>
    <div className="flex items-center gap-1.5">
      {display.iconGlyph && <span style={{ color: display.accentColor || undefined }}>{display.iconGlyph}</span>}
      <span className="truncate text-[11px] text-gray-200">{display.title || card.key}</span>
    </div>
    {display.subtitle && <div className="truncate text-[9px] text-gray-500">{display.subtitle}</div>}
    <div className="mt-1 flex flex-wrap gap-1 text-[9px] text-gray-500">
      {card.count > 1 && <span>× {card.count}</span>}
      {display.badges?.map(value => <span key={value}>{value}</span>)}
      {display.stats?.map(stat => <span key={stat.attribute_id}>{stat.label ? `${stat.label} ` : ''}{stat.value}</span>)}
    </div>
  </button>;
}