import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';

const cls = 'bg-[#0D0F14] border border-[#424a55] rounded px-2 py-1 text-[11px] text-gray-200 min-w-0';
const spec = {
  teams: { title: 'Team ↔ Team', a: 'team_a', b: 'team_b', attitude: true },
  players: { title: 'Player ↔ Player', a: 'player_a', b: 'player_b', attitude: false },
  player_teams: { title: 'Player → Team', a: 'player_id', b: 'team_id', attitude: true },
};
export default function RelationshipEditor({ kind, rows, onChange }) {
  const s = spec[kind];
  const patch = (i, key, value) => onChange(rows.map((r, n) => n === i ? { ...r, [key]: value } : r));
  const add = () => onChange([...rows, { [s.a]: 1, [s.b]: 1, type_id: '', ...(s.attitude ? { attitude: '' } : {}), symmetric: kind !== 'player_teams' }]);
  return <Section title={s.title} right={<Button aria-label={`添加 ${s.title}`} size="sm" onClick={add} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加</Button>}>
    <div className="space-y-2">{rows.map((r, i) => <div key={i} className={`grid ${s.attitude ? 'grid-cols-[64px_64px_1fr_1fr_auto_auto]' : 'grid-cols-[64px_64px_1fr_auto_auto]'} gap-2 items-center`}>
      <input aria-label={`${s.title} ${i + 1} A`} className={cls} type="number" min="1" value={r[s.a]} onChange={(e) => patch(i, s.a, Number(e.target.value))} />
      <input aria-label={`${s.title} ${i + 1} B`} className={cls} type="number" min="1" value={r[s.b]} onChange={(e) => patch(i, s.b, Number(e.target.value))} />
      <input aria-label={`${s.title} ${i + 1} Type`} className={cls} placeholder="Type ID" value={r.type_id} onChange={(e) => patch(i, 'type_id', e.target.value)} />
      {s.attitude && <input aria-label={`${s.title} ${i + 1} Attitude`} className={cls} placeholder="Attitude" value={r.attitude} onChange={(e) => patch(i, 'attitude', e.target.value)} />}
      <label className="text-[10px] flex gap-1"><input type="checkbox" checked={r.symmetric} onChange={(e) => patch(i, 'symmetric', e.target.checked)} />对称</label>
      <Button aria-label={`删除 ${s.title} ${i + 1}`} size="icon" variant="ghost" onClick={() => onChange(rows.filter((_, n) => n !== i))} className="h-7 w-7 text-red-400"><Trash2 className="w-3 h-3" /></Button>
    </div>)}</div>
  </Section>;
}