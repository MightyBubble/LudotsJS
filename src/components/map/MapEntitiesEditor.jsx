import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Section } from '@/components/ludots/ui';
import { S } from '@/components/shell/ui';

export default function MapEntitiesEditor({ rows = [], prototypes, onChange }) {
  const patch = (index, key, value) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const add = () => onChange([...rows, { instance_id: '', prototype_id: prototypes[0]?.prototype_id || '', spatial: false }]);
  return <Section title="Map 实体" right={<Button size="sm" onClick={add} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加实体</Button>}>
    <p className={S.hint}>这里维护 MapConfig.Entities；参与者配置只能引用这些实例。</p>
    <div className="space-y-2">{rows.map((row, index) => <div key={index} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-center">
      <Input aria-label={`实体 ${index + 1} Instance ID`} className={S.input} placeholder="Instance ID" value={row.instance_id} onChange={e => patch(index, 'instance_id', e.target.value)} />
      <select aria-label={`实体 ${index + 1} Prototype`} className={`${S.select} rounded border px-2`} value={row.prototype_id} onChange={e => patch(index, 'prototype_id', e.target.value)}>{prototypes.map(p => <option key={p.id} value={p.prototype_id}>{p.name || p.prototype_id}</option>)}</select>
      <label className="flex items-center gap-1 text-xs text-gray-400"><input type="checkbox" checked={row.spatial} onChange={e => patch(index, 'spatial', e.target.checked)} />空间实体</label>
      <Button aria-label={`删除实体 ${index + 1}`} size="icon" variant="ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="h-7 w-7 text-red-400"><Trash2 className="w-3 h-3" /></Button>
    </div>)}</div>
  </Section>;
}