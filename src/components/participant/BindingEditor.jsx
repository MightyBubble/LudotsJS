import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';
import { S } from '@/components/shell/ui';

export default function BindingEditor({ kind, rows, entities, teams, onChange }) {
  const player = kind === 'player';
  const patch = (i, key, value) => onChange(rows.map((r, n) => n === i ? { ...r, [key]: value } : r));
  const add = () => onChange([...rows, player ? { player_id: rows.length + 1, team_id: teams[0]?.team_id || 1, representative_instance_id: entities[0]?.instance_id || '' } : { team_id: rows.length + 1, representative_instance_id: entities[0]?.instance_id || '' }]);
  return <Section title={player ? 'Players' : 'Teams'} right={<Button aria-label={`添加 ${player ? 'Player' : 'Team'}`} size="sm" onClick={add} disabled={!entities.length} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加</Button>}>
    {!entities.length && <p className={S.hint}>请先在所选 Map Config 中添加实体。</p>}
    <div className="space-y-2">{rows.map((r, i) => <div key={i} className={`grid ${player ? 'grid-cols-[80px_80px_1fr_auto]' : 'grid-cols-[80px_1fr_auto]'} gap-2`}>
      <input aria-label={`${player ? 'Player' : 'Team'} ${i + 1} ID`} className={`${S.input} rounded border px-2`} type="number" min="1" value={player ? r.player_id : r.team_id} onChange={e => patch(i, player ? 'player_id' : 'team_id', Number(e.target.value))} />
      {player && <select aria-label={`Player ${i + 1} Team`} className={`${S.select} rounded border px-2`} value={r.team_id} onChange={e => patch(i, 'team_id', Number(e.target.value))}>{teams.map(t => <option key={t.team_id} value={t.team_id}>Team {t.team_id}</option>)}</select>}
      <select aria-label={`${player ? 'Player' : 'Team'} ${i + 1} Representative`} className={`${S.select} rounded border px-2`} value={r.representative_instance_id} onChange={e => patch(i, 'representative_instance_id', e.target.value)}>{entities.map(e => <option key={e.instance_id} value={e.instance_id}>{e.instance_id || '未命名实体'}</option>)}</select>
      <Button aria-label={`删除 ${player ? 'Player' : 'Team'} ${i + 1}`} size="icon" variant="ghost" onClick={() => onChange(rows.filter((_, n) => n !== i))} className="h-7 w-7 text-red-400"><Trash2 className="w-3 h-3" /></Button>
    </div>)}</div>
  </Section>;
}