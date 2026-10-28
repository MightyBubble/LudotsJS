import { useCallback, useEffect, useMemo, useState } from 'react';
import '@xyflow/react/dist/style.css';
import { FileStack, GitBranch, Layers, Pause, Play, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnimatorControllerPreview from './AnimatorControllerPreview';
import {
  RUNTIME_STATE_TYPES,
  SPECIAL_STATE_TYPES,
  compileAuthoring,
  makeLayer,
  normalizeAuthoringState,
  normalizeController,
  normalizeLayer,
  normalizeParameter,
} from './animatorControllerModel';
import { FieldLabel, LayerPanel, Panel, ParameterPanel, TextInput } from './AnimatorControllerWidgets';
import { StateFlowCanvas } from './AnimatorStateFlowCanvas';
import { LayerInspector, StateInspector, TransitionInspector } from './AnimatorControllerInspectors';

export { StateFlowCanvas };

export default function AnimatorControllerDetails({ draft, patch, refs = {} }) {
  const authoring = useMemo(() => normalizeController(draft), [draft]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [runtimeState, setRuntimeState] = useState({ activeStateId: '', activeTransitionId: '' });

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
    let runtimeIndex = 0;
    const normalizedLayers = nextLayers.map(normalizeLayer).map(layer => ({
      ...layer,
      states: layer.states.map(state => RUNTIME_STATE_TYPES.has(state.type) ? { ...state, packed_state_index: runtimeIndex++ } : state),
    }));
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
            <div className="flex items-center gap-1.5">
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
              activeStateId={runtimeState.activeStateId}
              activeTransitionId={runtimeState.activeTransitionId}
            />
          )}
        </Panel>

        <Panel title="Inspector" icon={FileStack}>
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
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
            {currentLayer && (
              <AnimatorControllerPreview
                draft={draft}
                patch={patch}
                layer={currentLayer}
                parameters={parameters}
                playing={isPlaying}
                onRuntimeChange={setRuntimeState}
              />
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}