import React, { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import UISelectionRouteProfileDetails from '@/components/uiScreen/UISelectionRouteProfileDetails';

export default function UISelectionRouteEditor() {
  const { data: collections = [] } = useQuery({ queryKey: ['entity-collections'], queryFn: () => base44.entities.EntityCollection.list('collection_key'), initialData: [] });
  const { data: tags = [] } = useQuery({ queryKey: ['gameplay-tags'], queryFn: () => base44.entities.GameplayTag.list('full_path'), initialData: [] });
  const { data: screens = [] } = useQuery({ queryKey: ['ui-screen-profiles'], queryFn: () => base44.entities.UIScreenProfile.list('screen_id'), initialData: [] });
  const { data: commandPanels = [] } = useQuery({ queryKey: ['command-panel-profiles'], queryFn: () => base44.entities.CommandPanelProfile.list('panel_id'), initialData: [] });
  const { data: entityPanels = [] } = useQuery({ queryKey: ['entity-panel-profiles'], queryFn: () => base44.entities.EntityPanelProfile.list('panel_id'), initialData: [] });
  const { data: uiItemProfiles = [] } = useQuery({ queryKey: ['ui-item-profiles', 'entity'], queryFn: () => base44.entities.UIItemPresentationProfile.filter({ item_kind: 'entity' }, 'profile_id'), initialData: [] });
  const slotIds = useMemo(() => [...new Set(screens.flatMap(screen => (screen.slots || []).map(slot => slot.slot_id)))], [screens]);
  const profilesByKind = useMemo(() => ({ commandPanels, entityPanels, uiItemProfiles }), [commandPanels, entityPanels, uiItemProfiles]);
  const editor = useRecordEditor('UISelectionRouteProfile', 'ui-selection-route-profiles', () => ({
    route_id: `route_${Date.now()}`, label: '', description: '', source: { collection_key: 'Global.Selection' }, rules: [],
  }));
  useEffect(() => { if (!editor.selectedId && editor.records[0]) editor.setSelectedId(editor.records[0].id); }, [editor.selectedId, editor.records]);
  return <RecordWorkspace entityName="UISelectionRouteProfile" records={editor.records} hideBrowserOnMobile
    columns={[{ key: 'route_id', label: 'Route ID', width: 240 }, { key: 'label', label: '显示名' }, { key: 'source', label: '选中集合', render: record => record.source?.collection_key }, { key: 'rules', label: '规则数', render: record => (record.rules || []).length }]}
    toItem={record => ({ id: record.id, name: record.label || record.route_id, subtitle: `${record.source?.collection_key || '未设置集合'} · ${(record.rules || []).length} 条规则` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.route_id}」吗？`) && editor.remove(record.id)} onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <UISelectionRouteProfileDetails draft={editor.draft} patch={editor.patch} collections={collections} tags={tags} slotIds={slotIds} profilesByKind={profilesByKind} />}
  </RecordWorkspace>;
}
