import { useEffect, useRef, useState } from 'react';

const passes = (transition, values, elapsed, stateDuration, consumed) => {
  const condition = transition.conditions?.[0];
  if (!condition) return transition.has_exit_time && elapsed / Math.max(stateDuration, 0.01) >= transition.exit_time;
  const value = values[condition.parameter];
  if (condition.mode === 'Trigger') return Number(value) > (consumed.current[condition.parameter] || 0);
  if (condition.mode === 'If') return !!value;
  if (condition.mode === 'IfNot') return !value;
  if (condition.mode === 'Greater') return Number(value) >= Number(condition.threshold);
  if (condition.mode === 'Less') return Number(value) <= Number(condition.threshold);
  return elapsed / Math.max(stateDuration, 0.01) >= Number(condition.threshold || transition.exit_time || 1);
};

export default function useControllerPreviewMachine(layer, values, playing) {
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
  }, [layer?.id, layer?.default_state_id, playing]);

  useEffect(() => {
    if (!playing || !activeStateId) return;
    const tick = () => {
      if (busy.current) return;
      const state = layer.states.find(item => item.id === activeStateId);
      const anyState = layer.states.find(item => item.type === 'AnyState');
      const candidates = layer.transitions.filter(item => item.from_state_id === activeStateId || item.from_state_id === anyState?.id);
      const elapsed = (performance.now() - enteredAt.current) / 1000;
      const next = candidates.find(item => passes(item, values, elapsed, state?.duration_seconds || 1, consumed));
      if (!next) return;
      busy.current = true;
      const condition = next.conditions?.[0];
      if (condition?.mode === 'Trigger') consumed.current[condition.parameter] = Number(values[condition.parameter]);
      setActiveTransitionId(next.id);
      window.setTimeout(() => {
        setActiveStateId(next.to_state_id);
        setActiveTransitionId('');
        enteredAt.current = performance.now();
        busy.current = false;
      }, Math.max(40, Number(next.duration_seconds || 0) * 1000));
    };
    const timer = window.setInterval(tick, 80);
    tick();
    return () => window.clearInterval(timer);
  }, [activeStateId, layer, playing, values]);

  return { activeStateId, activeTransitionId };
}