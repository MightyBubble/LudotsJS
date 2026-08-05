import React, { useCallback, useState } from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import PerformerDetails from '@/components/performer/PerformerDetails';
import PerformerHierarchyPanel from '@/components/performer/PerformerHierarchyPanel';
import PerformerPreviewEditor from '@/components/performer/PerformerPreviewEditor';
import { findHierarchyNode, moveHierarchyNode, updateHierarchyInstance } from '@/lib/runtime/performerHierarchy';

export default function PerformerEditorPage() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'Performer', 'performers',
    () => ({ performer_id: `performer_${Date.now()}`, label: '新 Performer', behaviors: [], paramDefaults: [], rules: [], children: [], required_attribute_ids: [], instanced_batches: [] })
  );
  const [hierarchyRootId, setHierarchyRootId] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const visibleRecords = draft ? records.map(item => item.id === draft.id ? draft : item) : records;
  const hierarchyRoot = visibleRecords.find(item => item.id === hierarchyRootId) || draft;
  const selectRoot = (record) => { setHierarchyRootId(record.id); setSelectedInstance(null); setSelectedId(record.id); };
  const selectHierarchyNode = useCallback((node) => setSelectedInstance(node.path === 'root' ? null : node), []);
  const selectHierarchyPath = useCallback((path) => {
    const node = findHierarchyNode(hierarchyRoot, visibleRecords, path);
    if (node) selectHierarchyNode(node);
  }, [hierarchyRoot, selectHierarchyNode, visibleRecords]);
  const updateSelectedInstance = selectedInstance ? (next) => {
    const children = updateHierarchyInstance(draft, visibleRecords, selectedInstance.path, next);
    patch({ children });
    setSelectedInstance(current => ({ ...current, instance: next }));
  } : null;
  const moveHierarchy = useCallback((sourcePath, targetPath, placement) => {
    const moved = moveHierarchyNode(draft, visibleRecords, sourcePath, targetPath, placement);
    if (!moved) return;
    const nextRoot = { ...draft, children: moved.children };
    patch({ children: moved.children });
    setSelectedInstance(findHierarchyNode(nextRoot, visibleRecords, moved.movedPath));
  }, [draft, patch, visibleRecords]);

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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,2.2fr)] xl:items-start">
          <PerformerHierarchyPanel root={hierarchyRoot} records={visibleRecords} selectedPath={selectedInstance?.path || 'root'} onSelect={selectHierarchyNode} onMove={moveHierarchy} />
          <PerformerPreviewEditor root={hierarchyRoot} draft={draft} records={visibleRecords} patch={patch} selectedInstance={selectedInstance} onSelectInstancePath={selectHierarchyPath} onChangeInstance={updateSelectedInstance} />
        </div>
        <PerformerDetails draft={draft} patch={patch} />
      </>}
    </RecordWorkspace>
  );
}