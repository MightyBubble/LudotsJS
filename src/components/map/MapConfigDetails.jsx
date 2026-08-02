import React, { useState } from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import MapSceneEditor from './MapSceneEditor';
import MapBoardEditor from './MapBoardEditor';
import MapAssetsEditor from './MapAssetsEditor';
import MapTriggerEditor from './MapTriggerEditor';
import MapCameraEditor from './MapCameraEditor';
import MapSelectionInteractionEditor from './MapSelectionInteractionEditor';

const TABS = [{ key: 'scene', label: '地图编辑' }, { key: 'config', label: '地图配置' }];

export default function MapConfigDetails({ draft, patch, prototypes, blueprints, error }) {
  const [tab, setTab] = useState('scene');
  return <div>
    {error && <p className="mb-3 text-xs text-red-300">{error}</p>}
    <div className="mb-3 flex gap-1">{TABS.map(t => <button key={t.key} onClick={() => setTab(t.key)}
      className={`h-7 rounded px-3 text-[11px] border ${tab === t.key ? 'bg-[#303845] border-[#566070] text-gray-100' : 'bg-[#1E2128] border-[#2A2E37] text-gray-400'}`}>{t.label}</button>)}</div>

    {tab === 'scene'
      ? <MapSceneEditor entities={draft.entities} boards={draft.boards} prototypes={prototypes} onChange={entities => patch({ entities })} />
      : <div className="max-w-4xl">
        <Section title="基础信息">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField helpIndex={1} label="Map ID" value={draft.map_id} onChange={map_id => patch({ map_id })} />
            <TextField helpIndex={2} label="名称" value={draft.label} onChange={label => patch({ label })} />
            <TextField helpIndex={3} label="描述" value={draft.description} onChange={description => patch({ description })} />
          </div>
        </Section>
        <MapBoardEditor boards={draft.boards} onChange={boards => patch({ boards })} />
        <MapTriggerEditor triggerTypes={draft.trigger_types} blueprints={blueprints} onChange={trigger_types => patch({ trigger_types })} />
        <MapAssetsEditor value={draft} patch={patch} />
        <MapCameraEditor camera={draft.default_camera} onChange={default_camera => patch({ default_camera })} />
        <MapSelectionInteractionEditor value={draft.selection_interaction} onChange={selection_interaction => patch({ selection_interaction })} />
      </div>}
  </div>;
}