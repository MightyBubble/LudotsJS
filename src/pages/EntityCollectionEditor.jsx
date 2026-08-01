import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import EntityCollectionDetails from '@/components/controlPlane/EntityCollectionDetails';

export default function EntityCollectionEditorPage() {
  const editor = useRecordEditor('EntityCollection', 'entity-collections', () => ({
    collection_key: `Collection.${Date.now()}`,
    label: '',
    description: '',
  }));

  return <RecordWorkspace entityName="EntityCollection" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'collection_key', label: '集合键', width: 260 },
      { key: 'label', label: '显示名', width: 180 },
      { key: 'description', label: '说明' },
    ]}
    toItem={record => ({ id: record.id, name: record.collection_key, subtitle: record.label || '—' })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.collection_key}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <EntityCollectionDetails draft={editor.draft} patch={editor.patch} />}
  </RecordWorkspace>;
}