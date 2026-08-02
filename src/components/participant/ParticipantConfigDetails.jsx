import React from 'react';
import BindingEditor from './BindingEditor';
import RelationshipEditor from './RelationshipEditor';
import { Section, SelectField, TextField } from '@/components/ludots/ui';

export default function ParticipantConfigDetails({ value, maps, map, onChange, error }) {
  const rel = value.participant_relationships;
  const setRel = (key, next) => onChange({ participant_relationships: { ...rel, [key]: next } });
  const entities = map?.entities || [];
  return <div className="max-w-4xl">
    {error && <p className="mb-3 text-xs text-red-300">{error}</p>}
    <Section title="基础信息">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Config ID" value={value.config_id} onChange={config_id => onChange({ config_id })} />
        <TextField label="名称" value={value.label} onChange={label => onChange({ label })} />
      </div>
      <SelectField label="Map Config" value={value.map_id} options={maps.map(item => ({ value: item.map_id, label: item.label || item.map_id }))} onChange={map_id => onChange({ map_id, teams: [], players: [] })} hint="参与者只能引用所选 Map Config 中已存在的实体。" />
    </Section>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <BindingEditor kind="team" rows={value.teams} entities={entities} teams={value.teams} onChange={teams => onChange({ teams })} />
      <BindingEditor kind="player" rows={value.players} entities={entities} teams={value.teams} onChange={players => onChange({ players })} />
    </div>
    <Section title="Participant Relationships">
      <p className="text-xs text-gray-500">实体关系是真相，lookup 仅为派生缓存。</p>
      <RelationshipEditor kind="teams" rows={rel.teams} onChange={v => setRel('teams', v)} />
      <RelationshipEditor kind="players" rows={rel.players} onChange={v => setRel('players', v)} />
      <RelationshipEditor kind="player_teams" rows={rel.player_teams} onChange={v => setRel('player_teams', v)} />
    </Section>
  </div>;
}