import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AnimatorPreviewParameters from '@/components/presentation/AnimatorPreviewParameters';
import { StateFlowCanvas } from '@/components/presentation/AnimatorControllerDetails';
import useControllerPreviewMachine from '@/hooks/useControllerPreviewMachine';
import { buildAnimatorPreviewLayer, findPreviewAnimator } from '@/lib/runtime/animatorPreview';

export default function PerformerAnimatorPreviewTab({ root, performers, controllers, profiles, stateIndex, onStateIndex }) {
  const animator = useMemo(() => findPreviewAnimator(root, performers), [performers, root]);
  const controller = controllers.find(item => item.controller_id === animator?.animatorControllerId);
  const profile = profiles.find(item => item.profile_id === animator?.animationProfileId);
  const layer = useMemo(() => buildAnimatorPreviewLayer(controller), [controller]);
  const parameters = useMemo(() => controller?.authoring_parameters || [], [controller]);
  const [values, setValues] = useState({});
  const [playing, setPlaying] = useState(true);
  useEffect(() => setValues(Object.fromEntries(parameters.map(item => [item.name, item.default_value ?? 0]))), [controller?.controller_id, parameters]);
  const runtime = useControllerPreviewMachine(layer, values, playing);
  const activeState = layer.states.find(state => state.id === runtime.activeStateId);
  useEffect(() => { if (Number.isInteger(activeState?.packed_state_index)) onStateIndex(activeState.packed_state_index); }, [activeState?.packed_state_index, onStateIndex]);
  if (!animator || !controller || !profile) return <div className="rounded border border-[#424a55] bg-[#0D0F14] p-4 text-xs text-gray-500">当前层级没有完整的 Animator、Controller 与 Profile 配置。</div>;
  const selectState = id => {
    const state = layer.states.find(item => item.id === id);
    if (!Number.isInteger(state?.packed_state_index)) return;
    runtime.selectState(id);
    onStateIndex(state.packed_state_index);
  };
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#dce2e8]">{controller.controller_id}</span><Button size="sm" onClick={() => setPlaying(value => !value)} className={`h-7 text-xs ${playing ? 'bg-emerald-600' : 'bg-[#242a32]'}`}>{playing ? 'Stop' : 'Play'}</Button></div>
    <div className="h-[420px] overflow-hidden rounded border border-[#424a55]"><StateFlowCanvas layer={layer} defaultStateId={layer.default_state_id} selectedStateId={activeState?.id || ''} selectedTransitionId={runtime.activeTransitionId} onSelectState={selectState} onSelectTransition={() => {}} onUpdateLayer={() => {}} onOpenNested={() => {}} isPlaying activeStateId={activeState?.id} activeTransitionId={runtime.activeTransitionId} readOnly /></div>
    <AnimatorPreviewParameters parameters={parameters} values={values} onChange={(name, value) => { setPlaying(true); setValues(current => ({ ...current, [name]: value })); }} />
    <div className="text-[10px] text-gray-500">状态 {activeState?.name || stateIndex} · Profile: {profile.profile_id}</div>
  </div>;
}