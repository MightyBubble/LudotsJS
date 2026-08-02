import React from 'react';
import { Plus, X } from 'lucide-react';

const cls = 'bg-[#0D0F14] border border-[#424a55] rounded px-2 py-1 text-[11px] text-gray-200';
export default function RepresentativeEntitiesEditor({ rows, prototypes, onChange }) {
  const patch = (i, key, value) => onChange(rows.map((r, n) => n === i ? { ...r, [key]: value } : r));
  return <section className="border border-[#2A2E37] rounded bg-[#15171C]">
    <header className="px-3 py-2 border-b border-[#2A2E37] flex justify-between text-xs font-semibold">Map 实体 / 化身<button aria-label="添加 Map 实体" onClick={() => onChange([...rows, { instance_id: '', prototype_id: prototypes[0]?.prototype_id || '', spatial: false }])}><Plus className="w-4 h-4" /></button></header>
    <p className="px-3 pt-2 text-[10px] text-gray-600">Representative 必须来自 MapConfig.Entities；空间化身与纯逻辑身份共用同一绑定。</p>
    <div className="p-2 space-y-1.5">{rows.map((r, i) => <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
      <input aria-label={`实体 ${i + 1} Instance ID`} className={cls} placeholder="Instance ID" value={r.instance_id} onChange={(e) => patch(i, 'instance_id', e.target.value)} />
      <select aria-label={`实体 ${i + 1} Prototype`} className={cls} value={r.prototype_id} onChange={(e) => patch(i, 'prototype_id', e.target.value)}>{prototypes.map((p) => <option key={p.id} value={p.prototype_id}>{p.name || p.prototype_id}</option>)}</select>
      <label className="text-[10px] text-gray-400 flex gap-1"><input type="checkbox" checked={r.spatial} onChange={(e) => patch(i, 'spatial', e.target.checked)} />空间化身</label>
      <button aria-label={`删除实体 ${i + 1}`} onClick={() => onChange(rows.filter((_, n) => n !== i))}><X className="w-3.5 h-3.5" /></button>
    </div>)}</div>
  </section>;
}