import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Section } from '@/components/ludots/ui';
import { S } from '@/components/shell/ui';

export default function MapEntitiesEditor({ rows = [], prototypes, onChange }) {
  const patch = (index, key, value) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const add = () => onChange([...rows, { instance_id: '', template: prototypes[0]?.prototype_id || '', position: { x: 0, y: 0 }, overrides: {}, performer_param_overrides: [] }]);
  return <Section title="Map 实体" right={<Button size="sm" onClick={add} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加实体</Button>}>
    <p className={S.hint}>这里维护 MapConfig.Entities；参与者配置只能引用这些实例。</p>
    <div className="space-y-2">{rows.map((row, index) => <div key={index} className="rounded border border-[#2A2E37] bg-[#0D0F14] p-3 space-y-2">
      <div className="grid grid-cols-[1fr_1fr_100px_100px_auto] gap-2 text-[10px] text-gray-500"><span><b className="text-gray-300">26</b> Instance ID</span><span><b className="text-gray-300">27</b> Template</span><span className="col-span-2"><b className="text-gray-300">28</b> Position X / Y</span></div>
      <div className="grid grid-cols-[1fr_1fr_100px_100px_auto] gap-2 items-center">
        <Input aria-label={`实体 ${index + 1} Instance ID`} className={S.input} placeholder="Instance ID" value={row.instance_id} onChange={e => patch(index, 'instance_id', e.target.value)} />
        <select aria-label={`实体 ${index + 1} Template`} className={`${S.select} rounded border px-2`} value={row.template} onChange={e => patch(index, 'template', e.target.value)}>{prototypes.map(p => <option key={p.id} value={p.prototype_id}>{p.name || p.prototype_id}</option>)}</select>
        <Input aria-label={`实体 ${index + 1} Position X`} type="number" className={S.input} value={row.position?.x ?? 0} onChange={e => patch(index, 'position', { ...row.position, x: Number(e.target.value) })} />
        <Input aria-label={`实体 ${index + 1} Position Y`} type="number" className={S.input} value={row.position?.y ?? 0} onChange={e => patch(index, 'position', { ...row.position, y: Number(e.target.value) })} />
        <Button aria-label={`删除实体 ${index + 1}`} size="icon" variant="ghost" onClick={() => onChange(rows.filter((_, i) => i !== index))} className="h-7 w-7 text-red-400"><Trash2 className="w-3 h-3" /></Button>
      </div>
      <p className="text-[10px] text-gray-500"><b className="text-gray-300">29</b> Overrides: {JSON.stringify(row.overrides || {})} · <b className="text-gray-300">30</b> Performer Params: {(row.performer_param_overrides || []).length}</p>
    </div>)}</div>
  </Section>;
}