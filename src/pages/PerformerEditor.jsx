import React, { useState } from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import PerformerDetails from '@/components/performer/PerformerDetails';
import PerformerHierarchyPanel from '@/components/performer/PerformerHierarchyPanel';

export default function PerformerEditorPage() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'Performer', 'performers',
    () => ({ performer_id: `performer_${Date.now()}`, label: '新 Performer', behaviors: [], paramDefaults: [], rules: [], children: [], required_attribute_ids: [], instanced_batches: [] })
  );
  const [hierarchyRootId, setHierarchyRootId] = useState(null);
  const visibleRecords = draft ? records.map(item => item.id === draft.id ? draft : item) : records;
  const hierarchyRoot = visibleRecords.find(item => item.id === hierarchyRootId) || draft;
  const selectRoot = (record) => { setHierarchyRootId(record.id); setSelectedId(record.id); };
  const selectHierarchyNode = (record) => {
    if (record.id === selectedId) return;
    if (dirty && !window.confirm('当前 Performer 尚未保存，是否放弃修改并切换节点？')) return;
    setSelectedId(record.id);
  };

  return (
    <RecordWorkspace
      entityName="Performer"
      hideBrowserOnMobile
      records={records}
      columns={[
        { key: 'performer_id', label: 'Performer ID', width: 240, render: r => <span className="font-mono text-[#E2D8B3]">{r.performer_id}</span> },
        { key: 'label', label: '名称', width: 160 },
        { key: 'extends', label: 'Extends', width: 160 },
        { key: 'behaviors', label: 'Behaviors', width: 100, render: r => (r.behaviors || []).length },
        { key: 'rules', label: 'Rules', width: 80, render: r => (r.rules || []).length },
      ]}
      toItem={r => ({ id: r.id, name: r.label || r.performer_id, subtitle: `${(r.behaviors || []).length} behaviors${r.extends ? ` · 继承 ${r.extends}` : ''}` })}
      selectedId={selectedId} onSelect={selectRoot}
      onCreate={create} onSave={save} dirty={dirty}
      onDelete={rec => { if (window.confirm(`确定删除「${rec.label || rec.performer_id}」吗？`)) remove(rec.id); }}
    >
      {draft && <>
        <PerformerHierarchyPanel root={hierarchyRoot} records={visibleRecords} selectedId={selectedId} onSelect={selectHierarchyNode} />
        <PerformerDetails draft={draft} patch={patch} />
      </>}
    </RecordWorkspace>
  );
}