import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import MapConfigDetails from '@/components/map/MapConfigDetails';

export default function MapConfigEditor() {
  const scope = useProjectScope();
  const [error, setError] = useState('');
  const editor = useRecordEditor('MapConfig', 'map-configs', () => ({ map_id: `Map.${Date.now()}`, label: '新地图', description: '', ...scope.newScopeFields(), entities: [] }));
  const { data: prototypes = [] } = useQuery({ queryKey: ['entityPrototypes'], queryFn: () => base44.entities.EntityPrototype.list('name', 200), initialData: [] });
  const records = editor.records.filter(scope.inScope);
  const save = () => { if (!editor.draft?.map_id?.trim()) return setError('Map ID 必填。'); setError(''); editor.save(); };
  return <RecordWorkspace entityName="MapConfig" records={records} hideBrowserOnMobile
    columns={[{ key: 'map_id', label: 'Map ID', width: 240 }, { key: 'label', label: '名称' }, { key: 'entities', label: '实体', render: r => r.entities?.length || 0 }]}
    toItem={r => ({ id: r.id, name: r.label || r.map_id, subtitle: `${r.map_id} · ${r.entities?.length || 0} Entities` })}
    selectedId={editor.selectedId} onSelect={r => { setError(''); editor.setSelectedId(r.id); }} onCreate={editor.create}
    onDelete={r => window.confirm(`确定删除「${r.label || r.map_id}」吗？`) && editor.remove(r.id)} onSave={save} dirty={editor.dirty}>
    {editor.draft && <MapConfigDetails draft={editor.draft} patch={editor.patch} prototypes={prototypes} error={error} />}
  </RecordWorkspace>;
}