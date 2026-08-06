import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AnimatorPreviewParameters from '@/components/presentation/AnimatorPreviewParameters';
import * as AnimatorControllerModule from '@/components/presentation/AnimatorControllerDetails.jsx';
import PerformerMiniStateMachine from '@/components/performer/PerformerMiniStateMachine';
import useControllerPreviewMachine from '@/hooks/useControllerPreviewMachine';

const StateFlowCanvas = AnimatorControllerModule.StateFlowCanvas;
import { buildAnimatorPreviewLayer, buildAnimatorPreviewParameters, findPreviewAnimator } from '@/lib/runtime/animatorPreview';

export default function PerformerAnimatorPreviewTab({ root, performers, controllers, profiles, stateIndex, onStateIndex }) {
  const animator = useMemo(() => findPreviewAnimator(root, performers), [performers, root]);
  const controller = controllers.find(item => item.controller_id === animator?.animatorControllerId);
  const profile = profiles.find(item => item.profile_id === animator?.animationProfileId);
  const layer = useMemo(() => buildAnimatorPreviewLayer(controller), [controller]);
  const parameters = useMemo(() => buildAnimatorPreviewParameters(controller, animator), [animator, controller]);
  const [values, setValues] = useState({});
  const [playing, setPlaying] = useState(true);
  useEffect(() => setValues(Object.fromEntries(parameters.map(item => [item.name, item.default_value ?? 0]))), [controller?.controller_id, parameters]);
  const speedMultiplier = animator?.speedParamKey && animator.speedParamKey !== 'none' ? values[animator.speedParamKey] : 1;
  const { activeStateId, activeTransitionId, selectState: selectRuntimeState } = useControllerPreviewMachine(layer, values, playing, speedMultiplier);
  const activeState = layer.states.find(state => state.id === activeStateId);
  const noop = useCallback(() => {}, []);
  useEffect(() => { if (Number.isInteger(activeState?.packed_state_index)) onStateIndex(activeState.packed_state_index); }, [activeState?.packed_state_index, onStateIndex]);
  const selectState = useCallback(id => {
    const state = layer.states.find(item => item.id === id);
    if (!Number.isInteger(state?.packed_state_index)) return;
    setPlaying(false);
    selectRuntimeState(id);
    onStateIndex(state.packed_state_index);
  }, [layer.states, onStateIndex, selectRuntimeState]);
  if (!animator || !controller || !profile) return <div className="rounded border border-[#424a55] bg-[#0D0F14] p-4 text-xs text-gray-500">当前层级没有完整的 Animator、Controller 与 Profile 配置。</div>;
  return <div className="min-w-0 space-y-3">
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="min-w-0 truncate text-xs font-semibold text-[#dce2e8]" title={controller.controller_id}>{controller.controller_id}</span>
      <Button size="sm" onClick={() => setPlaying(value => !value)} className={`h-7 shrink-0 text-xs ${playing ? 'bg-emerald-600' : 'bg-[#242a32]'}`}>{playing ? 'Stop' : 'Play'}</Button>
    </div>
    <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(104px,35%)]">
      <div className="h-[420px] min-w-0 overflow-hidden rounded border border-[#424a55]">{StateFlowCanvas ? <StateFlowCanvas key={controller.controller_id} layer={layer} defaultStateId={layer.default_state_id} selectedStateId={activeStateId} selectedTransitionId={activeTransitionId} onSelectState={selectState} onSelectTransition={noop} onUpdateLayer={noop} onOpenNested={noop} isPlaying={playing} activeStateId={activeStateId} activeTransitionId={activeTransitionId} readOnly compact /> : <PerformerMiniStateMachine layer={layer} activeStateId={activeStateId} activeTransitionId={activeTransitionId} onSelect={packedIndex => selectState(layer.states.find(state => state.packed_state_index === packedIndex)?.id)} />}</div>
      <aside className="flex h-[420px] min-w-0 flex-col overflow-hidden rounded border border-[#424a55] bg-[#171b21]">
        <div className="border-b border-[#424a55] px-3 py-2 text-[11px] font-semibold text-[#dce2e8]">Parameters</div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2"><AnimatorPreviewParameters parameters={parameters} values={values} onChange={(name, value) => { setPlaying(true); setValues(current => ({ ...current, [name]: value })); }} /></div>
        <div className="border-t border-[#424a55] px-3 py-2 text-[10px] leading-4 text-gray-500">状态 {activeState?.name || stateIndex}<br />Profile: {profile.profile_id}</div>
      </aside>
    </div>
  </div>;
}