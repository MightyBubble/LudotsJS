import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import ActorProjectionDetails from '@/components/controlPlane/ActorProjectionDetails';

export default function ActorProjectionEditorPage() {
  const { data: queryGraphs = [] } = useQuery({
    queryKey: ['entity-queries'],
    queryFn: () => base44.entities.EntityQuery.list('query_name'),
    initialData: [],
  });
  const { data: controlPlanes = [] } = useQuery({
    queryKey: ['control-plane-profiles'],
    queryFn: () => base44.entities.ControlPlaneProfile.list('control_plane_id'),
    initialData: [],
  });

  const editor = useRecordEditor('ActorProjection', 'actor-projections', () => ({
    collection_key: `Selection.${Date.now()}`,
    control_plane_ref: controlPlanes[0]?.control_plane_id || '',
  }));

  return <RecordWorkspace entityName="ActorProjection" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'collection_key', label: '投影键', width: 240 },
      { key: 'control_plane_ref', label: '控制面', width: 220 },
      { key: 'entity_query_graph_ref', label: '投影规则' },
    ]}
    toItem={record => ({ id: record.id, name: record.collection_key, subtitle: record.label || record.entity_query_graph_ref || '未配置投影规则' })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.collection_key}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <ActorProjectionDetails draft={editor.draft} patch={editor.patch}
      queryGraphs={queryGraphs} controlPlanes={controlPlanes} />}
  </RecordWorkspace>;
}