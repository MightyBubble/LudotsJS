import React from 'react';
import { Section, TextField, Field } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';

function controllerStates(controller) {
  const authored = (controller?.authoring_layers || []).flatMap(layer => layer.states || []);
  return (controller?.states || []).map((state, index) => {
    const packed = Number.isInteger(state.packed_state_index) ? state.packed_state_index : index;
    const source = authored.find(item => item.packed_state_index === packed);
    return {
      packed_state_index: packed,
      name: source?.name || `State ${packed}`,
      clip_asset_id: source?.animation_clip_asset_id || '',
    };
  });
}

function StateClipRows({ rows = [], controller, clips, onChange }) {
  const names = new Map(controllerStates(controller).map(state => [state.packed_state_index, state.name]));
  const patch = (index, clip_asset_id) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, clip_asset_id } : row));
  return <Section title="State Clips">
    {rows.length === 0 && <p className="text-xs text-gray-500">选择 Animator Controller 后自动生成状态映射</p>}
    {rows.map((row, index) => <div key={row.packed_state_index} className="grid grid-cols-[1fr_2fr] gap-3 items-end">
      <Field label="Controller State"><div className="h-8 flex items-center rounded border border-[#2A2E37] bg-[#0D0F14] px-3 text-xs text-gray-300">{names.get(row.packed_state_index) || `State ${row.packed_state_index}`} · packed {row.packed_state_index}</div></Field>
      <ReferenceSelect label="Clip Asset" value={row.clip_asset_id} options={clips} onChange={clip_asset_id => patch(index, clip_asset_id)}/>
    </div>)}
  </Section>;
}

export default function AnimationProfileDetails({ draft, patch, refs }) {
  const selected = refs.controllers.find(option => option.value === draft.animator_controller_id)?.record;
  const selectController = animator_controller_id => {
    const controller = refs.controllers.find(option => option.value === animator_controller_id)?.record;
    patch({ animator_controller_id, state_clips: controllerStates(controller).map(({ packed_state_index, clip_asset_id }) => ({ packed_state_index, clip_asset_id })) });
  };
  return <div className="space-y-3">
    <Section title="animation_profiles.json">
      <TextField label="ID" value={draft.profile_id} onChange={profile_id => patch({ profile_id })}/>
      <ReferenceSelect label="Animator Controller" value={draft.animator_controller_id} options={refs.controllers} onChange={selectController}/>
    </Section>
    <StateClipRows rows={draft.state_clips} controller={selected} clips={refs.clips} onChange={state_clips => patch({ state_clips })}/>
  </div>;
}