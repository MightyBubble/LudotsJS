import React from 'react';
import RepresentativeEntitiesEditor from './RepresentativeEntitiesEditor';
import BindingEditor from './BindingEditor';
import RelationshipEditor from './RelationshipEditor';

export default function ParticipantConfigDetails({ value, prototypes, onChange }) {
  const set = (key, next) => onChange({ ...value, [key]: next });
  const rel = value.participant_relationships;
  const setRel = (key, next) => set('participant_relationships', { ...rel, [key]: next });
  return <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">
    <RepresentativeEntitiesEditor rows={value.entities} prototypes={prototypes} onChange={(v) => set('entities', v)} />
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <BindingEditor kind="team" rows={value.teams} entities={value.entities} teams={value.teams} onChange={(v) => set('teams', v)} />
      <BindingEditor kind="player" rows={value.players} entities={value.entities} teams={value.teams} onChange={(v) => set('players', v)} />
    </div>
    <h2 className="text-[10px] uppercase tracking-wider text-gray-500 pt-1">Participant Relationships（实体关系是真相，lookup 仅为派生缓存）</h2>
    <RelationshipEditor kind="teams" rows={rel.teams} onChange={(v) => setRel('teams', v)} />
    <RelationshipEditor kind="players" rows={rel.players} onChange={(v) => setRel('players', v)} />
    <RelationshipEditor kind="player_teams" rows={rel.player_teams} onChange={(v) => setRel('player_teams', v)} />
  </div>;
}