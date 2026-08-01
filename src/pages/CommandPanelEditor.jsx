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
    panel_profile_id: `panel_profile_${Date.now()}`,
    label: '',
    description: '',
    panels: [],
  }));

  return <RecordWorkspace entityName="CommandPanelProfile" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'panel_profile_id', label: 'Profile ID', width: 260 },
      { key: 'label', label: '显示名', width: 180 },
      { key: 'panels', label: '面板数', render: r => (r.panels || []).length },
    ]}
    toItem={record => ({
      id: record.id,
      name: record.label || record.panel_profile_id,
      subtitle: `${record.panel_profile_id} · ${(record.panels || []).length} 个面板`,
    })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.panel_profile_id}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <CommandPanelProfileDetails draft={editor.draft} patch={editor.patch} semanticProfiles={semanticProfiles} />}
  </RecordWorkspace>;
}