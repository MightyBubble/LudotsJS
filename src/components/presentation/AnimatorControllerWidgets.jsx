import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PARAMETER_TYPES, RUNTIME_STATE_TYPES, createId, normalizeParameter } from './animatorControllerModel';

export function FieldLabel({ children }) {
  return <label className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{children}</label>;
}

export function Panel({ title, icon: Icon, right, children }) {
  return (
    <div className="flex h-full min-h-0 flex-col border border-[#2A2E37] bg-[#15171C]">
      <div className="flex h-10 items-center justify-between border-b border-[#2A2E37] px-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs font-semibold text-[#E2D8B3]">
          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{title}</span>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, disabled = false }) {
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

export function NumberInput({ value, onChange, min, max, step = 1 }) {
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

export function OptionSelect({ value, options, onChange, placeholder = 'Unset', disabled = false }) {
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

export function InspectorField({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

export function ToggleRow({ label, checked, onChange }) {
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

export function LayerPanel({ layers, selectedLayerIndex, onSelectLayer, onAddLayer, onUpdateLayers }) {
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

export function ParameterPanel({ parameters, onAddParameter, onUpdateParameters }) {
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