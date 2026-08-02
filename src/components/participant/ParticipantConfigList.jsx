import React from 'react';
import { Plus, Users } from 'lucide-react';

export default function ParticipantConfigList({ records, activeId, onSelect, onCreate }) {
  return <aside className="w-60 shrink-0 border-r border-[#2A2E37] bg-[#15171C] flex flex-col min-h-0">
    <div className="h-10 px-3 border-b border-[#2A2E37] flex items-center justify-between text-xs font-semibold">
      参与者拓扑
      <button onClick={onCreate} aria-label="新建参与者配置" className="p-1 rounded hover:bg-[#242a32]"><Plus className="w-4 h-4" /></button>
    </div>
    <div className="flex-1 overflow-y-auto">
      {records.map((r) => <button key={r.id} onClick={() => onSelect(r.id)} className={`w-full px-3 py-2 border-b border-[#2A2E37] text-left flex gap-2 ${activeId === r.id ? 'bg-[#242a32] text-gray-100' : 'text-gray-400 hover:bg-[#171b21]'}`}>
        <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span className="min-w-0 text-[11px] truncate">{r.label || r.config_id}<small className="block text-[10px] text-gray-600 truncate">{r.map_id}</small></span>
      </button>)}
      {!records.length && <p className="p-3 text-[11px] text-gray-600">尚无参与者配置。</p>}
    </div>
  </aside>;
}