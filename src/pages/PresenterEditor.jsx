import React, { useCallback, useState } from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import PresenterDetails from '@/components/presenter/PresenterDetails';
import PresenterHierarchyPanel from '@/components/presenter/PresenterHierarchyPanel';
import PresenterPreviewEditor from '@/components/presenter/PresenterPreviewEditor';
import PresenterEditDecisionDialog from '@/components/presenter/PresenterEditDecisionDialog';
import { breakHierarchyInstance, findHierarchyNode, moveHierarchyNode, updateHierarchyInstance } from '@/lib/runtime/presenterHierarchy';

export default function PresenterEditorPage() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'Presenter', 'presenters',
    () => ({ presenter_id: `presenter_${Date.now()}`, label: '新 Presenter', behaviors: [], paramDefaults: [], rules: [], children: [], anchor: { offset: [0, 0, 0] } })
  );
  const [hierarchyRootId, setHierarchyRootId] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [editDecision, setEditDecision] = useState(null);
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
    setSelectedInstance(current => ({ ...current, instance: next, source: current.source === 'nested_template' ? 'nested_override' : current.source }));
  } : null;
  const moveHierarchy = useCallback((sourcePath, targetPath, placement) => {
    const inherited = [sourcePath, targetPath].map(path => findHierarchyNode(draft, visibleRecords, path)).find(node => node?.source === 'nested_template');
    if (inherited) { setEditDecision(inherited); return; }
    const moved = moveHierarchyNode(draft, visibleRecords, sourcePath, targetPath, placement);
    if (!moved) return;
    const nextRoot = { ...draft, children: moved.children };
    patch({ children: moved.children });
    setSelectedInstance(findHierarchyNode(nextRoot, visibleRecords, moved.movedPath));
  }, [draft, patch, visibleRecords]);
  const editTemplate = () => {
    const owner = records.find(item => item.presenter_id === editDecision?.templateOwnerId);
    if (!owner) return;
    setHierarchyRootId(owner.id);
    setSelectedId(owner.id);
    setSelectedInstance(findHierarchyNode(owner, records, editDecision.templatePath));
    setEditDecision(null);
  };
  const breakInstance = () => {
    const children = breakHierarchyInstance(draft, visibleRecords, editDecision?.path);
    if (!children) return;
    const nextRoot = { ...draft, children };
    patch({ children });
    setSelectedInstance(findHierarchyNode(nextRoot, visibleRecords, editDecision.path));
    setEditDecision(null);
  };
  return (
    <RecordWorkspace
      entityName="Presenter"
      hideBrowserOnMobile
      records={records}
      columns={[
        { key: 'presenter_id', label: 'Presenter ID', width: 240, render: r => <span className="font-mono text-[#E2D8B3]">{r.presenter_id}</span> },
        { key: 'label', label: '名称', width: 160 },
        { key: 'extends', label: 'Extends', width: 160 },
        { key: 'behaviors', label: 'Behaviors', width: 100, render: r => (r.behaviors || []).length },
        { key: 'rules', label: 'Rules', width: 80, render: r => (r.rules || []).length },
      ]}
      toItem={r => ({ id: r.id, name: r.label || r.presenter_id, subtitle: `${(r.behaviors || []).length} behaviors${r.extends ? ` · 继承 ${r.extends}` : ''}` })}
      selectedId={selectedId} onSelect={selectRoot}
      onCreate={create} onSave={save} dirty={dirty}
      onDelete={rec => { if (window.confirm(`确定删除「${rec.label || rec.presenter_id}」吗？`)) remove(rec.id); }}
    >
      {draft && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(220px,0.65fr)_minmax(360px,1.5fr)_minmax(300px,1fr)] xl:items-start">
          <PresenterHierarchyPanel root={hierarchyRoot} records={visibleRecords} selectedPath={selectedInstance?.path || 'root'} onSelect={selectHierarchyNode} onMove={moveHierarchy} />
          <PresenterPreviewEditor root={hierarchyRoot} draft={draft} records={visibleRecords} patch={patch} selectedInstance={selectedInstance} onSelectInstancePath={selectHierarchyPath} onChangeInstance={updateSelectedInstance} onRequestInheritedEdit={() => setEditDecision(selectedInstance)} details={<PresenterDetails draft={draft} patch={patch} compact />} />
        </div>
      )}
      <PresenterEditDecisionDialog open={!!editDecision} node={editDecision} onOpenChange={open => !open && setEditDecision(null)} onEditTemplate={editTemplate} onBreak={breakInstance} />
    </RecordWorkspace>
  );
}
