import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import AbilitySemanticProfileDetails from '@/components/abilitySemantics/AbilitySemanticProfileDetails';

export default function AbilitySemanticProfileEditorPage() {
  const editor = useRecordEditor('AbilitySemanticProfile', 'ability-semantic-profiles', () => ({
    profile_id: 'new_profile',
    label: '',
    description: '',
    roles: [],
  }));

  return <RecordWorkspace entityName="AbilitySemanticProfile" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'profile_id', label: '语义组 ID', width: 200, render: item => <span className="font-mono text-[#E2D8B3]">{item.profile_id}</span> },
      { key: 'label', label: '显示名', width: 160 },
      { key: 'roles', label: '语义数量', render: item => `${(item.roles || []).length} 项` },
      { key: 'description', label: '说明' },
    ]}
    toItem={record => ({ id: record.id, name: record.label || record.profile_id, subtitle: `${record.profile_id} · ${(record.roles || []).length} 个语义` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.profile_id}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <div className="max-w-3xl"><AbilitySemanticProfileDetails draft={editor.draft} patch={editor.patch} /></div>}
  </RecordWorkspace>;
}