import React from 'react';

const cls = 'bg-[#0D0F14] border border-[#424a55] rounded px-2 py-1 text-[11px] text-gray-200';

export default function MapSelector({ maps, mapId, onChange }) {
  return <div className="flex items-center gap-2">
    <span className="text-[10px] text-gray-500">地图</span>
    <select aria-label="地图" className={cls} value={mapId} onChange={(e) => onChange(e.target.value)}>
      {!maps.length && <option value="">无可用地图</option>}
      {maps.map((map) => <option key={map.id} value={map.id}>{map.label || map.map_id} · {map.map_id}</option>)}
    </select>
  </div>;
}