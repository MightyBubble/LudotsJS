import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import { Section } from '@/components/ludots/ui';
import ContractFields from '@/components/input/contract/ContractFields';

export default function CommandControlWorkspace({ config }) {
  const editor = useRecordEditor(config.entity, config.queryKey, config.buildNew);
  return (
    <RecordWorkspace
      entityName={config.entity}
      records={editor.records}
      hideBrowserOnMobile
      columns={[{ key: config.idKey, label: config.idLabel, width: 280 }, { key: 'name', label: 'Name', width: 220 }]}
      toItem={record => ({ id: record.id, name: record.name || record[config.idKey], subtitle: record[config.idKey] })}
      selectedId={editor.selectedId}
      onSelect={record => editor.setSelectedId(record.id)}
      onCreate={editor.create}
      onDelete={record => window.confirm(`确定删除「${record.name || record[config.idKey]}」吗？`) && editor.remove(record.id)}
      onSave={editor.save}
      dirty={editor.dirty}
    >
      {editor.draft && <Section title={config.title}><ContractFields fields={config.fields} value={editor.draft} onChange={editor.patch} refs={{ tags: [], tagOptions: [] }} /></Section>}
    </RecordWorkspace>
  );
}