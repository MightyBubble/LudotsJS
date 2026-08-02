import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import MapEntitiesEditor from './MapEntitiesEditor';
import MapBoardEditor from './MapBoardEditor';
import MapAssetsEditor from './MapAssetsEditor';
import MapTriggerEditor from './MapTriggerEditor';
import MapCameraEditor from './MapCameraEditor';

export default function MapConfigDetails({ draft, patch, prototypes, error }) {
  return <div className="max-w-4xl">
    {error && <p className="mb-3 text-xs text-red-300">{error}</p>}
    <Section title="基础信息">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Map ID" value={draft.map_id} onChange={map_id => patch({ map_id })} />
        <TextField label="Parent ID" value={draft.parent_id} onChange={parent_id => patch({ parent_id })} />
        <TextField label="名称" value={draft.label} onChange={label => patch({ label })} />
        <TextField label="描述" value={draft.description} onChange={description => patch({ description })} />
      </div>
    </Section>
    <MapBoardEditor boards={draft.boards} onChange={boards => patch({ boards })} />
    <MapTriggerEditor triggerTypes={draft.trigger_types} onChange={trigger_types => patch({ trigger_types })} />
    <MapEntitiesEditor rows={draft.entities} prototypes={prototypes} onChange={entities => patch({ entities })} />
    <MapAssetsEditor value={draft} patch={patch} />
    <MapCameraEditor camera={draft.default_camera} onChange={default_camera => patch({ default_camera })} />
  </div>;
}