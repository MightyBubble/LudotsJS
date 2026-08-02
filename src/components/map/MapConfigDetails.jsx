import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import MapEntitiesEditor from './MapEntitiesEditor';

export default function MapConfigDetails({ draft, patch, prototypes, error }) {
  return <div className="max-w-4xl">
    {error && <p className="mb-3 text-xs text-red-300">{error}</p>}
    <Section title="基础信息">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Map ID" value={draft.map_id} onChange={map_id => patch({ map_id })} />
        <TextField label="名称" value={draft.label} onChange={label => patch({ label })} />
      </div>
      <TextField label="描述" value={draft.description} onChange={description => patch({ description })} />
    </Section>
    <MapEntitiesEditor rows={draft.entities} prototypes={prototypes} onChange={entities => patch({ entities })} />
  </div>;
}