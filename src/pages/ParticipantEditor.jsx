import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import ParticipantConfigDetails from '@/components/participant/ParticipantConfigDetails';
import { blankTopology, validateTopology } from '@/components/participant/participantModel';

export default function ParticipantEditor() {
  const scope = useProjectScope();
  const [error, setError] = useState('');
  const { data: allMaps = [] } = useQuery({ queryKey: ['map-configs', scope.projectId], queryFn: () => base44.entities.MapConfig.list('-updated_date'), initialData: [] });
  const maps = allMaps.filter(scope.inScope);
  const editor = useRecordEditor('ParticipantTopology', 'participant-topologies', () => blankTopology(maps[0]?.map_id, scope.newScopeFields()));
  const records = editor.records.filter(scope.inScope);
  const map = maps.find(item => item.map_id === editor.draft?.map_id);
  const create = () => maps.length ? editor.create() : setError('请先在 Map Config 中创建地图配置。');
  const save = () => { const message = validateTopology(editor.draft, map); if (message) return setError(message); setError(''); editor.save(); };
  return <RecordWorkspace entityName="ParticipantTopology" records={records} hideBrowserOnMobile
    columns={[{ key: 'config_id', label: 'Config ID', width: 240 }, { key: 'label', label: '名称' }, { key: 'map_id', label: 'Map' }, { key: 'teams', label: 'Teams', render: r => r.teams?.length || 0 }, { key: 'players', label: 'Players', render: r => r.players?.length || 0 }]}
    toItem={r => ({ id: r.id, name: r.label || r.config_id, subtitle: `${r.map_id} · ${r.players?.length || 0} Players` })}
    selectedId={editor.selectedId} onSelect={r => { setError(''); editor.setSelectedId(r.id); }} onCreate={create}
    onDelete={r => window.confirm(`确定删除「${r.label || r.config_id}」吗？`) && editor.remove(r.id)} onSave={save} dirty={editor.dirty}
    emptyHint={maps.length ? '从左侧选择或新建参与者配置' : '请先在 Map Config 中创建地图配置'}>
    {editor.draft && <ParticipantConfigDetails value={editor.draft} maps={maps} map={map} onChange={editor.patch} error={error} />}
  </RecordWorkspace>;
}