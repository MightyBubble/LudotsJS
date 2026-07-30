import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import AbilityFormSetDetails from '@/components/abilityFormSet/AbilityFormSetDetails';

export default function AbilityFormSetEditorPage() {
  const { data: abilities = [] } = useQuery({
    queryKey: ['abilities'],
    queryFn: () => base44.entities.Ability.list('ability_id'),
    initialData: [],
  });
  const editor = useRecordEditor('AbilityFormSet', 'ability-form-sets', () => ({
    form_set_id: `form_set_${Date.now()}`,
    routes: [{ requiredAll: [], blockedAny: [], priority: 0, slotOverrides: [{ slotIndex: 0, abilityId: '' }] }],
  }));

  return <RecordWorkspace entityName="AbilityFormSet" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'form_set_id', label: 'Form Set ID', width: 280 },
      { key: 'routes', label: '路由', render: (item) => `${(item.routes || []).length} 条` },
    ]}
    toItem={record => ({ id: record.id, name: record.form_set_id, subtitle: `${(record.routes || []).length} 条路由` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.form_set_id}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <AbilityFormSetDetails draft={editor.draft} patch={editor.patch} abilities={abilities} />}
  </RecordWorkspace>;
}