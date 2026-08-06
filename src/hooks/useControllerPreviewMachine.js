import { useCallback, useEffect, useRef, useState } from 'react';

const normalizedTime = (state, elapsed, speedMultiplier) => (
  elapsed * Math.max(0, Number(state?.playback_speed ?? 1)) * Math.max(0, Number(speedMultiplier ?? 1))
) / Math.max(Number(state?.duration_seconds) || 1, 0.01);

const passes = (transition, values, progress, consumed) => {
  if (transition.has_exit_time && progress < Number(transition.exit_time ?? 0)) return false;
  const condition = transition.conditions?.[0];
  if (!condition) return transition.has_exit_time;
  const value = values[condition.parameter];
  if (condition.mode === 'ExitTime') return progress >= Number(condition.threshold ?? 1);
  if (condition.mode === 'Trigger') return Number(value) > (consumed.current[condition.parameter] || 0);
  if (condition.mode === 'If') return !!value;
  if (condition.mode === 'IfNot') return !value;
  if (condition.mode === 'Greater') return Number(value) >= Number(condition.threshold);
  if (condition.mode === 'Less') return Number(value) <= Number(condition.threshold);
  return false;
};

export default function useControllerPreviewMachine(layer, values, playing, speedMultiplier = 1) {
  const [activeStateId, setActiveStateId] = useState(layer?.default_state_id || '');
  const [activeTransitionId, setActiveTransitionId] = useState('');
  const enteredAt = useRef(performance.now());
  const busy = useRef(false);
  const consumed = useRef({});

  useEffect(() => {
    setActiveStateId(layer?.default_state_id || '');
    setActiveTransitionId('');
    enteredAt.current = performance.now();
    busy.current = false;
  }, [layer?.id, layer?.default_state_id]);

  useEffect(() => {
    if (!playing || !activeStateId) return;
    const tick = () => {
      if (busy.current) return;
      const state = layer.states.find(item => item.id === activeStateId);
      const anyState = layer.states.find(item => item.type === 'AnyState');
      const candidates = layer.transitions.filter(item => item.from_state_id === activeStateId || item.from_state_id === anyState?.id);
      const elapsed = (performance.now() - enteredAt.current) / 1000;
      const progress = normalizedTime(state, elapsed, speedMultiplier);
      const next = candidates.find(item => passes(item, values, progress, consumed));
      if (!next) return;
      busy.current = true;
      const condition = next.conditions?.[0];
      if (condition?.mode === 'Trigger' && next.consume_trigger) consumed.current[condition.parameter] = Number(values[condition.parameter]);
      setActiveTransitionId(next.id);
      const transitionSeconds = next.duration_mode === 'NormalizedSourceState'
        ? Number(next.duration_seconds || 0) * Math.max(Number(state?.duration_seconds) || 1, 0.01) / Math.max(0.01, Number(state?.playback_speed ?? 1) * Math.max(0.01, Number(speedMultiplier ?? 1)))
        : Number(next.duration_seconds || 0);
      window.setTimeout(() => {
        setActiveStateId(next.to_state_id);
        setActiveTransitionId('');
        enteredAt.current = performance.now();
        busy.current = false;
      }, Math.max(40, transitionSeconds * 1000));
    };
    const timer = window.setInterval(tick, 80);
    tick();
    return () => window.clearInterval(timer);
  }, [activeStateId, layer, playing, speedMultiplier, values]);

  const selectState = useCallback((stateId) => {
    setActiveStateId(stateId);
    setActiveTransitionId('');
    enteredAt.current = performance.now();
    busy.current = false;
  }, []);

  return { activeStateId, activeTransitionId, selectState };
}