import React from 'react';

const cls = 'bg-[#0D0F14] border border-[#424a55] rounded px-2 py-1 text-[11px] text-gray-200';
export default function ParticipantViewSelector({ topologies, topologyId, onTopology, mode, onMode, viewId, onView }) {
  const topology = topologies.find((x) => x.id === topologyId);
  const options = mode === 'Players' ? topology?.players || [] : topology?.teams || [];
  return <div className="flex items-center gap-2">
    <span className="text-[10px] text-gray-500">参与者配置</span>
    <select aria-label="参与者配置" className={cls} value={topologyId} onChange={(e) => onTopology(e.target.value)}><option value="">未绑定</option>{topologies.map((t) => <option key={t.id} value={t.id}>{t.label || t.config_id}</option>)}</select>
    <select aria-label="视图模式" className={cls} value={mode} onChange={(e) => onMode(e.target.value)}><option value="Players">Players</option><option value="Teams">Teams</option></select>
    <select aria-label="Participant View" className={cls} value={viewId} onChange={(e) => onView(Number(e.target.value))} disabled={!options.length}>
      {!options.length && <option value="">无参与者</option>}
      {options.map((x) => { const id = mode === 'Players' ? x.player_id : x.team_id; return <option key={id} value={id}>{mode === 'Players' ? 'Player' : 'Team'} {id}</option>; })}
    </select>
  </div>;
}