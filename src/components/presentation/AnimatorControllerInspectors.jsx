import { CircleDot, GitBranch, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import ReferenceSelect from './ReferenceSelect';
import {
  CONDITIONLESS,
  DURATION_MODES,
  INTERRUPT_SOURCES,
  RUNTIME_STATE_TYPES,
  SPECIAL_STATE_TYPES,
  createId,
  normalizeBlendTree,
} from './animatorControllerModel';
import { FieldLabel, InspectorField, NumberInput, OptionSelect, TextInput, ToggleRow } from './AnimatorControllerWidgets';

export function BlendTreeMotions({ state, parameters, clips, onUpdate }) {
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

export function StateInspector({ state, layer, parameters, clips, controllers, onUpdateState, onDeleteState, onSetDefault }) {
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
            <InspectorField label="State Index">
              <div className="flex h-8 items-center border border-[#2A2E37] bg-[#0D0F14] px-2 font-mono text-xs text-gray-400">{state.packed_state_index}</div>
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

export function TransitionInspector({ transition, layer, parameters, onUpdateTransition, onDeleteTransition }) {
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

export function LayerInspector({ layer, compiledStateCount, compiledTransitionCount, onUpdateLayer }) {
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