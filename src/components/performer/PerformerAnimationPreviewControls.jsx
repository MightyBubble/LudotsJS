import { Section, SelectField } from '@/components/ludots/ui';

export default function PerformerAnimationPreviewControls({ draft, controllers, profiles, stateIndex, onStateIndex }) {
  const animator = (draft.behaviors || []).find(behavior => behavior.kind === 'Animator')?.animator;
  if (!animator) return null;
  const controller = controllers.find(item => item.controller_id === animator.animatorControllerId);
  const profile = profiles.find(item => item.profile_id === animator.animationProfileId);
  const options = (controller?.states || []).map((state, index) => {
    const clip = profile?.state_clips?.find(item => item.packed_state_index === state.packed_state_index)?.clip_asset_id || '未绑定 Clip';
    return { value: String(state.packed_state_index), label: `${state.packed_state_index} · ${clip}` };
  });
  return <Section title="Animator 预览">
    <SelectField label="Preview State" value={String(stateIndex)} options={options} onChange={value => onStateIndex(Number(value))} />
  </Section>;
}