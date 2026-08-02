import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { S } from '@/components/shell/ui';

export default function MapEntityInspector({ entities, selectedId, onSelect, onPatch, onRemove }) {
  const selected = entities.find(e => e.instance_id === selectedId);
  return <aside className="w-64 shrink-0 border-l border-[#2A2E37] bg-[#15171C] flex flex-col min-h-0">
    <div className="px-3 py-2 border-b border-[#2A2E37] text-[10px] uppercase tracking-wider text-gray-500">已放置实体 · {entities.length}</div>
    <div className="flex-1 min-h-0 overflow-y-auto">
      {entities.length === 0 && <p className="px-3 py-2 text-[11px] text-gray-600">选中左侧模板后点击场景放置实体。</p>}
      {entities.map(entity => <button key={entity.instance_id} onClick={() => onSelect(entity.instance_id)}
        className={`w-full px-3 py-2 text-left text-[11px] border-b border-[#2A2E37] ${entity.instance_id === selectedId ? 'bg-[#242a32] text-gray-100' : 'text-gray-400 hover:bg-[#171b21]'}`}>
        <span className="block truncate">{entity.instance_id}</span>
        <span className="block text-[10px] text-gray-600 truncate">{entity.template} · ({entity.position?.x ?? 0}, {entity.position?.y ?? 0})</span>
      </button>)}
    </div>
    {selected && <div className="border-t border-[#2A2E37] p-3 space-y-2">
      <div>
        <label className="text-[10px] text-gray-500 flex items-center gap-1.5 mb-1"><b className="text-gray-300">33</b> Instance ID</label>
        <Input aria-label="Instance ID" className={S.input} value={selected.instance_id} onChange={e => onPatch(selected.instance_id, { instance_id: e.target.value })} />
      </div>
      <p className="text-[10px] text-gray-500"><b className="text-gray-300">34</b> Template: <span className="text-gray-300">{selected.template}</span></p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 flex items-center gap-1.5 mb-1"><b className="text-gray-300">35</b> Position X</label>
          <Input aria-label="Position X" type="number" className={S.input} value={selected.position?.x ?? 0} onChange={e => onPatch(selected.instance_id, { position: { ...selected.position, x: Number(e.target.value) } })} />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 flex items-center gap-1.5 mb-1"><b className="text-gray-300">35</b> Position Y</label>
          <Input aria-label="Position Y" type="number" className={S.input} value={selected.position?.y ?? 0} onChange={e => onPatch(selected.instance_id, { position: { ...selected.position, y: Number(e.target.value) } })} />
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={() => onRemove(selected.instance_id)} className="h-7 w-full text-red-400"><Trash2 className="w-3 h-3" />移除该实体</Button>
    </div>}
  </aside>;
}