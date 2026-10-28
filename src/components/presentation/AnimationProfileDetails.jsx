import React from 'react';
import { Section, TextField, Field } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';
import ProfileAnimationPreview from './ProfileAnimationPreview';

function controllerStates(controller) {
  const authored = (controller?.authoring_layers || [])
    .flatMap(layer => layer.states || [])
    .filter(state => ['Normal', 'BlendTree', 'SubStateMachine'].includes(state.type));
  return (controller?.states || []).map((_state, index) => {
    const source = authored[index] || authored.find(item => item.packed_state_index === index);
    return {
      packed_state_index: index,
      name: source?.name || `State ${index}`,
      clip_asset_id: source?.animation_clip_asset_id || '',
    };
  });
}

function syncStateClips(controller, existingRows = []) {
  const states = controllerStates(controller);
  if (!states.length) return existingRows;
  const byIndex = new Map(existingRows.map(row => [row.packed_state_index, row.clip_asset_id]));
  return states.map(state => ({
    packed_state_index: state.packed_state_index,
    clip_asset_id: state.clip_asset_id || byIndex.get(state.packed_state_index) || '',
  }));
}

function StateClipRows({ rows = [], controller, clips, onChange }) {
  const states = controllerStates(controller);
  const alignedRows = states.length
    ? states.map((state, index) => ({
        packed_state_index: index,
        name: state.name,
        clip_asset_id: rows.find(r => r.packed_state_index === index)?.clip_asset_id || state.clip_asset_id || '',
      }))
    : rows.map(row => ({ ...row, name: `State ${row.packed_state_index}` }));
  const patch = (index, clip_asset_id) => onChange(alignedRows.map((row, rowIndex) => ({
    packed_state_index: row.packed_state_index,
    clip_asset_id: rowIndex === index ? clip_asset_id : row.clip_asset_id,
  })));
  return <Section title="State Clips">
    {alignedRows.length === 0 && <p className="text-xs text-gray-500">选择 Animator Controller 后自动生成状态映射</p>}
    {alignedRows.map((row, index) => <div key={row.packed_state_index} className="grid grid-cols-[1fr_2fr] gap-3 items-end">
      <Field label="Controller State"><div className="h-8 flex items-center rounded border border-[#2A2E37] bg-[#0D0F14] px-3 text-xs text-gray-300">{row.name} · #{row.packed_state_index}</div></Field>
      <ReferenceSelect label="Clip Asset" value={row.clip_asset_id} options={clips} onChange={clip_asset_id => patch(index, clip_asset_id)}/>
    </div>)}
  </Section>;
}

export default function AnimationProfileDetails({ draft, patch, refs }) {
  const findController = id => (refs.raw?.controllers || []).find(item => item.controller_id === id) || refs.controllers.find(option => option.value === id)?.record;
  const selected = findController(draft.animator_controller_id);
  const selectController = animator_controller_id => {
    const controller = findController(animator_controller_id);
    patch({ animator_controller_id, state_clips: syncStateClips(controller, draft.state_clips) });
  };
  return <div className="space-y-3">
    <Section title="animation_profiles.json">
      <TextField label="ID" value={draft.profile_id} onChange={profile_id => patch({ profile_id })}/>
      <ReferenceSelect label="Animator Controller" value={draft.animator_controller_id} options={refs.controllers} onChange={selectController}/>
    </Section>
    <StateClipRows rows={draft.state_clips} controller={selected} clips={refs.clips} onChange={state_clips => patch({ state_clips })}/>
    <ProfileAnimationPreview draft={draft} patch={patch} controller={selected} />
  </div>;
}