import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';
import PlaygroundToolbar from '@/components/playground/PlaygroundToolbar';
import PlaygroundViewport from '@/components/playground/PlaygroundViewport';
import useLevelLifecycleRuntime from '@/components/playground/useLevelLifecycleRuntime';
import SelectionInteractionOverlay from '@/components/playground/SelectionInteractionOverlay';
import PlaygroundPanelHost from '@/components/playground/PlaygroundPanelHost';
import { createRuntimeLog } from '@/lib/runtime/runtimeLog';
import { buildAliveUnitCollection } from '@/lib/runtime/aliveUnitCollection';
import { createEntityAppearanceResolver } from '@/lib/playground/entityAppearanceResolver';
import { loadRuntimeAppearanceCatalog } from '@/lib/playground/appearanceCatalog';

export default function PlaygroundPage() {
  const scope = useProjectScope();
  const [templates, setTemplates] = useState([]), [topologies, setTopologies] = useState([]), [maps, setMaps] = useState([]);
  const [blueprints, setBlueprints] = useState([]), [actionGraphs, setActionGraphs] = useState([]);
  const [commandProfiles, setCommandProfiles] = useState([]), [entityProfiles, setEntityProfiles] = useState([]), [controlProfiles, setControlProfiles] = useState([]);
  const [abilities, setAbilities] = useState([]), [queryGraphs, setQueryGraphs] = useState([]);
  const [uiItemProfiles, setUiItemProfiles] = useState([]), [textTokens, setTextTokens] = useState([]);
  const [performers, setPerformers] = useState([]), [hostBindings, setHostBindings] = useState([]), [assets, setAssets] = useState([]), [meshAssets, setMeshAssets] = useState([]);
  const [selectedId, setSelectedId] = useState(''), [topologyId, setTopologyId] = useState(''), [mapId, setMapId] = useState('');
  const [viewMode, setViewMode] = useState('Players'), [viewId, setViewId] = useState(0);
  const [paused, setPaused] = useState(true), [clearToken, setClearToken] = useState(0);
  const [placed, setPlaced] = useState([]), [elapsed, setElapsed] = useState(0), [selectionMode, setSelectionMode] = useState('screen_box');
  const viewportRef = useRef(null);
  const log = useMemo(() => createRuntimeLog(), []);

  useEffect(() => { Promise.all([
    base44.entities.EntityPrototype.list('name', 200), base44.entities.ParticipantTopology.list('-updated_date', 100),
    base44.entities.MapConfig.list('-updated_date', 100), base44.entities.LevelBlueprint.list('-updated_date', 100),
    base44.entities.ActionGraph.list('-updated_date', 200), base44.entities.CommandPanelProfile.list('panel_id', 100),
    base44.entities.EntityPanelProfile.list('panel_id', 100), base44.entities.ControlPlaneProfile.list('control_plane_id', 100),
    base44.entities.Ability.list('name', 300), base44.entities.EntityQuery.list('query_name', 200),
    base44.entities.UIItemPresentationProfile.list('profile_id', 200), base44.entities.PresentationTextToken.list('token_id', 500),
    loadRuntimeAppearanceCatalog(),
  ]).then(([p, t, m, b, a, commands, entities, controls, abilityRecords, queryRecords, itemProfiles, tokens, appearanceCatalog]) => {
    const scopedMaps = m.filter(scope.inScope);
    const scopedTopologies = t.filter(scope.inScope);
    const initialMap = scopedMaps[0] || null;
    const initialTopology = scopedTopologies.find(item => item.map_id === initialMap?.map_id) || null;
    setTemplates(p); setTopologies(scopedTopologies); setMaps(scopedMaps);
    setBlueprints(b.filter(scope.inScope)); setActionGraphs(a); setCommandProfiles(commands); setEntityProfiles(entities);
    setControlProfiles(controls); setAbilities(abilityRecords); setQueryGraphs(queryRecords); setUiItemProfiles(itemProfiles); setTextTokens(tokens);
    setPerformers(appearanceCatalog.performers); setHostBindings(appearanceCatalog.hostBindings); setAssets(appearanceCatalog.assets); setMeshAssets(appearanceCatalog.meshAssets); setMapId(initialMap?.id || '');
    setTopologyId(initialTopology?.id || ''); setViewMode('Players'); setViewId(initialTopology?.players?.[0]?.player_id || 0);
  }); }, [scope.projectId]);
  const map = maps.find((item) => item.id === mapId) || null;
  const aliveUnits = useMemo(() => buildAliveUnitCollection(map?.entities, placed), [map?.entities, placed]);
  const systemCollections = useMemo(() => ({ 'Global.Units': aliveUnits }), [aliveUnits]);
  const availableTopologies = useMemo(() => topologies.filter((item) => item.map_id === map?.map_id), [topologies, map?.map_id]);
  const topology = availableTopologies.find((item) => item.id === topologyId) || null;
  const template = templates.find((item) => item.id === selectedId) || null;
  const appearanceResolver = useMemo(() => createEntityAppearanceResolver({ prototypes: templates, performers, hostBindings, assets, meshAssets }), [templates, performers, hostBindings, assets, meshAssets]);
  const player = topology?.players.find((item) => item.player_id === viewId);
  const binding = viewMode === 'Players' ? { owner_player_id: player?.player_id || null, team_id: player?.team_id || null } : { owner_player_id: null, team_id: viewId || null };
  const view = topology && viewId ? { mode: viewMode, id: viewId } : null;
  const lifecycle = useLevelLifecycleRuntime({ map, blueprints, actionGraphs });
  useEffect(() => { if (map?.selection_interaction?.default_mode) setSelectionMode(map.selection_interaction.default_mode); }, [map?.id]);
  useEffect(() => { lifecycle.lastLogs.forEach(message => log.info('blueprint', message)); lifecycle.lastVariableWrites.forEach(key => log.info('variable', `写入 ${key}`)); }, [lifecycle.revision]);
  useEffect(() => {
    const onLevelEvent = (event) => lifecycle.dispatch(event.detail?.eventId, event.detail?.payload);
    window.addEventListener('ludots:level-event', onLevelEvent);
    return () => window.removeEventListener('ludots:level-event', onLevelEvent);
  }, [lifecycle.dispatch]);
  const togglePlayback = () => { if (paused) { if (lifecycle.status === 'Level.Ready' || lifecycle.status === 'Level.Ended') lifecycle.start(); else lifecycle.resume(); } else lifecycle.pause(); setPaused(value => !value); };
  const endLevel = () => { lifecycle.end('manual'); setPaused(true); };
  const chooseMap = (id) => { const next = maps.find((item) => item.id === id); const nextTopology = topologies.find((item) => item.map_id === next?.map_id); setMapId(id); setTopologyId(nextTopology?.id || ''); setViewMode('Players'); setViewId(nextTopology?.players[0]?.player_id || 0); setPlaced([]); setClearToken((token) => token + 1); };
  const participantView = useMemo(() => ({ topologies: availableTopologies, topologyId, onTopology: (id) => { const next = availableTopologies.find((item) => item.id === id); setTopologyId(id); setViewMode('Players'); setViewId(next?.players[0]?.player_id || 0); }, mode: viewMode, onMode: (mode) => { setViewMode(mode); setViewId(mode === 'Players' ? topology?.players[0]?.player_id || 0 : topology?.teams[0]?.team_id || 0); }, viewId, onView: setViewId }), [availableTopologies, topologyId, topology, viewMode, viewId]);
  const onPlace = useCallback((entity) => setPlaced((list) => [...list, entity]), []);
  const cancelPlacement = useCallback(() => setSelectedId(''), []);
  const clear = () => { setPlaced([]); setClearToken((token) => token + 1); };
  const onSelection = (eventId, entities) => log.info('selection', `${eventId} → ${entities.length} entities`, entities);

  return <div className="flex h-full min-h-0 bg-[#0D0F14] text-gray-200">
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      <PlaygroundToolbar maps={maps} mapId={mapId} onMap={chooseMap} mapEntityCount={map?.entities?.length || 0} paused={paused} onToggle={togglePlayback} onEnd={endLevel} onClear={clear} count={placed.length} elapsed={elapsed} templateName={template?.name || template?.prototype_id || ''} participantView={participantView} lifecycle={lifecycle} selectionConfig={map?.selection_interaction} selectionMode={selectionMode} onSelectionMode={setSelectionMode} />
      <div className="relative flex-1 min-h-0">
        <PlaygroundViewport ref={viewportRef} map={map} template={template} binding={binding} view={view} paused={paused} clearToken={clearToken} onPlace={onPlace} onTick={setElapsed} onCancelPlacement={cancelPlacement} appearanceResolver={appearanceResolver} />
        <SelectionInteractionOverlay config={template ? null : map?.selection_interaction} mode={selectionMode} viewportRef={viewportRef} onSelection={onSelection} />
        <PlaygroundPanelHost lifecycle={lifecycle} commandProfiles={commandProfiles} entityProfiles={entityProfiles} controlProfiles={controlProfiles} queryGraphs={queryGraphs} abilities={abilities} prototypes={templates} uiItemProfiles={uiItemProfiles} textTokens={textTokens} systemCollections={systemCollections} controlContext={{ mode: viewMode, viewId }} log={log} selectedTemplateId={selectedId} onSelectTemplate={setSelectedId} />
      </div>
    </div>
  </div>;
}