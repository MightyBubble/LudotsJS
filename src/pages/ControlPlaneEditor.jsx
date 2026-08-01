import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import ControlPlaneDetails from '@/components/controlPlane/ControlPlaneDetails';

export default function ControlPlaneEditorPage() {
  const { data: queryGraphs = [] } = useQuery({
    queryKey: ['entity-queries'],
    queryFn: () => base44.entities.EntityQuery.list('query_name'),
    initialData: [],
  });
  const { data: collections = [] } = useQuery({
    queryKey: ['entity-collections'],
    queryFn: () => base44.entities.EntityCollection.list('collection_key'),
    initialData: [],
  });
  const editor = useRecordEditor('ControlPlaneProfile', 'control-plane-profiles', () => ({
    control_plane_id: `ControlPlane.${Date.now()}`,
    entity_query_graph_ref: queryGraphs[0]?.query_name || '',
    output_collection_key: '',
  }));

  return <RecordWorkspace entityName="ControlPlaneProfile" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'control_plane_id', label: 'Control Plane ID', width: 260 },
      { key: 'entity_query_graph_ref', label: 'Entity Query Graph', width: 240 },
      { key: 'output_collection_key', label: '投影到集合' },
    ]}
    toItem={record => ({ id: record.id, name: record.control_plane_id, subtitle: `${record.entity_query_graph_ref || '未选择查询图'} → ${record.output_collection_key || '未投影'}` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.control_plane_id}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <ControlPlaneDetails draft={editor.draft} patch={editor.patch} queryGraphs={queryGraphs} collections={collections} />}
  </RecordWorkspace>;
}