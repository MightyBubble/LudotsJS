import React, { useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GitBranch, Plus, Repeat, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BoolField, NumberField, Section, SelectField, TextField } from '@/components/ludots/ui';

const CONDITION_OPTIONS = [
  { value: 'None', label: '???' },
  { value: 'Trigger', label: 'Trigger' },
  { value: 'BoolTrue', label: 'Bool True' },
  { value: 'BoolFalse', label: 'Bool False' },
  { value: 'FloatGreaterOrEqual', label: 'Float >=' },
  { value: 'FloatLessOrEqual', label: 'Float <=' },
  { value: 'AutoOnNormalizedTime', label: '?????' },
];

const DURATION_MODE_OPTIONS = [
  { value: 'Seconds', label: 'Seconds' },
  { value: 'NormalizedSourceState', label: 'Normalized Source State' },
];

const INTERRUPT_OPTIONS = [
  { value: 'None', label: 'None' },
  { value: 'CurrentState', label: 'Current State' },
  { value: 'NextState', label: 'Next State' },
  { value: 'CurrentThenNext', label: 'Current Then Next' },
  { value: 'NextThenCurrent', label: 'Next Then Current' },
];

const PARAMETERLESS_CONDITIONS = new Set(['None', 'AutoOnNormalizedTime']);

const clampIndex = (value, max) => Math.max(0, Math.min(Number(value) || 0, Math.max(0, max)));

const makeState = (packedStateIndex = 0) => ({
  packed_state_index: packedStateIndex,
  duration_seconds: 1,
  playback_speed: 1,
  loop: true,
});

const makeTransition = (from, to) => ({
  from_state_index: from,
  to_state_index: to,
  condition_kind: 'None',
  parameter_index: 'none',
  threshold: 0,
  duration_seconds: 0.15,
  duration_mode: 'Seconds',
  consume_trigger: false,
  has_exit_time: false,
  exit_time: 0,
  interrupt_source: 'None',
  ordered_interruption: false,
});

function normalizeState(state, index) {
  return {
    ...makeState(index),
    ...(state || {}),
    packed_state_index: Number.isFinite(Number(state?.packed_state_index)) ? Number(state.packed_state_index) : index,
    duration_seconds: Number(state?.duration_seconds) > 0 ? Number(state.duration_seconds) : 1,
    playback_speed: Number(state?.playback_speed) > 0 ? Number(state.playback_speed) : 1,
    loop: state?.loop !== false,
  };
}

function normalizeTransition(transition, stateCount) {
  const conditionKind = transition?.condition_kind || 'None';
  const parameterless = PARAMETERLESS_CONDITIONS.has(conditionKind);
  const hasExitTime = !!transition?.has_exit_time;
  return {
    ...makeTransition(0, Math.min(1, Math.max(0, stateCount - 1))),
    ...(transition || {}),
    from_state_index: clampIndex(transition?.from_state_index, stateCount - 1),
    to_state_index: clampIndex(transition?.to_state_index, stateCount - 1),
    condition_kind: conditionKind,
    parameter_index: parameterless ? 'none' : (transition?.parameter_index || ''),
    threshold: Number.isFinite(Number(transition?.threshold)) ? Number(transition.threshold) : 0,
    duration_seconds: Math.max(0, Number(transition?.duration_seconds) || 0),
    duration_mode: transition?.duration_mode === 'NormalizedSourceState' ? 'NormalizedSourceState' : 'Seconds',
    consume_trigger: conditionKind === 'Trigger' ? !!transition?.consume_trigger : false,
    has_exit_time: hasExitTime,
    exit_time: hasExitTime ? clampIndex(Number(transition?.exit_time) || 0, 1) : 0,
    interrupt_source: transition?.interrupt_source || 'None',
    ordered_interruption: transition?.interrupt_source && transition.interrupt_source !== 'None'
      ? !!transition?.ordered_interruption
      : false,
  };
}

function StateNode({ data, selected }) {
  const { state, index, isDefault, outgoingCount } = data;
  return (
    <button
      type="button"
      className={`min-w-[150px] rounded border bg-[#15171C] px-3 py-2 text-left shadow-sm transition-colors ${
        selected ? 'border-[#cbd3dc] ring-1 ring-[#cbd3dc]' : 'border-[#424a55] hover:border-[#6f7a86]'
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-[#9aa5b1]" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#dce2e8]">State {index}</span>
        {isDefault && <span className="rounded bg-[#303845] px-1.5 py-0.5 text-[9px] text-[#dce2e8]">??</span>}
      </div>
      <div className="mt-1 font-mono text-[11px] text-[#E2D8B3]">packed {state.packed_state_index}</div>
      <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">
        <span>{state.duration_seconds}s</span>
        <span>{state.playback_speed}x</span>
        {state.loop && <Repeat className="h-3 w-3" />}
        <span className="ml-auto">{outgoingCount} out</span>
      </div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-[#9aa5b1]" />
    </button>
  );
}

const nodeTypes = { animatorState: StateNode };

function transitionLabel(transition) {
  if (transition.condition_kind === 'None') return 'None';
  if (transition.condition_kind === 'AutoOnNormalizedTime') return `time >= ${transition.threshold}`;
  if (transition.condition_kind === 'Trigger') return `trigger ${transition.parameter_index || '?'}`;
  if (transition.condition_kind === 'BoolTrue') return `${transition.parameter_index || '?'} true`;
  if (transition.condition_kind === 'BoolFalse') return `${transition.parameter_index || '?'} false`;
  if (transition.condition_kind === 'FloatGreaterOrEqual') return `${transition.parameter_index || '?'} >= ${transition.threshold}`;
  if (transition.condition_kind === 'FloatLessOrEqual') return `${transition.parameter_index || '?'} <= ${transition.threshold}`;
  return transition.condition_kind;
}

export default function AnimatorControllerDetails({ draft, patch }) {
  const states = useMemo(() => (draft.states?.length ? draft.states : [makeState(0)]).map(normalizeState), [draft.states]);
  const transitions = useMemo(
    () => (draft.transitions || []).map(transition => normalizeTransition(transition, states.length)),
    [draft.transitions, states.length],
  );
  const [selectedStateIndex, setSelectedStateIndex] = useState(0);
  const [selectedTransitionIndex, setSelectedTransitionIndex] = useState(null);
  const [newTransition, setNewTransition] = useState({ from: 0, to: Math.min(1, states.length - 1) });

  useEffect(() => {
    setSelectedStateIndex(current => clampIndex(current, states.length - 1));
    setSelectedTransitionIndex(current => current == null || current >= transitions.length ? null : current);
    setNewTransition(current => ({
      from: clampIndex(current.from, states.length - 1),
      to: clampIndex(current.to, states.length - 1),
    }));
  }, [states.length, transitions.length]);

  const stateOptions = states.map((state, index) => ({
    value: String(index),
    label: `State ${index} ? packed ${state.packed_state_index}`,
  }));

  const patchStates = nextStates => patch({
    states: nextStates,
    default_state_index: clampIndex(draft.default_state_index, nextStates.length - 1),
  });

  const patchTransitions = nextTransitions => patch({
    transitions: nextTransitions.map(transition => normalizeTransition(transition, states.length)),
  });

  const updateState = (index, updates) => {
    patchStates(states.map((state, i) => i === index ? normalizeState({ ...state, ...updates }, i) : state));
  };

  const addState = () => {
    const nextPackedIndex = states.reduce((max, state) => Math.max(max, Number(state.packed_state_index) || 0), -1) + 1;
    const nextStates = [...states, makeState(nextPackedIndex)];
    patchStates(nextStates);
    setSelectedStateIndex(nextStates.length - 1);
    setSelectedTransitionIndex(null);
  };

  const removeState = (index) => {
    if (states.length <= 1) return;
    const nextStates = states.filter((_, i) => i !== index).map(normalizeState);
    const nextTransitions = transitions
      .filter(transition => transition.from_state_index !== index && transition.to_state_index !== index)
      .map(transition => ({
        ...transition,
        from_state_index: transition.from_state_index > index ? transition.from_state_index - 1 : transition.from_state_index,
        to_state_index: transition.to_state_index > index ? transition.to_state_index - 1 : transition.to_state_index,
      }));
    patch({
      states: nextStates,
      transitions: nextTransitions,
      default_state_index: clampIndex(
        (Number(draft.default_state_index) || 0) > index ? Number(draft.default_state_index) - 1 : draft.default_state_index,
        nextStates.length - 1,
      ),
    });
    setSelectedStateIndex(clampIndex(index, nextStates.length - 1));
    setSelectedTransitionIndex(null);
  };

  const addTransition = (from = newTransition.from, to = newTransition.to) => {
    if (states.length < 2) return;
    const nextTransitions = [...transitions, makeTransition(clampIndex(from, states.length - 1), clampIndex(to, states.length - 1))];
    patchTransitions(nextTransitions);
    setSelectedTransitionIndex(nextTransitions.length - 1);
  };

  const updateTransition = (index, updates) => {
    const base = transitions[index];
    const next = normalizeTransition({ ...base, ...updates }, states.length);
    patchTransitions(transitions.map((transition, i) => i === index ? next : transition));
  };

  const removeTransition = (index) => {
    patchTransitions(transitions.filter((_, i) => i !== index));
    setSelectedTransitionIndex(null);
  };

  const nodes = states.map((state, index) => ({
    id: `state-${index}`,
    type: 'animatorState',
    position: { x: 60 + (index % 4) * 220, y: 70 + Math.floor(index / 4) * 150 },
    data: {
      state,
      index,
      isDefault: index === clampIndex(draft.default_state_index, states.length - 1),
      outgoingCount: transitions.filter(transition => transition.from_state_index === index).length,
    },
  }));

  const edges = transitions.map((transition, index) => ({
    id: `transition-${index}`,
    source: `state-${transition.from_state_index}`,
    target: `state-${transition.to_state_index}`,
    label: transitionLabel(transition),
    selected: index === selectedTransitionIndex,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#9aa5b1' },
    style: { stroke: index === selectedTransitionIndex ? '#cbd3dc' : '#6f7a86', strokeWidth: index === selectedTransitionIndex ? 2.5 : 1.5 },
    labelStyle: { fill: '#dce2e8', fontSize: 11 },
    labelBgStyle: { fill: '#15171C', fillOpacity: 0.9 },
  }));

  const selectedState = states[selectedStateIndex];
  const selectedTransition = selectedTransitionIndex == null ? null : transitions[selectedTransitionIndex];

  return (
    <div className="space-y-3">
      <Section title="animator_controllers.json">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(240px,1fr)_180px]">
          <TextField label="ID" value={draft.controller_id} onChange={controller_id => patch({ controller_id })} />
          <SelectField
            label="Default State"
            value={String(clampIndex(draft.default_state_index, states.length - 1))}
            options={stateOptions}
            onChange={value => patch({ default_state_index: Number(value) })}
          />
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(460px,1fr)_360px]">
        <div className="min-h-[520px] overflow-hidden rounded border border-[#2A2E37] bg-[#0D0F14]">
          <div className="flex h-10 items-center justify-between border-b border-[#2A2E37] px-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#E2D8B3]">
              <GitBranch className="h-3.5 w-3.5" />
              ???
            </div>
            <Button size="sm" onClick={addState} className="h-7 bg-[#1E2128]">
              <Plus className="h-3 w-3" />??
            </Button>
          </div>
          <div className="h-[480px]">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              nodesDraggable={false}
              fitView
              onNodeClick={(_, node) => {
                setSelectedStateIndex(Number(node.id.replace('state-', '')));
                setSelectedTransitionIndex(null);
              }}
              onEdgeClick={(_, edge) => {
                setSelectedTransitionIndex(Number(edge.id.replace('transition-', '')));
              }}
              onConnect={connection => {
                const from = Number((connection.source || '').replace('state-', ''));
                const to = Number((connection.target || '').replace('state-', ''));
                if (Number.isInteger(from) && Number.isInteger(to)) addTransition(from, to);
              }}
            >
              <Background color="#303845" variant={BackgroundVariant.Dots} gap={18} size={1} />
              <Controls className="!border-[#424a55] !bg-[#15171C]" />
              <MiniMap pannable zoomable nodeColor="#303845" maskColor="rgba(13, 15, 20, 0.65)" />
            </ReactFlow>
          </div>
        </div>

        <div className="space-y-3">
          <Section
            title="States"
            right={<Button size="sm" onClick={addState} className="h-7 bg-[#1E2128]"><Plus className="h-3 w-3" />??</Button>}
          >
            <div className="space-y-2">
              {states.map((state, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => { setSelectedStateIndex(index); setSelectedTransitionIndex(null); }}
                  className={`flex w-full items-center justify-between rounded border px-2 py-1.5 text-left text-xs ${
                    selectedStateIndex === index && selectedTransitionIndex == null
                      ? 'border-[#cbd3dc] bg-[#242a32] text-[#dce2e8]'
                      : 'border-[#2A2E37] bg-[#0D0F14] text-gray-400 hover:border-[#424a55]'
                  }`}
                >
                  <span>State {index}</span>
                  <span className="font-mono">packed {state.packed_state_index}</span>
                </button>
              ))}
            </div>
          </Section>

          {selectedState && selectedTransitionIndex == null && (
            <Section
              title={`State ${selectedStateIndex}`}
              right={
                <Button size="sm" variant="ghost" onClick={() => removeState(selectedStateIndex)} disabled={states.length <= 1} className="h-7 text-red-400">
                  <Trash2 className="h-3 w-3" />
                </Button>
              }
            >
              <NumberField label="Packed State Index" value={selectedState.packed_state_index} onChange={packed_state_index => updateState(selectedStateIndex, { packed_state_index })} />
              <NumberField label="Duration Seconds" value={selectedState.duration_seconds} onChange={duration_seconds => updateState(selectedStateIndex, { duration_seconds })} />
              <NumberField label="Playback Speed" value={selectedState.playback_speed} onChange={playback_speed => updateState(selectedStateIndex, { playback_speed })} />
              <BoolField label="Loop" value={selectedState.loop} onChange={loop => updateState(selectedStateIndex, { loop })} />
              <Button size="sm" onClick={() => patch({ default_state_index: selectedStateIndex })} className="h-7 bg-[#1E2128]">
                ??????
              </Button>
            </Section>
          )}

          <Section
            title="Transitions"
            right={<Button size="sm" onClick={() => addTransition()} disabled={states.length < 2} className="h-7 bg-[#1E2128]"><Plus className="h-3 w-3" />??</Button>}
          >
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
              <SelectField label="From" value={String(newTransition.from)} options={stateOptions} onChange={value => setNewTransition(current => ({ ...current, from: Number(value) }))} />
              <SelectField label="To" value={String(newTransition.to)} options={stateOptions} onChange={value => setNewTransition(current => ({ ...current, to: Number(value) }))} />
              <Button size="sm" onClick={() => addTransition()} disabled={states.length < 2} className="mb-0 h-8 bg-[#1E2128]">
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <div className="space-y-2">
              {transitions.map((transition, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedTransitionIndex(index)}
                  className={`w-full rounded border px-2 py-1.5 text-left text-xs ${
                    selectedTransitionIndex === index
                      ? 'border-[#cbd3dc] bg-[#242a32] text-[#dce2e8]'
                      : 'border-[#2A2E37] bg-[#0D0F14] text-gray-400 hover:border-[#424a55]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>State {transition.from_state_index} -> State {transition.to_state_index}</span>
                    <span className="font-mono">{transition.duration_seconds}s</span>
                  </div>
                  <div className="mt-1 truncate text-[10px] text-gray-500">{transitionLabel(transition)}</div>
                </button>
              ))}
            </div>
          </Section>

          {selectedTransition && (
            <Section
              title={`Transition ${selectedTransitionIndex}`}
              right={<Button size="sm" variant="ghost" onClick={() => removeTransition(selectedTransitionIndex)} className="h-7 text-red-400"><Trash2 className="h-3 w-3" /></Button>}
            >
              <div className="grid grid-cols-2 gap-2">
                <SelectField label="From" value={String(selectedTransition.from_state_index)} options={stateOptions} onChange={value => updateTransition(selectedTransitionIndex, { from_state_index: Number(value) })} />
                <SelectField label="To" value={String(selectedTransition.to_state_index)} options={stateOptions} onChange={value => updateTransition(selectedTransitionIndex, { to_state_index: Number(value) })} />
              </div>
              <SelectField label="Condition" value={selectedTransition.condition_kind} options={CONDITION_OPTIONS} onChange={condition_kind => updateTransition(selectedTransitionIndex, { condition_kind })} />
              {!PARAMETERLESS_CONDITIONS.has(selectedTransition.condition_kind) && (
                <TextField label="Parameter Index" value={selectedTransition.parameter_index} onChange={parameter_index => updateTransition(selectedTransitionIndex, { parameter_index })} />
              )}
              {selectedTransition.condition_kind !== 'None' && (
                <NumberField label="Threshold" value={selectedTransition.threshold} onChange={threshold => updateTransition(selectedTransitionIndex, { threshold })} />
              )}
              <div className="grid grid-cols-2 gap-2">
                <NumberField label="Duration" value={selectedTransition.duration_seconds} onChange={duration_seconds => updateTransition(selectedTransitionIndex, { duration_seconds })} />
                <SelectField label="Duration Mode" value={selectedTransition.duration_mode} options={DURATION_MODE_OPTIONS} onChange={duration_mode => updateTransition(selectedTransitionIndex, { duration_mode })} />
              </div>
              <BoolField label="Has Exit Time" value={selectedTransition.has_exit_time} onChange={has_exit_time => updateTransition(selectedTransitionIndex, { has_exit_time })} />
              {selectedTransition.has_exit_time && (
                <NumberField label="Exit Time" value={selectedTransition.exit_time} onChange={exit_time => updateTransition(selectedTransitionIndex, { exit_time })} />
              )}
              <SelectField label="Interrupt Source" value={selectedTransition.interrupt_source} options={INTERRUPT_OPTIONS} onChange={interrupt_source => updateTransition(selectedTransitionIndex, { interrupt_source })} />
              {selectedTransition.interrupt_source !== 'None' && (
                <BoolField label="Ordered Interruption" value={selectedTransition.ordered_interruption} onChange={ordered_interruption => updateTransition(selectedTransitionIndex, { ordered_interruption })} />
              )}
              {selectedTransition.condition_kind === 'Trigger' && (
                <BoolField label="Consume Trigger" value={selectedTransition.consume_trigger} onChange={consume_trigger => updateTransition(selectedTransitionIndex, { consume_trigger })} />
              )}
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

