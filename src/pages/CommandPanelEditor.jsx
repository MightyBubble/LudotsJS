import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import CommandPanelProfileDetails from '@/components/commandPanel/CommandPanelProfileDetails';
import { normalizePanelProfile, preparePanelProfileSave } from '@/components/commandPanel/panelProfileModel';

export default function CommandPanelEditorPage() {
  const { data: tags = [] } = useQuery({
    queryKey: ['gameplay-tags'],
    queryFn: () => base44.entities.GameplayTag.list('full_path'),
    initialData: [],
  });
  const { data: inputConfigs = [] } = useQuery({
    queryKey: ['input-configs'],
    queryFn: () => base44.entities.InputConfig.list(),
    initialData: [],
  });
  const { data: collections = [] } = useQuery({
    queryKey: ['entity-collections'],
    queryFn: () => base44.entities.EntityCollection.list('collection_key'),
    initialData: [],
  });
  const { data: semanticProfiles = [] } = useQuery({
    queryKey: ['ability-semantic-profiles'],
    queryFn: () => base44.entities.AbilitySemanticProfile.list('profile_id'),
    initialData: [],
  });

  const actions = [...new Map(inputConfigs.flatMap(c => c.actions || []).map(action => [action.id, action])).values()];

  const editor = useRecordEditor('CommandPanelProfile', 'command-panel-profiles', () => ({
    panel_id: `panel_${Date.now()}`,
    label: '',
    description: '',
    source: { collection_key: '' },
    filter: { required_all_tags: [], blocked_any_tags: [] },
    grouping: { rules: [] },
    layout: {
      mode: 'dynamic',
      grid: {},
      fixed: { slots: [] },
      dynamic: { buckets: [], hotkey_action_ids: [] },
    },
  }), preparePanelProfileSave);
  const displayRecords = editor.records.map(record => {
    const panel = normalizePanelProfile(record);
    return { ...record, layout_mode: panel.layout.mode, actor_collection_key: panel.source.collection_key };
  });

  return <RecordWorkspace entityName="CommandPanelProfile" records={displayRecords} hideBrowserOnMobile
    columns={[
      { key: 'panel_id', label: 'Panel ID', width: 240 },
      { key: 'label', label: '显示名', width: 160 },
      { key: 'layout_mode', label: '落位', width: 100 },
      { key: 'actor_collection_key', label: '实体集合键' },
    ]}
    toItem={record => ({
      id: record.id,
      name: record.label || record.panel_id,
      subtitle: `${record.layout_mode === 'fixed' ? '固定槽位' : '动态排列'} · ${record.actor_collection_key || '未设置集合键'}`,
    })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.panel_id}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <CommandPanelProfileDetails draft={editor.draft} patch={editor.patch} tags={tags} actions={actions}
      collections={collections} semanticProfiles={semanticProfiles} />}
  </RecordWorkspace>;
}