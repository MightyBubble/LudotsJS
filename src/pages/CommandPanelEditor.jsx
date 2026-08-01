import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import CommandPanelProfileDetails from '@/components/commandPanel/CommandPanelProfileDetails';

export default function CommandPanelEditorPage() {
  const { data: semanticProfiles = [] } = useQuery({
    queryKey: ['ability-semantic-profiles'],
    queryFn: () => base44.entities.AbilitySemanticProfile.list('profile_id'),
    initialData: [],
  });

  const editor = useRecordEditor('CommandPanelProfile', 'command-panel-profiles', () => ({
    panel_id: `panel_${Date.now()}`,
    label: '',
    description: '',
    slots: [],
    role_slot_map: [],
  }));

  return <RecordWorkspace entityName="CommandPanelProfile" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'panel_id', label: 'Panel ID', width: 260 },
      { key: 'label', label: '显示名', width: 180 },
      { key: 'actor_collection_key', label: 'Actor 集合键' },
    ]}
    toItem={record => ({
      id: record.id,
      name: record.label || record.panel_id,
      subtitle: record.actor_collection_key || '未设置集合键',
    })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.panel_id}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <CommandPanelProfileDetails draft={editor.draft} patch={editor.patch} semanticProfiles={semanticProfiles} />}
  </RecordWorkspace>;
}