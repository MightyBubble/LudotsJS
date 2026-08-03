import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import EntityPanelProfileDetails from '@/components/entityPanel/EntityPanelProfileDetails';

export default function EntityPanelEditor() {
  const { data: collections = [] } = useQuery({ queryKey: ['entity-collections'], queryFn: () => base44.entities.EntityCollection.list('collection_key'), initialData: [] });
  const { data: queryGraphs = [] } = useQuery({ queryKey: ['entity-query-graphs'], queryFn: () => base44.entities.EntityQuery.list('query_name'), initialData: [] });
  const { data: itemProfiles = [] } = useQuery({ queryKey: ['ui-item-profiles', 'entity'], queryFn: () => base44.entities.UIItemPresentationProfile.filter({ item_kind: 'entity' }, 'profile_id'), initialData: [] });
  const editor = useRecordEditor('EntityPanelProfile', 'entity-panel-profiles', () => ({ panel_id: `entity_panel_${Date.now()}`, label: '', description: '', source: { collection_key: '' }, filter: { entity_query_graph_ref: '' }, layout: { mode: 'flat', columns: 4, visible_rows: null }, selection: { mode: 'multiple' } }));
  useEffect(() => { if (!editor.selectedId && editor.records[0]) editor.setSelectedId(editor.records[0].id); }, [editor.selectedId, editor.records]);
  return <RecordWorkspace entityName="EntityPanelProfile" records={editor.records} hideBrowserOnMobile
    columns={[{ key: 'panel_id', label: 'Panel ID', width: 240 }, { key: 'label', label: '显示名' }, { key: 'source', label: '集合', render: record => record.source?.collection_key }, { key: 'layout', label: '投影', render: record => record.layout?.mode }]}
    toItem={record => ({ id: record.id, name: record.label || record.panel_id, subtitle: `${record.source?.collection_key || '未设置集合'} · ${record.layout?.mode === 'aggregate' ? '聚合' : '平铺'}` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.panel_id}」吗？`) && editor.remove(record.id)} onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <EntityPanelProfileDetails draft={editor.draft} patch={editor.patch} collections={collections} queryGraphs={queryGraphs} itemProfiles={itemProfiles} />}
  </RecordWorkspace>;
}