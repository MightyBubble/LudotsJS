import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  getBezierPath,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileStack,
  FolderOpen,
  GitBranch,
  Layers,
  Pause,
  Play,
  Plus,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import ReferenceSelect from './ReferenceSelect';
import AnimatorControllerPreview from './AnimatorControllerPreview';

const STATE_TYPES = ['Normal', 'BlendTree', 'SubStateMachine'];
const SPECIAL_STATE_TYPES = new Set(['Entry', 'Exit', 'AnyState']);
const RUNTIME_STATE_TYPES = new Set(['Normal', 'BlendTree', 'SubStateMachine']);
const PARAMETER_TYPES = ['Float', 'Int', 'Bool', 'Trigger'];
const CONDITIONLESS = { parameter: 'none', mode: 'None', threshold: 0 };

const STATE_COLORS = {
  Entry: '#4B8F6D',
  Exit: '#B5544F',
  AnyState: '#3E8395',
  Normal: '#96A0B0',
  BlendTree: '#7B83A5',
  SubStateMachine: '#6B778D',
};

const DURATION_MODES = ['Seconds', 'NormalizedSourceState'];
const INTERRUPT_SOURCES = ['None', 'CurrentState', 'NextState', 'CurrentThenNext', 'NextThenCurrent'];

function createId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, defaultValue) {
  const next = Number(value);
  return Number.isFinite(next) ? next : defaultValue;
}

function toPositive(value, defaultValue) {
  const next = toNumber(value, defaultValue);
  return next > 0 ? next : defaultValue;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, toNumber(value, 0)));
}

function makeSpecialState(type, layerIndex) {
  const positions = {
    Entry: { x: 80, y: 160 },
    AnyState: { x: 80, y: 270 },
    Exit: { x: 760, y: 160 },
  };
  return {
    id: `${type.toLowerCase()}_${layerIndex}`,
    name: type === 'AnyState' ? 'Any State' : type,
    type,
    position: positions[type],
  };
}

function makeAuthoringState(type = 'Normal', position = { x: 320, y: 160 }, packedIndex = 0) {
  const name = type === 'Normal' ? `State ${packedIndex}` : type;
  return {
    id: createId('state'),
    name,
    type,
    position,
    packed_state_index: packedIndex,
    duration_seconds: 1,
    playback_speed: 1,
    loop: true,
    animation_clip_asset_id: '',
    blend_tree: type === 'BlendTree' ? makeBlendTree() : undefined,
    sub_controller_id: type === 'SubStateMachine' ? '' : undefined,
    parameter_mapping: type === 'SubStateMachine' ? {} : undefined,
    comment: '',
  };
}

function makeBlendTree() {
  return {
    blend_type: '1D',
    parameter: '',
    motions: [],
  };
}

function makeLayer(index = 0) {
  return {
    id: createId('layer'),
    name: index === 0 ? 'Base Layer' : `Layer ${index}`,
    weight: 1,
    blend_mode: 'Override',
    ik_pass: false,
    default_state_id: '',
    states: [
      makeSpecialState('Entry', index),
      makeAuthoringState('Normal', { x: 330, y: 160 }, index),
      makeSpecialState('AnyState', index),
      makeSpecialState('Exit', index),
    ],
    transitions: [],
  };
}

function makeAuthoringTransition(fromStateId, toStateId) {
  return {
    id: createId('transition'),
    from_state_id: fromStateId,
    to_state_id: toStateId,
    duration_seconds: 0.25,
    duration_mode: 'Seconds',
    has_exit_time: true,
    exit_time: 0.75,
    conditions: [],
    consume_trigger: false,
    interrupt_source: 'None',
    ordered_interruption: false,
    transition_curve: 'Linear',
  };
}

function normalizeRuntimeState(state, index) {
  return {
    packed_state_index: Number.isInteger(Number(state?.packed_state_index)) ? Number(state.packed_state_index) : index,
    duration_seconds: toPositive(state?.duration_seconds, 1),
    playback_speed: toPositive(state?.playback_speed, 1),
    loop: state?.loop !== false,
  };
}

function normalizeRuntimeTransition(transition, stateCount) {
  const max = Math.max(0, stateCount - 1);
  const conditionKind = transition?.condition_kind || 'None';
  const needsParameter = !['None', 'AutoOnNormalizedTime'].includes(conditionKind);
  const hasExitTime = !!transition?.has_exit_time;
  return {
    from_state_index: Math.max(0, Math.min(max, toNumber(transition?.from_state_index, 0))),
    to_state_index: Math.max(0, Math.min(max, toNumber(transition?.to_state_index, 0))),
    condition_kind: conditionKind,
    parameter_index: needsParameter ? (transition?.parameter_index || '') : 'none',
    threshold: toNumber(transition?.threshold, 0),
    duration_seconds: Math.max(0, toNumber(transition?.duration_seconds, 0.25)),
    duration_mode: DURATION_MODES.includes(transition?.duration_mode) ? transition.duration_mode : 'Seconds',
    consume_trigger: conditionKind === 'Trigger' ? !!transition?.consume_trigger : false,
    has_exit_time: hasExitTime,
    exit_time: hasExitTime ? clamp01(transition?.exit_time) : 0,
    interrupt_source: INTERRUPT_SOURCES.includes(transition?.interrupt_source) ? transition.interrupt_source : 'None',
    ordered_interruption: transition?.interrupt_source && transition.interrupt_source !== 'None'
      ? !!transition?.ordered_interruption
      : false,
  };
}

function stateFromRuntime(state, index) {
  return {
    ...makeAuthoringState('Normal', { x: 320 + (index % 3) * 220, y: 150 + Math.floor(index / 3) * 150 }, index),
    id: `runtime_state_${index}`,
    name: `State ${index}`,
    ...normalizeRuntimeState(state, index),
  };
}

function conditionFromRuntime(transition) {
  const kind = transition?.condition_kind || 'None';
  const parameter = transition?.parameter_index || 'none';
  if (kind === 'None') return null;
  if (kind === 'Trigger') return { parameter, mode: 'Trigger', threshold: 0 };
  if (kind === 'BoolTrue') return { parameter, mode: 'If', threshold: 0 };
  if (kind === 'BoolFalse') return { parameter, mode: 'IfNot', threshold: 0 };
  if (kind === 'FloatGreaterOrEqual') return { parameter, mode: 'Greater', threshold: toNumber(transition?.threshold, 0) };
  if (kind === 'FloatLessOrEqual') return { parameter, mode: 'Less', threshold: toNumber(transition?.threshold, 0) };
  if (kind === 'AutoOnNormalizedTime') return { parameter: 'none', mode: 'ExitTime', threshold: toNumber(transition?.threshold, 0) };
  return null;
}

function layerFromRuntime(draft) {
  const runtimeStates = (draft.states?.length ? draft.states : [normalizeRuntimeState(null, 0)]).map(stateFromRuntime);
  const runtimeTransitions = (draft.transitions || []).map((transition, index) => {
    const normalized = normalizeRuntimeTransition(transition, runtimeStates.length);
    const condition = conditionFromRuntime(normalized);
    return {
      id: `runtime_transition_${index}`,
      from_state_id: `runtime_state_${normalized.from_state_index}`,
      to_state_id: `runtime_state_${normalized.to_state_index}`,
      duration_seconds: normalized.duration_seconds,
      duration_mode: normalized.duration_mode,
      has_exit_time: normalized.has_exit_time,
      exit_time: normalized.exit_time,
      conditions: condition ? [condition] : [],
      consume_trigger: normalized.consume_trigger,
      interrupt_source: normalized.interrupt_source,
      ordered_interruption: normalized.ordered_interruption,
      transition_curve: 'Linear',
    };
  });
  return {
    ...makeLayer(0),
    id: 'base_layer',
    default_state_id: `runtime_state_${Math.max(0, Math.min(runtimeStates.length - 1, toNumber(draft.default_state_index, 0)))}`,
    states: [makeSpecialState('Entry', 0), ...runtimeStates, makeSpecialState('AnyState', 0), makeSpecialState('Exit', 0)],
    transitions: runtimeTransitions,
  };
}

function normalizeParameter(parameter, index) {
  const type = PARAMETER_TYPES.includes(parameter?.type) ? parameter.type : 'Float';
  return {
    id: parameter?.id || `param_${index}_${parameter?.name || type}`,
    name: parameter?.name || `parameter_${index}`,
    type,
    default_value: toNumber(parameter?.default_value ?? parameter?.defaultValue, type === 'Bool' || type === 'Trigger' ? 0 : 0),
  };
}

function normalizeAuthoringState(state, index) {
  const type = ['Entry', 'Exit', 'AnyState', ...STATE_TYPES].includes(state?.type) ? state.type : 'Normal';
  const base = SPECIAL_STATE_TYPES.has(type)
    ? makeSpecialState(type, index)
    : makeAuthoringState(type, state?.position || { x: 320, y: 160 }, index);
  return {
    ...base,
    ...(state || {}),
    type,
    position: {
      x: toNumber(state?.position?.x, base.position.x),
      y: toNumber(state?.position?.y, base.position.y),
    },
    packed_state_index: SPECIAL_STATE_TYPES.has(type) ? undefined : Number.isInteger(Number(state?.packed_state_index)) ? Number(state.packed_state_index) : index,
    duration_seconds: SPECIAL_STATE_TYPES.has(type) ? undefined : toPositive(state?.duration_seconds, 1),
    playback_speed: SPECIAL_STATE_TYPES.has(type) ? undefined : toPositive(state?.playback_speed, 1),
    loop: SPECIAL_STATE_TYPES.has(type) ? undefined : state?.loop !== false,
    blend_tree: type === 'BlendTree' ? normalizeBlendTree(state?.blend_tree) : undefined,
    parameter_mapping: type === 'SubStateMachine' ? (state?.parameter_mapping || {}) : undefined,
  };
}

function normalizeBlendTree(tree) {
  return {
    blend_type: tree?.blend_type === '2D' ? '2D' : '1D',
    parameter: tree?.parameter || '',
    parameter_y: tree?.parameter_y || '',
    motions: (tree?.motions || []).map((motion, index) => ({
      id: motion.id || `motion_${index}`,
      clip_asset_id: motion.clip_asset_id || motion.animation_clip_asset_id || '',
      threshold_x: toNumber(motion.threshold_x, index),
      threshold_y: toNumber(motion.threshold_y, 0),
      playback_speed: toPositive(motion.playback_speed, 1),
    })),
  };
}

function normalizeLayer(layer, index) {
  const base = makeLayer(index);
  const sourceStates = Array.isArray(layer?.states) && layer.states.length ? layer.states : base.states;
  const states = sourceStates.map((state, stateIndex) => normalizeAuthoringState(state, stateIndex));
  const hasType = type => states.some(state => state.type === type);
  const withSpecials = [
    ...(hasType('Entry') ? [] : [makeSpecialState('Entry', index)]),
    ...states,
    ...(hasType('AnyState') ? [] : [makeSpecialState('AnyState', index)]),
    ...(hasType('Exit') ? [] : [makeSpecialState('Exit', index)]),
  ];
  return {
    ...base,
    ...(layer || {}),
    name: layer?.name || base.name,
    weight: Math.max(0, toNumber(layer?.weight, 1)),
    blend_mode: layer?.blend_mode === 'Additive' ? 'Additive' : 'Override',
    ik_pass: !!layer?.ik_pass,
    states: withSpecials,
    transitions: (layer?.transitions || []).map((transition, transitionIndex) => ({
      id: transition.id || `transition_${index}_${transitionIndex}`,
      from_state_id: transition.from_state_id || '',
      to_state_id: transition.to_state_id || '',
      duration_seconds: Math.max(0, toNumber(transition.duration_seconds, 0.25)),
      duration_mode: DURATION_MODES.includes(transition.duration_mode) ? transition.duration_mode : 'Seconds',
      has_exit_time: !!transition.has_exit_time,
      exit_time: transition.has_exit_time ? clamp01(transition.exit_time) : 0,
      conditions: (transition.conditions || []).slice(0, 1).map(condition => ({
        parameter: condition.parameter || 'none',
        mode: condition.mode || 'None',
        threshold: toNumber(condition.threshold, 0),
      })),
      consume_trigger: !!transition.consume_trigger,
      interrupt_source: INTERRUPT_SOURCES.includes(transition.interrupt_source) ? transition.interrupt_source : 'None',
      ordered_interruption: transition.interrupt_source && transition.interrupt_source !== 'None'
        ? !!transition.ordered_interruption
        : false,
      transition_curve: transition.transition_curve || 'Linear',
    })),
  };
}

function normalizeController(draft) {
  const layers = (draft.authoring_layers?.length ? draft.authoring_layers : [layerFromRuntime(draft)]).map(normalizeLayer);
  return {
    layers,
    parameters: (draft.authoring_parameters || []).map(normalizeParameter),
  };
}

function conditionToRuntime(condition, parameters) {
  if (!condition || condition.mode === 'None') {
    return { condition_kind: 'None', parameter_index: 'none', threshold: 0 };
  }
  if (condition.mode === 'ExitTime') {
    return { condition_kind: 'AutoOnNormalizedTime', parameter_index: 'none', threshold: toNumber(condition.threshold, 0) };
  }
  const parameter = parameters.find(item => item.name === condition.parameter);
  if (parameter?.type === 'Trigger' || condition.mode === 'Trigger') {
    return { condition_kind: 'Trigger', parameter_index: condition.parameter, threshold: 0 };
  }
  if (parameter?.type === 'Bool' || condition.mode === 'If' || condition.mode === 'IfNot') {
    return { condition_kind: condition.mode === 'IfNot' ? 'BoolFalse' : 'BoolTrue', parameter_index: condition.parameter, threshold: 0 };
  }
  if (condition.mode === 'Less') {
    return { condition_kind: 'FloatLessOrEqual', parameter_index: condition.parameter, threshold: toNumber(condition.threshold, 0) };
  }
  return { condition_kind: 'FloatGreaterOrEqual', parameter_index: condition.parameter, threshold: toNumber(condition.threshold, 0) };
}

function compileTransition(transition, parameters, fromIndex, toIndex) {
  const runtimeCondition = conditionToRuntime(transition.conditions?.[0], parameters);
  const interruptSource = INTERRUPT_SOURCES.includes(transition.interrupt_source) ? transition.interrupt_source : 'None';
  return {
    from_state_index: fromIndex,
    to_state_index: toIndex,
    ...runtimeCondition,
    duration_seconds: Math.max(0, toNumber(transition.duration_seconds, 0.25)),
    duration_mode: DURATION_MODES.includes(transition.duration_mode) ? transition.duration_mode : 'Seconds',
    consume_trigger: runtimeCondition.condition_kind === 'Trigger' ? !!transition.consume_trigger : false,
    has_exit_time: !!transition.has_exit_time,
    exit_time: transition.has_exit_time ? clamp01(transition.exit_time) : 0,
    interrupt_source: interruptSource,
    ordered_interruption: interruptSource !== 'None' ? !!transition.ordered_interruption : false,
  };
}

function compileAuthoring(layers, parameters) {
  const states = [];
  const stateIndexById = new Map();
  const stateById = new Map();

  layers.forEach(layer => {
    layer.states.forEach(state => {
      stateById.set(state.id, state);
      if (RUNTIME_STATE_TYPES.has(state.type)) {
        stateIndexById.set(state.id, states.length);
        states.push(normalizeRuntimeState({
          packed_state_index: state.packed_state_index,
          duration_seconds: state.duration_seconds,
          playback_speed: state.playback_speed,
          loop: state.loop,
        }, states.length));
      }
    });
  });

  if (states.length === 0) {
    states.push(normalizeRuntimeState(null, 0));
  }

  let defaultStateIndex = 0;
  for (const layer of layers) {
    if (stateIndexById.has(layer.default_state_id)) {
      defaultStateIndex = stateIndexById.get(layer.default_state_id);
      break;
    }
  }

  const transitions = [];
  layers.forEach(layer => {
    layer.transitions.forEach(transition => {
      const from = stateById.get(transition.from_state_id);
      const to = stateById.get(transition.to_state_id);
      if (!from || !to) return;
      if (from.type === 'Entry' && stateIndexById.has(to.id)) {
        defaultStateIndex = stateIndexById.get(to.id);
        return;
      }
      if (from.type === 'AnyState' && stateIndexById.has(to.id)) {
        const excluded = new Set(from.excluded_state_ids || []);
        const layerRuntimeStateIds = layer.states
          .filter(state => RUNTIME_STATE_TYPES.has(state.type))
          .map(state => state.id);
        layerRuntimeStateIds.forEach(stateId => {
          if (stateId !== to.id && !excluded.has(stateId)) {
            const fromIndex = stateIndexById.get(stateId);
            if (fromIndex != null) {
              transitions.push(compileTransition(transition, parameters, fromIndex, stateIndexById.get(to.id)));
            }
          }
        });
        return;
      }
      if (stateIndexById.has(from.id) && stateIndexById.has(to.id)) {
        transitions.push(compileTransition(transition, parameters, stateIndexById.get(from.id), stateIndexById.get(to.id)));
      }
    });
  });

  return {
    default_state_index: defaultStateIndex,
    states,
    transitions: transitions.map(item => normalizeRuntimeTransition(item, states.length)),
  };
}

function transitionConditionLabel(transition) {
  const condition = transition.conditions?.[0];
  if (!condition) return 'None';
  if (condition.mode === 'ExitTime') return `time >= ${condition.threshold}`;
  if (condition.mode === 'Trigger') return `${condition.parameter} trigger`;
  if (condition.mode === 'If') return `${condition.parameter} true`;
  if (condition.mode === 'IfNot') return `${condition.parameter} false`;
  if (condition.mode === 'Less') return `${condition.parameter} <= ${condition.threshold}`;
  if (condition.mode === 'Greater') return `${condition.parameter} >= ${condition.threshold}`;
  return 'None';
}

function FieldLabel({ children }) {
  return <label className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{children}</label>;
}

function Panel({ title, icon: Icon, right, children }) {
  return (
    <div className="flex h-full min-h-0 flex-col border border-[#2A2E37] bg-[#15171C]">
      <div className="flex h-10 items-center justify-between border-b border-[#2A2E37] px-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#E2D8B3]">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          <span>{title}</span>
        </div>
        {right}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled = false }) {
  return (
    <Input
      value={value ?? ''}
      placeholder={placeholder}
      disabled={disabled}
      onChange={event => onChange(event.target.value)}
      className="h-8 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]"
    />
  );
}

function NumberInput({ value, onChange, min, max, step = 1 }) {
  return (
    <Input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value ?? ''}
      onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))}
      className="h-8 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]"
    />
  );
}

function OptionSelect({ value, options, onChange, placeholder = 'Unset', disabled = false }) {
  return (
    <Select value={value || '__none__'} onValueChange={next => onChange(next === '__none__' ? '' : next)} disabled={disabled}>
      <SelectTrigger className="h-8 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="border-[#2A2E37] bg-[#15171C] text-[#e5e5e5]">
        <SelectItem value="__none__">{placeholder}</SelectItem>
        {options.map(option => (
          <SelectItem key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InspectorField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex h-8 items-center justify-between border border-[#2A2E37] bg-[#0D0F14] px-2 text-left text-xs text-gray-300"
    >
      <span>{label}</span>
      <span className={`relative h-4 w-8 border border-[#424a55] ${checked ? 'bg-[#E2D8B3]' : 'bg-[#15171C]'}`}>
        <span className={`absolute top-0.5 h-2.5 w-2.5 bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
    </button>
  );
}

function LayerPanel({ layers, selectedLayerIndex, onSelectLayer, onAddLayer, onUpdateLayers }) {
  const [expanded, setExpanded] = useState(() => new Set([0]));

  const updateLayer = (index, updates) => {
    onUpdateLayers(layers.map((layer, layerIndex) => layerIndex === index ? { ...layer, ...updates } : layer));
  };

  const deleteLayer = (index) => {
    if (layers.length <= 1) return;
    const next = layers.filter((_, layerIndex) => layerIndex !== index);
    onUpdateLayers(next);
    onSelectLayer(Math.max(0, Math.min(selectedLayerIndex, next.length - 1)));
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-[#2A2E37] p-3">
        <Button size="sm" onClick={onAddLayer} className="h-8 w-full bg-[#242a32] text-xs">
          <Plus className="h-3.5 w-3.5" />
          Layer
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {layers.map((layer, index) => {
          const isExpanded = expanded.has(index);
          const selected = selectedLayerIndex === index;
          return (
            <div key={layer.id} className={`border-b border-[#2A2E37] ${selected ? 'bg-[#20262e]' : ''}`}>
              <button
                type="button"
                onClick={() => onSelectLayer(index)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-[#dce2e8] hover:bg-[#242a32]"
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={event => {
                    event.stopPropagation();
                    setExpanded(current => {
                      const next = new Set(current);
                      if (next.has(index)) next.delete(index);
                      else next.add(index);
                      return next;
                    });
                  }}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') event.currentTarget.click();
                  }}
                  className="text-gray-500"
                >
                  {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{layer.name}</span>
                <Badge variant="secondary" className="h-5 rounded-sm px-1.5 text-[10px]">{layer.states.filter(state => RUNTIME_STATE_TYPES.has(state.type)).length}</Badge>
                {index > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={event => {
                      event.stopPropagation();
                      deleteLayer(index);
                    }}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') event.currentTarget.click();
                    }}
                    className="text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
              {isExpanded && (
                <div className="flex flex-col gap-3 border-t border-[#2A2E37] bg-[#0D0F14] p-3">
                  <InspectorField label="Name">
                    <TextInput value={layer.name} onChange={name => updateLayer(index, { name })} />
                  </InspectorField>
                  <InspectorField label="Weight">
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[layer.weight * 100]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={([value]) => updateLayer(index, { weight: value / 100 })}
                        className="flex-1"
                      />
                      <span className="w-10 text-right font-mono text-[11px] text-gray-400">{Math.round(layer.weight * 100)}%</span>
                    </div>
                  </InspectorField>
                  <InspectorField label="Blend">
                    <OptionSelect value={layer.blend_mode} options={['Override', 'Additive']} onChange={blend_mode => updateLayer(index, { blend_mode })} />
                  </InspectorField>
                  <ToggleRow label="IK Pass" checked={layer.ik_pass} onChange={ik_pass => updateLayer(index, { ik_pass })} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ParameterPanel({ parameters, onAddParameter, onUpdateParameters }) {
  const [draft, setDraft] = useState({ name: '', type: 'Float', default_value: 0 });

  const updateParameter = (index, updates) => {
    onUpdateParameters(parameters.map((parameter, parameterIndex) => (
      parameterIndex === index ? normalizeParameter({ ...parameter, ...updates }, parameterIndex) : parameter
    )));
  };

  const addParameter = () => {
    const name = draft.name.trim();
    if (!name) return;
    onAddParameter({ ...draft, id: createId('param'), name });
    setDraft({ name: '', type: 'Float', default_value: 0 });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b border-[#2A2E37] p-3">
        <TextInput value={draft.name} onChange={name => setDraft(current => ({ ...current, name }))} placeholder="Parameter name" />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <OptionSelect value={draft.type} options={PARAMETER_TYPES} onChange={type => setDraft(current => ({ ...current, type }))} />
          <Button size="sm" onClick={addParameter} className="h-8 bg-[#242a32]">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {parameters.length === 0 && <div className="p-4 text-center text-xs text-gray-500">No parameters</div>}
        {parameters.map((parameter, index) => (
          <div key={parameter.id} className="flex flex-col gap-2 border border-[#2A2E37] bg-[#0D0F14] p-2">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center border border-[#424a55] text-[10px] font-bold text-[#E2D8B3]">
                {parameter.type[0]}
              </span>
              <Input
                value={parameter.name}
                onChange={event => updateParameter(index, { name: event.target.value })}
                className="h-7 flex-1 border-[#2A2E37] bg-[#15171C] text-xs text-[#e5e5e5]"
              />
              <button type="button" onClick={() => onUpdateParameters(parameters.filter((_, i) => i !== index))} className="text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <OptionSelect value={parameter.type} options={PARAMETER_TYPES} onChange={type => updateParameter(index, { type })} />
              <NumberInput value={parameter.default_value} onChange={default_value => updateParameter(index, { default_value })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatorStateNode({ data, selected }) {
  const { state, isDefault, outgoingCount, isPlaying, isActive, readOnly, onRename, onDelete, onOpenNested } = data;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.name);
  const special = SPECIAL_STATE_TYPES.has(state.type);
  const color = state.color || STATE_COLORS[state.type] || STATE_COLORS.Normal;

  useEffect(() => setName(state.name), [state.name]);

  const commit = () => {
    setEditing(false);
    const next = name.trim();
    if (next && next !== state.name) onRename(next);
    else setName(state.name);
  };

  return (
    <div
      data-runtime-active={isActive ? 'true' : 'false'}
      className={`relative w-[176px] border bg-[#15171C] shadow-sm transition ${isActive ? 'animator-state-active border-emerald-400 ring-2 ring-emerald-500/40' : selected ? 'border-[#E2D8B3] ring-1 ring-[#E2D8B3]' : 'border-[#424a55] hover:border-[#6f7a86]'}`}
      onDoubleClick={() => {
        if (readOnly) return;
        if (state.type === 'BlendTree' || state.type === 'SubStateMachine') onOpenNested();
        else if (!special) setEditing(true);
      }}
    >
      <div className="absolute bottom-0 left-0 top-0 w-1" style={{ backgroundColor: color }} />
      {state.type !== 'Entry' && state.type !== 'AnyState' && (
        <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-white !bg-[#748093]" />
      )}
      {state.type !== 'Exit' && (
        <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-white !bg-[#748093]" />
      )}
      <div className="flex flex-col gap-1.5 py-3 pl-4 pr-3">
        <div className="flex items-start gap-2">
          {state.type === 'SubStateMachine' && <FolderOpen className="mt-0.5 h-3.5 w-3.5 text-[#E2D8B3]" />}
          {editing ? (
            <Input
              value={name}
              autoFocus
              onChange={event => setName(event.target.value)}
              onBlur={commit}
              onKeyDown={event => {
                if (event.key === 'Enter') commit();
                if (event.key === 'Escape') {
                  setEditing(false);
                  setName(state.name);
                }
              }}
              className="nodrag h-7 flex-1 border-[#E2D8B3] bg-[#0D0F14] text-xs"
            />
          ) : (
            <div className="min-w-0 flex-1 truncate text-sm font-semibold text-[#dce2e8]">{state.name}</div>
          )}
          {!special && !readOnly && (
            <button type="button" className="nodrag text-gray-500 hover:text-red-400" onClick={event => { event.stopPropagation(); onDelete(); }}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="h-5 rounded-sm px-1.5 text-[10px]">{state.type}</Badge>
          {isDefault && <Badge className="h-5 rounded-sm bg-[#E2D8B3] px-1.5 text-[10px] text-[#15171C]">Default</Badge>}
          {isPlaying && isActive && <Badge className="h-5 rounded-sm bg-emerald-600 px-1.5 text-[10px]">Playing</Badge>}
        </div>
        {state.type === 'Normal' && (
          <div className="truncate font-mono text-[10px] text-gray-500">{state.animation_clip_asset_id || 'no clip'}</div>
        )}
        {RUNTIME_STATE_TYPES.has(state.type) && (
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>packed {state.packed_state_index}</span>
            <span>{state.playback_speed}x</span>
            <span className="ml-auto">{outgoingCount} out</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TransitionEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, selected, data }) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const highlighted = selected || data.active;
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        className={data.active ? 'animator-transition-active' : ''}
        style={{
          stroke: data.active ? '#34d399' : selected ? '#E2D8B3' : 'rgba(130, 145, 165, 0.55)',
          strokeWidth: highlighted ? 3 : 1.5,
        }}
      />
      <EdgeLabelRenderer>
        <div
          data-runtime-transition={data.active ? 'true' : 'false'}
          className={`flex h-6 min-w-6 items-center justify-center border px-1.5 text-[10px] font-semibold ${data.active ? 'animate-pulse border-emerald-400 bg-emerald-900 text-emerald-200' : selected ? 'border-[#E2D8B3] bg-[#242a32] text-[#E2D8B3]' : 'border-[#424a55] bg-[#15171C] text-gray-400'}`}
          style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { animatorState: AnimatorStateNode };
const edgeTypes = { transition: TransitionEdge };

function CanvasContextMenu({ menu, onClose, onAddState, onDeleteState }) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [onClose]);

  return (
    <div className="fixed border border-[#424a55] bg-[#15171C] p-1 shadow-lg" style={{ left: menu.x, top: menu.y, zIndex: 50 }}>
      {menu.stateId ? (
        <button type="button" onClick={onDeleteState} className="flex w-48 items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-[#242a32]">
          <Trash2 className="h-3.5 w-3.5" />
          Delete State
        </button>
      ) : (
        STATE_TYPES.map(type => (
          <button key={type} type="button" onClick={() => onAddState(type)} className="flex w-48 items-center gap-2 px-3 py-2 text-left text-xs text-gray-300 hover:bg-[#242a32]">
            <Plus className="h-3.5 w-3.5" />
            {type}
          </button>
        ))
      )}
    </div>
  );
}

function StateFlowCanvasInner({
  layer,
  defaultStateId,
  selectedStateId,
  selectedTransitionId,
  onSelectState,
  onSelectTransition,
  onUpdateLayer,
  onOpenNested,
  isPlaying,
  activeStateId,
  activeTransitionId,
  readOnly = false,
  compact = false,
}) {
  const { screenToFlowPosition, fitView } = useReactFlow();
  const [nodes, setNodes] = useState([]);
  const [menu, setMenu] = useState(null);
  const states = layer?.states || [];
  const transitions = layer?.transitions || [];

  const updateState = useCallback((stateId, updates) => {
    onUpdateLayer({
      ...layer,
      states: states.map(state => state.id === stateId ? normalizeAuthoringState({ ...state, ...updates }, 0) : state),
    });
  }, [layer, onUpdateLayer, states]);

  const deleteState = useCallback((stateId) => {
    const state = states.find(item => item.id === stateId);
    if (!state || SPECIAL_STATE_TYPES.has(state.type)) return;
    onUpdateLayer({
      ...layer,
      states: states.filter(item => item.id !== stateId).map(item => item.excluded_state_ids?.includes(stateId)
        ? { ...item, excluded_state_ids: item.excluded_state_ids.filter(id => id !== stateId) }
        : item),
      transitions: transitions.filter(transition => transition.from_state_id !== stateId && transition.to_state_id !== stateId),
      default_state_id: layer.default_state_id === stateId ? '' : layer.default_state_id,
    });
    if (selectedStateId === stateId) onSelectState(null);
  }, [layer, onSelectState, onUpdateLayer, selectedStateId, states, transitions]);

  const deleteTransition = useCallback((transitionId) => {
    onUpdateLayer({
      ...layer,
      transitions: transitions.filter(transition => transition.id !== transitionId),
    });
    if (selectedTransitionId === transitionId) onSelectTransition(null);
  }, [layer, onSelectTransition, onUpdateLayer, selectedTransitionId, transitions]);

  useEffect(() => {
    setNodes(states.map(state => ({
      id: state.id,
      type: 'animatorState',
      position: state.position || { x: 0, y: 0 },
      selected: false,
      data: {
        state,
        isDefault: defaultStateId === state.id,
        outgoingCount: transitions.filter(transition => transition.from_state_id === state.id).length,
        isPlaying: false,
        isActive: false,
        readOnly,
        onRename: name => updateState(state.id, { name }),
        onDelete: () => deleteState(state.id),
        onOpenNested: () => onOpenNested(state.id),
      },
    })));
  }, [defaultStateId, deleteState, onOpenNested, readOnly, states, transitions, updateState]);

  useEffect(() => {
    setNodes(current => current.map(node => ({
      ...node,
      selected: selectedStateId === node.id,
      data: { ...node.data, isPlaying, isActive: isPlaying && activeStateId === node.id },
    })));
  }, [activeStateId, isPlaying, selectedStateId]);

  useEffect(() => {
    if (!states.length) return undefined;
    const frame = requestAnimationFrame(() => fitView(compact
      ? { padding: 0.12, minZoom: 0.1, maxZoom: 0.8 }
      : { padding: 0.18, minZoom: 0.35, maxZoom: 1 }));
    return () => cancelAnimationFrame(frame);
  }, [compact, fitView, layer?.id, states.length]);

  const edges = useMemo(() => transitions.map(transition => {
    const active = isPlaying && transition.id === activeTransitionId;
    return {
      id: transition.id,
      source: transition.from_state_id,
      target: transition.to_state_id,
      type: 'transition',
      selected: transition.id === selectedTransitionId,
      markerEnd: { type: MarkerType.ArrowClosed, color: active ? '#34d399' : transition.id === selectedTransitionId ? '#E2D8B3' : '#7b8798' },
      data: { label: transitionConditionLabel(transition), active },
    };
  }), [activeTransitionId, isPlaying, selectedTransitionId, transitions]);

  const onNodesChange = useCallback(changes => setNodes(current => applyNodeChanges(changes, current)), []);

  const onNodeDragStop = useCallback((_event, _node, draggedNodes) => {
    const moved = new Map((draggedNodes || []).map(node => [node.id, node.position]));
    if (moved.size === 0) return;
    onUpdateLayer({
      ...layer,
      states: states.map(state => moved.has(state.id) ? { ...state, position: moved.get(state.id) } : state),
    });
  }, [layer, onUpdateLayer, states]);

  const addState = (type) => {
    if (!menu) return;
    const position = screenToFlowPosition({ x: menu.x, y: menu.y });
    const nextPacked = states
      .filter(state => RUNTIME_STATE_TYPES.has(state.type))
      .reduce((max, state) => Math.max(max, toNumber(state.packed_state_index, -1)), -1) + 1;
    const nextState = makeAuthoringState(type, position, nextPacked);
    onUpdateLayer({
      ...layer,
      states: [...states, nextState],
      default_state_id: layer.default_state_id || nextState.id,
    });
    onSelectState(nextState.id);
    onSelectTransition(null);
    setMenu(null);
  };

  return (
    <div className={`relative flex-1 bg-[#0D0F14] ${compact ? 'min-h-[360px]' : 'min-h-[560px]'}`} style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={readOnly ? undefined : onNodeDragStop}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        onConnect={connection => {
          if (readOnly || !connection.source || !connection.target || connection.source === connection.target) return;
          const exists = transitions.some(transition => transition.from_state_id === connection.source && transition.to_state_id === connection.target);
          if (exists) return;
          const nextTransition = makeAuthoringTransition(connection.source, connection.target);
          onUpdateLayer({ ...layer, transitions: [...transitions, nextTransition] });
          onSelectTransition(nextTransition.id);
          onSelectState(null);
        }}
        onNodeClick={(_event, node) => {
          onSelectState(node.id);
          onSelectTransition(null);
        }}
        onEdgeClick={(_event, edge) => {
          onSelectTransition(edge.id);
          onSelectState(null);
        }}
        onPaneClick={() => {
          onSelectState(null);
          onSelectTransition(null);
          setMenu(null);
        }}
        onPaneContextMenu={readOnly ? undefined : event => {
          event.preventDefault();
          setMenu({ x: event.clientX, y: event.clientY });
        }}
        onNodeContextMenu={readOnly ? undefined : (event, node) => {
          event.preventDefault();
          setMenu({ x: event.clientX, y: event.clientY, stateId: node.id });
        }}
        deleteKeyCode={readOnly ? null : ['Delete', 'Backspace']}
        onNodesDelete={deleted => deleted.forEach(node => deleteState(node.id))}
        onEdgesDelete={deleted => deleted.forEach(edge => deleteTransition(edge.id))}
        fitView
        fitViewOptions={compact ? { padding: 0.12, minZoom: 0.1, maxZoom: 0.8 } : { padding: 0.2, minZoom: 0.7, maxZoom: 1 }}
        minZoom={0.25}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        style={{ height: '100%', width: '100%' }}
      >
        <Background color="rgba(125, 138, 158, 0.34)" variant={BackgroundVariant.Dots} gap={22} size={1.2} />
        <Controls className="!border-[#424a55] !bg-[#15171C] [&>button]:!border-[#424a55] [&>button]:!bg-[#15171C] [&>button]:!text-gray-300" showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={node => STATE_COLORS[node.data?.state?.type] || STATE_COLORS.Normal} maskColor="rgba(13, 15, 20, 0.68)" className="!border !border-[#424a55] !bg-[#15171C]" />
      </ReactFlow>
      {menu && (
        <CanvasContextMenu
          menu={menu}
          onClose={() => setMenu(null)}
          onAddState={addState}
          onDeleteState={() => {
            deleteState(menu.stateId);
            setMenu(null);
          }}
        />
      )}
    </div>
  );
}

export function StateFlowCanvas(props) {
  return (
    <ReactFlowProvider>
      <StateFlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

function BlendTreeMotions({ state, parameters, clips, onUpdate }) {
  const tree = normalizeBlendTree(state.blend_tree);
  const updateTree = updates => onUpdate({ blend_tree: normalizeBlendTree({ ...tree, ...updates }) });
  const updateMotion = (motionId, updates) => {
    updateTree({ motions: tree.motions.map(motion => motion.id === motionId ? { ...motion, ...updates } : motion) });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <InspectorField label="Blend Type">
          <OptionSelect value={tree.blend_type} options={['1D', '2D']} onChange={blend_type => updateTree({ blend_type })} />
        </InspectorField>
        <InspectorField label="Parameter X">
          <OptionSelect value={tree.parameter} options={parameters.filter(parameter => parameter.type === 'Float').map(parameter => parameter.name)} onChange={parameter => updateTree({ parameter })} />
        </InspectorField>
      </div>
      {tree.blend_type === '2D' && (
        <InspectorField label="Parameter Y">
          <OptionSelect value={tree.parameter_y} options={parameters.filter(parameter => parameter.type === 'Float').map(parameter => parameter.name)} onChange={parameter_y => updateTree({ parameter_y })} />
        </InspectorField>
      )}
      <div className="flex items-center justify-between">
        <FieldLabel>Motions</FieldLabel>
        <Button
          size="sm"
          onClick={() => updateTree({ motions: [...tree.motions, { id: createId('motion'), clip_asset_id: '', threshold_x: tree.motions.length, threshold_y: 0, playback_speed: 1 }] })}
          className="h-7 bg-[#242a32]"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {tree.motions.map(motion => (
        <div key={motion.id} className="flex flex-col gap-2 border border-[#2A2E37] bg-[#0D0F14] p-2">
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <ReferenceSelect label="Clip" value={motion.clip_asset_id} options={clips} onChange={clip_asset_id => updateMotion(motion.id, { clip_asset_id })} />
            <button type="button" onClick={() => updateTree({ motions: tree.motions.filter(item => item.id !== motion.id) })} className="mt-5 text-red-400">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <InspectorField label="X">
              <NumberInput value={motion.threshold_x} onChange={threshold_x => updateMotion(motion.id, { threshold_x })} step={0.1} />
            </InspectorField>
            <InspectorField label="Y">
              <NumberInput value={motion.threshold_y} onChange={threshold_y => updateMotion(motion.id, { threshold_y })} step={0.1} />
            </InspectorField>
            <InspectorField label="Speed">
              <NumberInput value={motion.playback_speed} onChange={playback_speed => updateMotion(motion.id, { playback_speed })} step={0.1} />
            </InspectorField>
          </div>
        </div>
      ))}
    </div>
  );
}

function StateInspector({ state, layer, parameters, clips, controllers, onUpdateState, onDeleteState, onSetDefault }) {
  const clipOptions = clips || [];
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#2A2E37] pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#dce2e8]">
          <CircleDot className="h-4 w-4 text-[#E2D8B3]" />
          {state.type}
        </div>
        {!SPECIAL_STATE_TYPES.has(state.type) && (
          <Button size="sm" variant="ghost" onClick={() => onDeleteState(state.id)} className="h-7 text-red-400">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      <InspectorField label="Name">
        <TextInput value={state.name} onChange={name => onUpdateState({ name })} disabled={state.type === 'Entry' || state.type === 'Exit'} />
      </InspectorField>
      {state.type === 'AnyState' && (
        <InspectorField label="Excluded States">
          <div className="flex max-h-44 flex-col gap-1 overflow-y-auto border border-[#2A2E37] bg-[#0D0F14] p-2">
            {layer.states.filter(item => RUNTIME_STATE_TYPES.has(item.type)).map(item => {
              const excluded = state.excluded_state_ids?.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    const current = new Set(state.excluded_state_ids || []);
                    if (current.has(item.id)) current.delete(item.id);
                    else current.add(item.id);
                    onUpdateState({ excluded_state_ids: Array.from(current) });
                  }}
                  className={`flex items-center justify-between px-2 py-1 text-left text-xs ${excluded ? 'bg-[#242a32] text-[#E2D8B3]' : 'text-gray-400 hover:bg-[#15171C]'}`}
                >
                  <span>{item.name}</span>
                  {excluded && <span>off</span>}
                </button>
              );
            })}
          </div>
        </InspectorField>
      )}
      {RUNTIME_STATE_TYPES.has(state.type) && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <InspectorField label="Packed Index">
              <NumberInput value={state.packed_state_index} onChange={packed_state_index => onUpdateState({ packed_state_index })} />
            </InspectorField>
            <InspectorField label="Duration">
              <NumberInput value={state.duration_seconds} onChange={duration_seconds => onUpdateState({ duration_seconds })} step={0.1} min={0.01} />
            </InspectorField>
          </div>
          <InspectorField label="Playback Speed">
            <NumberInput value={state.playback_speed} onChange={playback_speed => onUpdateState({ playback_speed })} step={0.1} min={0.01} />
          </InspectorField>
          <ToggleRow label="Loop" checked={state.loop} onChange={loop => onUpdateState({ loop })} />
          <Button size="sm" onClick={() => onSetDefault(state.id)} className="h-8 bg-[#242a32]">
            <CircleDot className="h-3.5 w-3.5" />
            Set Default
          </Button>
        </>
      )}
      {state.type === 'Normal' && (
        <ReferenceSelect label="Animation Clip" value={state.animation_clip_asset_id} options={clipOptions} onChange={animation_clip_asset_id => onUpdateState({ animation_clip_asset_id })} />
      )}
      {state.type === 'BlendTree' && (
        <BlendTreeMotions state={state} parameters={parameters} clips={clipOptions} onUpdate={onUpdateState} />
      )}
      {state.type === 'SubStateMachine' && (
        <>
          <ReferenceSelect label="Controller" value={state.sub_controller_id} options={controllers} onChange={sub_controller_id => onUpdateState({ sub_controller_id })} />
          <InspectorField label="Parameter Mapping">
            <Textarea
              value={JSON.stringify(state.parameter_mapping || {}, null, 2)}
              onChange={event => {
                try {
                  onUpdateState({ parameter_mapping: JSON.parse(event.target.value || '{}') });
                } catch {
                  onUpdateState({ parameter_mapping_text: event.target.value });
                }
              }}
              className="min-h-24 border-[#2A2E37] bg-[#0D0F14] font-mono text-xs text-[#e5e5e5]"
            />
          </InspectorField>
        </>
      )}
      {!SPECIAL_STATE_TYPES.has(state.type) && (
        <InspectorField label="Comment">
          <Textarea
            value={state.comment || ''}
            onChange={event => onUpdateState({ comment: event.target.value })}
            className="min-h-20 border-[#2A2E37] bg-[#0D0F14] text-xs text-[#e5e5e5]"
          />
        </InspectorField>
      )}
    </div>
  );
}

function conditionModesFor(parameter) {
  if (!parameter) return [{ value: 'ExitTime', label: 'Exit Time' }];
  if (parameter.type === 'Trigger') return [{ value: 'Trigger', label: 'Trigger' }];
  if (parameter.type === 'Bool') return [{ value: 'If', label: 'True' }, { value: 'IfNot', label: 'False' }];
  return [{ value: 'Greater', label: '>=' }, { value: 'Less', label: '<=' }];
}

function TransitionInspector({ transition, layer, parameters, onUpdateTransition, onDeleteTransition }) {
  const stateOptions = layer.states.map(state => ({ value: state.id, label: state.name }));
  const condition = transition.conditions?.[0] || null;
  const selectedParameter = parameters.find(parameter => parameter.name === condition?.parameter);
  const parameterOptions = parameters.map(parameter => ({ value: parameter.name, label: `${parameter.name} (${parameter.type})` }));

  const updateCondition = updates => {
    const nextCondition = { ...(condition || CONDITIONLESS), ...updates };
    onUpdateTransition({ conditions: nextCondition.mode === 'None' ? [] : [nextCondition] });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#2A2E37] pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#dce2e8]">
          <GitBranch className="h-4 w-4 text-[#E2D8B3]" />
          Transition
        </div>
        <Button size="sm" variant="ghost" onClick={() => onDeleteTransition(transition.id)} className="h-7 text-red-400">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InspectorField label="From">
          <OptionSelect value={transition.from_state_id} options={stateOptions} onChange={from_state_id => onUpdateTransition({ from_state_id })} />
        </InspectorField>
        <InspectorField label="To">
          <OptionSelect value={transition.to_state_id} options={stateOptions} onChange={to_state_id => onUpdateTransition({ to_state_id })} />
        </InspectorField>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InspectorField label="Duration">
          <NumberInput value={transition.duration_seconds} onChange={duration_seconds => onUpdateTransition({ duration_seconds })} step={0.05} min={0} />
        </InspectorField>
        <InspectorField label="Mode">
          <OptionSelect value={transition.duration_mode} options={DURATION_MODES} onChange={duration_mode => onUpdateTransition({ duration_mode })} />
        </InspectorField>
      </div>
      <ToggleRow label="Has Exit Time" checked={transition.has_exit_time} onChange={has_exit_time => onUpdateTransition({ has_exit_time, exit_time: has_exit_time ? transition.exit_time || 0.75 : 0 })} />
      {transition.has_exit_time && (
        <InspectorField label="Exit Time">
          <div className="flex items-center gap-2">
            <Slider value={[transition.exit_time * 100]} min={0} max={100} step={1} onValueChange={([value]) => onUpdateTransition({ exit_time: value / 100 })} />
            <span className="w-10 text-right font-mono text-[11px] text-gray-400">{transition.exit_time.toFixed(2)}</span>
          </div>
        </InspectorField>
      )}
      <InspectorField label="Condition Parameter">
        <OptionSelect
          value={condition?.parameter || ''}
          placeholder="None"
          options={parameterOptions}
          onChange={parameter => {
            const nextParameter = parameters.find(item => item.name === parameter);
            updateCondition({
              parameter,
              mode: conditionModesFor(nextParameter)[0].value,
              threshold: 0,
            });
          }}
        />
      </InspectorField>
      {condition && condition.parameter !== 'none' && (
        <div className="grid grid-cols-2 gap-2">
          <InspectorField label="Condition">
            <OptionSelect value={condition.mode} options={conditionModesFor(selectedParameter)} onChange={mode => updateCondition({ mode })} />
          </InspectorField>
          {selectedParameter?.type !== 'Bool' && selectedParameter?.type !== 'Trigger' && (
            <InspectorField label="Threshold">
              <NumberInput value={condition.threshold} onChange={threshold => updateCondition({ threshold })} step={0.1} />
            </InspectorField>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <InspectorField label="Interrupt">
          <OptionSelect value={transition.interrupt_source} options={INTERRUPT_SOURCES} onChange={interrupt_source => onUpdateTransition({ interrupt_source })} />
        </InspectorField>
        <ToggleRow label="Ordered" checked={transition.ordered_interruption} onChange={ordered_interruption => onUpdateTransition({ ordered_interruption })} />
      </div>
      {condition?.mode === 'Trigger' && (
        <ToggleRow label="Consume Trigger" checked={transition.consume_trigger} onChange={consume_trigger => onUpdateTransition({ consume_trigger })} />
      )}
    </div>
  );
}

function LayerInspector({ layer, compiledStateCount, compiledTransitionCount, onUpdateLayer }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="border-b border-[#2A2E37] pb-3 text-sm font-bold text-[#dce2e8]">Layer</div>
      <InspectorField label="Name">
        <TextInput value={layer.name} onChange={name => onUpdateLayer({ ...layer, name })} />
      </InspectorField>
      <div className="grid grid-cols-2 gap-2">
        <div className="border border-[#2A2E37] bg-[#0D0F14] p-3">
          <div className="text-[10px] uppercase text-gray-500">Runtime States</div>
          <div className="mt-1 text-lg font-bold text-[#E2D8B3]">{compiledStateCount}</div>
        </div>
        <div className="border border-[#2A2E37] bg-[#0D0F14] p-3">
          <div className="text-[10px] uppercase text-gray-500">Transitions</div>
          <div className="mt-1 text-lg font-bold text-[#E2D8B3]">{compiledTransitionCount}</div>
        </div>
      </div>
    </div>
  );
}

export default function AnimatorControllerDetails({ draft, patch, refs = {} }) {
  const authoring = useMemo(() => normalizeController(draft), [draft]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [runtime, setRuntime] = useState({ activeStateId: '', activeTransitionId: '' });

  const layers = authoring.layers;
  const parameters = authoring.parameters;
  const currentLayer = layers[selectedLayerIndex] || layers[0];
  const compiled = useMemo(() => compileAuthoring(layers, parameters), [layers, parameters]);

  useEffect(() => {
    setSelectedLayerIndex(index => Math.max(0, Math.min(index, layers.length - 1)));
  }, [layers.length]);

  useEffect(() => {
    if (!currentLayer) return;
    if (selectedStateId && !currentLayer.states.some(state => state.id === selectedStateId)) setSelectedStateId(null);
    if (selectedTransitionId && !currentLayer.transitions.some(transition => transition.id === selectedTransitionId)) setSelectedTransitionId(null);
  }, [currentLayer, selectedStateId, selectedTransitionId]);

  const commit = useCallback((nextLayers, nextParameters = parameters) => {
    const normalizedLayers = nextLayers.map(normalizeLayer);
    const normalizedParameters = nextParameters.map(normalizeParameter);
    const nextCompiled = compileAuthoring(normalizedLayers, normalizedParameters);
    patch({
      authoring_layers: normalizedLayers,
      authoring_parameters: normalizedParameters,
      default_state_index: nextCompiled.default_state_index,
      states: nextCompiled.states,
      transitions: nextCompiled.transitions,
    });
  }, [parameters, patch]);

  const updateLayerAt = (index, nextLayer) => {
    commit(layers.map((layer, layerIndex) => layerIndex === index ? normalizeLayer(nextLayer, layerIndex) : layer));
  };

  const updateCurrentLayer = nextLayer => updateLayerAt(selectedLayerIndex, nextLayer);

  const updateState = (stateId, updates) => {
    updateCurrentLayer({
      ...currentLayer,
      states: currentLayer.states.map(state => state.id === stateId ? normalizeAuthoringState({ ...state, ...updates }, 0) : state),
    });
  };

  const updateTransition = (transitionId, updates) => {
    updateCurrentLayer({
      ...currentLayer,
      transitions: currentLayer.transitions.map(transition => transition.id === transitionId ? { ...transition, ...updates } : transition),
    });
  };

  const deleteState = (stateId) => {
    const state = currentLayer.states.find(item => item.id === stateId);
    if (!state || SPECIAL_STATE_TYPES.has(state.type)) return;
    updateCurrentLayer({
      ...currentLayer,
      states: currentLayer.states.filter(item => item.id !== stateId),
      transitions: currentLayer.transitions.filter(transition => transition.from_state_id !== stateId && transition.to_state_id !== stateId),
      default_state_id: currentLayer.default_state_id === stateId ? '' : currentLayer.default_state_id,
    });
    setSelectedStateId(null);
  };

  const deleteTransition = (transitionId) => {
    updateCurrentLayer({
      ...currentLayer,
      transitions: currentLayer.transitions.filter(transition => transition.id !== transitionId),
    });
    setSelectedTransitionId(null);
  };

  const selectedState = currentLayer?.states.find(state => state.id === selectedStateId);
  const selectedTransition = currentLayer?.transitions.find(transition => transition.id === selectedTransitionId);

  return (
    <div className="flex h-[calc(100vh-176px)] min-h-[720px] flex-col gap-3 overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[280px_minmax(560px,1fr)_360px]">
        <Panel title="Animator" icon={Layers}>
          <div className="shrink-0 border-b border-[#2A2E37] p-3">
            <FieldLabel>Controller ID</FieldLabel>
            <TextInput value={draft.controller_id} onChange={controller_id => patch({ controller_id })} />
          </div>
          <Tabs defaultValue="layers" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="h-10 justify-start rounded-none border-b border-[#2A2E37] bg-transparent px-2">
              <TabsTrigger value="layers" className="h-7 text-xs data-[state=active]:bg-[#242a32] data-[state=active]:text-[#dce2e8]">
                <Layers className="h-3.5 w-3.5" />
                Layers
              </TabsTrigger>
              <TabsTrigger value="parameters" className="h-7 text-xs data-[state=active]:bg-[#242a32] data-[state=active]:text-[#dce2e8]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Parameters
              </TabsTrigger>
            </TabsList>
            <TabsContent value="layers" className="m-0 min-h-0 flex-1">
              <LayerPanel
                layers={layers}
                selectedLayerIndex={selectedLayerIndex}
                onSelectLayer={(index) => {
                  setSelectedLayerIndex(index);
                  setSelectedStateId(null);
                  setSelectedTransitionId(null);
                }}
                onAddLayer={() => {
                  const nextLayer = makeLayer(layers.length);
                  commit([...layers, nextLayer]);
                  setSelectedLayerIndex(layers.length);
                }}
                onUpdateLayers={nextLayers => commit(nextLayers)}
              />
            </TabsContent>
            <TabsContent value="parameters" className="m-0 min-h-0 flex-1">
              <ParameterPanel
                parameters={parameters}
                onAddParameter={parameter => commit(layers, [...parameters, normalizeParameter(parameter, parameters.length)])}
                onUpdateParameters={nextParameters => commit(layers, nextParameters)}
              />
            </TabsContent>
          </Tabs>
        </Panel>

        <Panel
          title={currentLayer?.name || 'State Flow'}
          icon={GitBranch}
          right={(
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="h-6 rounded-sm px-2 text-[11px]">states {compiled.states.length}</Badge>
              <Badge variant="secondary" className="h-6 rounded-sm px-2 text-[11px]">transitions {compiled.transitions.length}</Badge>
              <Button
                size="sm"
                variant={isPlaying ? 'default' : 'outline'}
                onClick={() => setIsPlaying(value => !value)}
                className={`h-7 px-2 text-xs ${isPlaying ? 'bg-emerald-600' : 'border-[#424a55] bg-[#1E2128]'}`}
              >
                {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {isPlaying ? 'Stop' : 'Play'}
              </Button>
            </div>
          )}
        >
          {currentLayer && (
            <StateFlowCanvas
              layer={currentLayer}
              defaultStateId={currentLayer.default_state_id}
              selectedStateId={selectedStateId}
              selectedTransitionId={selectedTransitionId}
              onSelectState={setSelectedStateId}
              onSelectTransition={setSelectedTransitionId}
              onUpdateLayer={updateCurrentLayer}
              onOpenNested={(stateId) => {
                const state = currentLayer.states.find(item => item.id === stateId);
                if (state?.type === 'BlendTree' || state?.type === 'SubStateMachine') setSelectedStateId(stateId);
              }}
              isPlaying={isPlaying}
              activeStateId={runtime.activeStateId}
              activeTransitionId={runtime.activeTransitionId}
            />
          )}
        </Panel>

        <Panel title="Inspector" icon={FileStack}>
          <div className="shrink-0 border-b border-[#2A2E37] p-3">
            <AnimatorControllerPreview draft={draft} patch={patch} layer={currentLayer} parameters={parameters} playing={isPlaying} onRuntimeChange={setRuntime} />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {selectedState && (
              <StateInspector
                state={selectedState}
                layer={currentLayer}
                parameters={parameters}
                clips={refs.clips || []}
                controllers={refs.controllers || []}
                onUpdateState={updates => updateState(selectedState.id, updates)}
                onDeleteState={deleteState}
                onSetDefault={stateId => updateCurrentLayer({ ...currentLayer, default_state_id: stateId })}
              />
            )}
            {selectedTransition && !selectedState && (
              <TransitionInspector
                transition={selectedTransition}
                layer={currentLayer}
                parameters={parameters}
                onUpdateTransition={updates => updateTransition(selectedTransition.id, updates)}
                onDeleteTransition={deleteTransition}
              />
            )}
            {!selectedState && !selectedTransition && currentLayer && (
              <LayerInspector
                layer={currentLayer}
                compiledStateCount={compiled.states.length}
                compiledTransitionCount={compiled.transitions.length}
                onUpdateLayer={updateCurrentLayer}
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}