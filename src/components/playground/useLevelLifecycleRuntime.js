import { useCallback, useEffect, useRef, useState } from 'react';
import { createLevelBlueprintRuntime } from '@/lib/levelBlueprint/levelBlueprintRuntime';
import { LEVEL_EVENT } from '@/lib/levelBlueprint/levelLifecycle';

export default function useLevelLifecycleRuntime({ map, blueprints, actionGraphs }) {
  const runtimes = useRef([]);
  const instanceId = useRef('');
  const [status, setStatus] = useState('未加载');
  const [lastAction, setLastAction] = useState('');
  const [lastResults, setLastResults] = useState([]);
  const [revision, setRevision] = useState(0);
  const emit = useCallback((eventId, payload = {}) => {
    const context = Array.isArray(payload)
      ? payload
      : { levelInstanceId: instanceId.current, mapId: map?.map_id || null, at: Date.now(), ...payload };
    const results = runtimes.current.map(runtime => runtime.dispatch(eventId, context));
    setStatus(eventId);
    setLastResults(results);
    setRevision(value => value + 1);
    return results;
  }, [map?.map_id]);

  useEffect(() => {
    const selected = blueprints.filter(blueprint => (map?.trigger_types || []).includes(blueprint.trigger_type_name));
    instanceId.current = map?.map_id ? `${map.map_id}:${Date.now()}` : '';
    runtimes.current = selected.map(blueprint => createLevelBlueprintRuntime({
      blueprint,
      actionGraphs,
      onAction: action => setLastAction(action.action_id),
    }));
    emit(LEVEL_EVENT.Initializing);
    emit(LEVEL_EVENT.Ready);
    return () => {
      emit(LEVEL_EVENT.Unloading);
      emit(LEVEL_EVENT.Unloaded);
      runtimes.current = [];
      instanceId.current = '';
    };
  }, [map?.id, blueprints, actionGraphs, emit]);

  return {
    status,
    lastAction,
    blueprintCount: runtimes.current.length,
    lastLogs: lastResults.flatMap(result => result.logs || []),
    lastLog: lastResults.flatMap(result => result.logs || []).at(-1) || '',
    lastVariableWrites: lastResults.flatMap(result => result.variableWrites || []),
    controlPlaneOperations: lastResults.flatMap(result => result.controlPlaneOperations || []),
    panelOperations: lastResults.flatMap(result => result.panelOperations || []),
    collectionUpdates: lastResults.flatMap(result => result.collectionUpdates || []),
    revision,
    dispatch: emit,
    start: () => emit(LEVEL_EVENT.Started),
    pause: () => emit(LEVEL_EVENT.Paused),
    resume: () => emit(LEVEL_EVENT.Resumed),
    end: reason => { emit(LEVEL_EVENT.EndRequested, { reason }); return emit(LEVEL_EVENT.Ended, { reason }); },
  };
}