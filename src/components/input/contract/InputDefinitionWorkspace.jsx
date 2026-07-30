import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import { Section } from '@/components/ludots/ui';
import ContractFields from '@/components/input/contract/ContractFields';
import ConfigGuideButton from '@/components/help/ConfigGuideButton';
import { inputConfigGuides } from '@/components/input/contract/inputConfigGuides';
import { inputConfigFieldGuides } from '@/components/input/contract/inputConfigFieldGuides';
import ExampleConfigPanel from '@/components/input/ExampleConfigPanel';

export default function InputDefinitionWorkspace({ config }) {
  const editor = useRecordEditor(config.entity, config.queryKey, config.buildNew);
  const core = useCoreRefs();
  const refs = { tags: core.tags || [], tagOptions: (core.tags || []).map(t => ({ value: t.full_path, label: t.full_path })) };
  return <RecordWorkspace entityName={config.entity} records={editor.records} hideBrowserOnMobile
    columns={[{ key: config.idKey, label: config.idLabel, width: 280 }]}
    toItem={record => ({ id: record.id, name: record[config.idKey], subtitle: config.title })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    headerRight={<ConfigGuideButton guide={{ ...inputConfigGuides[config.entity], ...inputConfigFieldGuides[config.entity] }} />}
    onDelete={record => window.confirm(`确定删除「${record[config.idKey]}」吗？`) && editor.remove(record.id)} onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <><ExampleConfigPanel example={config.example} /><Section title="配置详情"><ContractFields fields={config.fields} value={editor.draft} onChange={editor.patch} refs={refs} /></Section></>}
  </RecordWorkspace>;
}