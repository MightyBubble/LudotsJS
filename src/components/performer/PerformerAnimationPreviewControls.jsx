import { useEffect, useMemo, useState } from 'react';
import { Section } from '@/components/ludots/ui';
import { Button } from '@/components/ui/button';
import AnimatorPreviewParameters from '@/components/presentation/AnimatorPreviewParameters';
import useControllerPreviewMachine from '@/hooks/useControllerPreviewMachine';
import PerformerMiniStateMachine from './PerformerMiniStateMachine';

const modeFor = kind => kind?.includes('Less') ? 'Less' : kind?.includes('Bool') ? 'If' : kind?.includes('Trigger') ? 'Trigger' : 'Greater';
const runtimeLayer = controller => controller?.authoring_layers?.[0] || { id: 'runtime', default_state_id: `state-${controller?.default_state_index ?? 0}`, states: (controller?.states || []).map(state => ({ ...state, id: `state-${state.packed_state_index}`, name: `State ${state.packed_state_index}`, type: 'Normal' })), transitions: (controller?.transitions || []).map((transition, index) => ({ ...transition, id: `transition-${index}`, from_state_id: `state-${transition.from_state_index}`, to_state_id: `state-${transition.to_state_index}`, conditions: [{ parameter: transition.parameter_index, mode: modeFor(transition.condition_kind), threshold: transition.threshold }] })) };

export default function PerformerAnimationPreviewControls({ draft, controllers, profiles, stateIndex, onStateIndex }) {
  const animator = (draft.behaviors || []).find(behavior => behavior.kind === 'Animator')?.animator;
  const controller = controllers.find(item => item.controller_id === animator?.animatorControllerId);
  const profile = profiles.find(item => item.profile_id === animator?.animationProfileId);
  const layer = useMemo(() => runtimeLayer(controller), [controller]);
  const parameters = useMemo(() => controller?.authoring_parameters || [], [controller]);
  const [values, setValues] = useState({});
  const [playing, setPlaying] = useState(false);
  useEffect(() => setValues(Object.fromEntries(parameters.map(item => [item.name, item.default_value ?? 0]))), [controller?.controller_id, parameters]);
  const runtime = useControllerPreviewMachine(layer, values, playing);
  const activeState = layer.states.find(state => state.id === runtime.activeStateId);
  useEffect(() => { if (playing && Number.isInteger(activeState?.packed_state_index)) onStateIndex(activeState.packed_state_index); }, [activeState?.packed_state_index, onStateIndex, playing]);
  if (!animator || !controller || !profile) return null;
  return <Section title="Animator 预览" right={<Button size="sm" onClick={() => setPlaying(value => !value)} className={`h-7 text-xs ${playing ? 'bg-emerald-600' : 'bg-[#242a32]'}`}>{playing ? 'Stop' : 'Play'}</Button>}>
    <PerformerMiniStateMachine layer={layer} activeStateId={playing ? runtime.activeStateId : layer.states.find(state => state.packed_state_index === stateIndex)?.id} activeTransitionId={runtime.activeTransitionId} onSelect={onStateIndex} />
    <AnimatorPreviewParameters parameters={parameters} values={values} onChange={(name, value) => setValues(current => ({ ...current, [name]: value }))} />
    <div className="text-[10px] text-gray-500">Profile: {profile.profile_id}</div>
  </Section>;
}