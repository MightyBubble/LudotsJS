export const blankTopology = (scope = {}) => ({
  config_id: `participants_${Date.now()}`,
  label: '新参与者配置',
  map_id: '',
  ...scope,
  entities: [],
  teams: [],
  players: [],
  participant_relationships: { teams: [], players: [], player_teams: [] },
});

export const validateTopology = (v) => {
  if (!v.config_id?.trim() || !v.map_id?.trim()) return '配置 ID 和 Map ID 必填。';
  const ids = v.entities.map((e) => e.instance_id.trim());
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) return '实体 Instance ID 必须非空且在地图内唯一。';
  const refs = new Set(ids);
  if ([...v.teams, ...v.players].some((x) => !refs.has(x.representative_instance_id))) return 'Team / Player 的 Representative 必须引用本配置中的地图实体。';
  if (new Set(v.teams.map((x) => x.team_id)).size !== v.teams.length) return 'Team ID 必须唯一。';
  if (new Set(v.players.map((x) => x.player_id)).size !== v.players.length) return 'Player ID 必须唯一。';
  if (v.players.some((x) => !v.teams.some((t) => t.team_id === x.team_id))) return '每个 Player 都必须引用已声明的 Team。';
  return '';
};