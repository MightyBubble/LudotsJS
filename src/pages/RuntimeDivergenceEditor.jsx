import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import RuntimeDivergenceDetails from '@/components/alignment/RuntimeDivergenceDetails';

export default function RuntimeDivergenceEditor() {
  const editor = useRecordEditor('RuntimeDivergence', 'runtime-divergences', () => ({
    divergence_id: `divergence_${Date.now()}`, title: '新分叉点', domain: 'other', status: 'js_only', js_contract: '', csharp_gap: '', migration_notes: '', issue_url: '',
  }));
  return <RecordWorkspace
    entityName="RuntimeDivergence" records={editor.records}
    columns={[
      { key: 'divergence_id', label: '分叉 ID', width: 260 },
      { key: 'title', label: '标题', width: 220 },
      { key: 'domain', label: '领域', width: 120 },
      { key: 'status', label: '状态', width: 140 },
    ]}
    toItem={record => ({ id: record.id, name: record.title, subtitle: `${record.domain} · ${record.status}` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)}
    onCreate={editor.create} onSave={editor.save} dirty={editor.dirty}
    onDelete={record => window.confirm(`确定删除「${record.title}」吗？`) && editor.remove(record.id)}
  >{editor.draft && <RuntimeDivergenceDetails draft={editor.draft} patch={editor.patch} />}</RecordWorkspace>;
}