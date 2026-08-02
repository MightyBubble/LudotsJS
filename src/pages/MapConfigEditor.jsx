import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import MapConfigDetails from '@/components/map/MapConfigDetails';
import ConfigGuideButton from '@/components/help/ConfigGuideButton';
import ConfigGuideSidebar from '@/components/help/ConfigGuideSidebar';
import { mapConfigFieldGuide } from '@/components/map/mapConfigFieldGuide';

export default function MapConfigEditor() {
  const scope = useProjectScope();
  const [error, setError] = useState('');
  const [guideOpen, setGuideOpen] = useState(false);
  const editor = useRecordEditor('MapConfig', 'map-configs', () => ({ map_id: `Map.${Date.now()}`, label: '新地图', description: '', ...scope.newScopeFields(), visual_heightmap_asset: '', structure_collision_asset: '', structure_aware_grounding: false, structure_aware_navigation: false, tags: [], metadata: {}, entities: [], boards: [{ name: 'default', spatial_type: 'Grid', width_in_macro_tiles: 64, height_in_macro_tiles: 64, grid_cell_size_cm: 100, hex_edge_length_cm: 400, chunk_size_cells: 64, loaded_chunk_capacity: 0, data_file: '', visual_heightmap_asset: '', structure_collision_asset: '', structure_aware_grounding: false, structure_aware_navigation: false, navigation_enabled: false }], visual_heightmap: null, trigger_types: [], default_camera: null, selection_interaction: { enabled: false, default_mode: 'screen_box', modes: {} } }));
  const { data: prototypes = [] } = useQuery({ queryKey: ['entityPrototypes'], queryFn: () => base44.entities.EntityPrototype.list('name', 200), initialData: [] });
  const { data: blueprints = [] } = useQuery({ queryKey: ['level-blueprints'], queryFn: () => base44.entities.LevelBlueprint.list('-updated_date', 200), initialData: [] });
  const records = editor.records.filter(scope.inScope);
  const save = () => { if (!editor.draft?.map_id?.trim()) return setError('Map ID 必填。'); setError(''); editor.save(); };
  return <RecordWorkspace entityName="MapConfig" records={records} hideBrowserOnMobile
    columns={[{ key: 'map_id', label: 'Map ID', width: 240 }, { key: 'label', label: '名称' }, { key: 'boards', label: 'Boards', render: r => r.boards?.length || 0 }, { key: 'trigger_types', label: 'Triggers', render: r => r.trigger_types?.length || 0 }, { key: 'entities', label: '实体', render: r => r.entities?.length || 0 }]}
    toItem={r => ({ id: r.id, name: r.label || r.map_id, subtitle: `${r.map_id} · ${r.entities?.length || 0} Entities` })}
    selectedId={editor.selectedId} onSelect={r => { setError(''); editor.setSelectedId(r.id); }} onCreate={editor.create}
    headerRight={<ConfigGuideButton guide={mapConfigFieldGuide} open={guideOpen} onToggle={() => setGuideOpen(open => !open)} />}
    detailAside={guideOpen ? <ConfigGuideSidebar guide={mapConfigFieldGuide} onClose={() => setGuideOpen(false)} /> : null}
    onDelete={r => window.confirm(`确定删除「${r.label || r.map_id}」吗？`) && editor.remove(r.id)} onSave={save} dirty={editor.dirty}>
    {editor.draft && <MapConfigDetails draft={editor.draft} patch={editor.patch} prototypes={prototypes} blueprints={blueprints.filter(scope.inScope)} error={error} />}
  </RecordWorkspace>;
}