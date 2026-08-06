/** 预设面板：选中信息。展示单个选中实体的图标、名称、属性数值与标签徽章（由 UIItemPresentationProfile 驱动）。 */
export default function RuntimeSelectionInfoPanel({ entity, display }) {
  if (!entity) return <p className="p-2 text-[11px] text-gray-500">当前没有选中实体。</p>;
  const d = display || {};
  return <div className="space-y-2 p-2">
    <div className="flex items-center gap-2">
      {d.iconGlyph && <span className="text-2xl leading-none" style={{ color: d.accentColor || undefined }}>{d.iconGlyph}</span>}
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold text-gray-100">{d.title || entity.name || entity.prototype_id}</div>
        {d.subtitle && <div className="truncate text-[10px] text-gray-500">{d.subtitle}</div>}
      </div>
    </div>
    {d.badges?.length > 0 && <div className="flex flex-wrap gap-1">
      {d.badges.map(badge => <span key={badge} className="rounded bg-[#303845] px-1.5 py-0.5 text-[9px] text-gray-300">{badge}</span>)}
    </div>}
    {d.stats?.length > 0 && <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
      {d.stats.map(stat => <div key={stat.attribute_id} className="flex items-baseline justify-between gap-2 text-[10px]">
        <dt className="text-gray-500">{stat.label || stat.attribute_id}</dt>
        <dd className="text-gray-200">{stat.value}</dd>
      </div>)}
    </dl>}
    {d.body && <p className="text-[10px] leading-relaxed text-gray-400">{d.body}</p>}
  </div>;
}
