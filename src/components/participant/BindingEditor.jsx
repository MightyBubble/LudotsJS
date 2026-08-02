import React from 'react';
import { Plus, X } from 'lucide-react';

const cls = 'bg-[#0D0F14] border border-[#424a55] rounded px-2 py-1 text-[11px] text-gray-200 min-w-0';
export default function BindingEditor({ kind, rows, entities, teams, onChange }) {
  const player = kind === 'player';
  const patch = (i, key, value) => onChange(rows.map((r, n) => n === i ? { ...r, [key]: value } : r));
  const add = () => onChange([...rows, player ? { player_id: rows.length + 1, team_id: teams[0]?.team_id || 1, representative_instance_id: entities[0]?.instance_id || '' } : { team_id: rows.length + 1, representative_instance_id: entities[0]?.instance_id || '' }]);
  return <section className="border border-[#2A2E37] rounded bg-[#15171C]">
    <header className="px-3 py-2 border-b border-[#2A2E37] flex justify-between text-xs font-semibold">{player ? 'Players' : 'Teams'}<button aria-label={`添加 ${player ? 'Player' : 'Team'}`} onClick={add}><Plus className="w-4 h-4" /></button></header>
    <div className="p-2 space-y-1.5">{rows.map((r, i) => <div key={i} className={`grid ${player ? 'grid-cols-[80px_80px_1fr_auto]' : 'grid-cols-[80px_1fr_auto]'} gap-2`}>
      <input aria-label={`${player ? 'Player' : 'Team'} ${i + 1} ID`} className={cls} type="number" min="1" value={player ? r.player_id : r.team_id} onChange={(e) => patch(i, player ? 'player_id' : 'team_id', Number(e.target.value))} />
      {player && <select aria-label={`Player ${i + 1} Team`} className={cls} value={r.team_id} onChange={(e) => patch(i, 'team_id', Number(e.target.value))}>{teams.map((t) => <option key={t.team_id} value={t.team_id}>Team {t.team_id}</option>)}</select>}
      <select aria-label={`${player ? 'Player' : 'Team'} ${i + 1} Representative`} className={cls} value={r.representative_instance_id} onChange={(e) => patch(i, 'representative_instance_id', e.target.value)}>{entities.map((e) => <option key={e.instance_id} value={e.instance_id}>{e.instance_id || '未命名实体'}</option>)}</select>
      <button aria-label={`删除 ${player ? 'Player' : 'Team'} ${i + 1}`} onClick={() => onChange(rows.filter((_, n) => n !== i))}><X className="w-3.5 h-3.5" /></button>
    </div>)}</div>
  </section>;
}