import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import HostAssetBindingDetails from '@/components/asset/HostAssetBindingDetails';

export default function HostAssetBindingEditorPage() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'HostAssetBinding', 'host_asset_bindings',
    () => ({ binding_id: `host_asset_${Date.now()}`, asset_kind: 'Mesh', asset_id: '', backend_id: 'raylib', source_uris: [] })
  );

  return (
    <RecordWorkspace
      entityName="HostAssetBinding"
      records={records}
      columns={[
        { key: 'binding_id', label: 'Binding ID', width: 260, render: r => <span className="font-mono text-[#E2D8B3]">{r.binding_id}</span> },
        { key: 'asset_kind', label: 'Asset Kind', width: 120 },
        { key: 'asset_id', label: 'Asset ID', width: 220 },
        { key: 'backend_id', label: 'Backend', width: 100 },
        { key: 'source_uris', label: 'Source URIs', render: r => (r.source_uris || []).join('、') || '-' },
      ]}
      toItem={r => ({ id: r.id, name: r.binding_id, subtitle: `${r.asset_kind} · ${r.backend_id}` })}
      selectedId={selectedId} onSelect={r => setSelectedId(r.id)}
      onCreate={create} onSave={save} dirty={dirty}
      onDelete={rec => { if (window.confirm(`确定删除「${rec.binding_id}」吗？`)) remove(rec.id); }}
    >
      {draft && <HostAssetBindingDetails draft={draft} patch={patch} />}
    </RecordWorkspace>
  );
}