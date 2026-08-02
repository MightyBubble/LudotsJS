export const blankTopology = (mapId, scope = {}) => ({
  config_id: `participants_${Date.now()}`,
  label: '新参与者配置',
  map_id: mapId || '',
  ...scope,
  teams: [],
  players: [],
  participant_relationships: { teams: [], players: [], player_teams: [] },
});

export const validateTopology = (v, map) => {
  if (!v?.config_id?.trim() || !v.map_id?.trim()) return 'Config ID 和 Map Config 必填。';
  if (!map) return '引用的 Map Config 不存在。';
  const refs = new Set((map.entities || []).map(entity => entity.instance_id));
  if ([...v.teams, ...v.players].some(item => !refs.has(item.representative_instance_id))) return 'Team / Player 的 Representative 必须引用所选 Map Config 中的实体。';
  if (new Set(v.teams.map(item => item.team_id)).size !== v.teams.length) return 'Team ID 必须唯一。';
  if (new Set(v.players.map(item => item.player_id)).size !== v.players.length) return 'Player ID 必须唯一。';
  if (v.players.some(item => !v.teams.some(team => team.team_id === item.team_id))) return '每个 Player 都必须引用已声明的 Team。';
  return '';
};