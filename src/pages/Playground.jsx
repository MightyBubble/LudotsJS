import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';
import EntityTemplateList from '@/components/playground/EntityTemplateList';
import PlaygroundToolbar from '@/components/playground/PlaygroundToolbar';
import PlaygroundViewport from '@/components/playground/PlaygroundViewport';
import useLevelLifecycleRuntime from '@/components/playground/useLevelLifecycleRuntime';

export default function PlaygroundPage() {
  const scope = useProjectScope();
  const [templates, setTemplates] = useState([]), [topologies, setTopologies] = useState([]), [maps, setMaps] = useState([]);
  const [blueprints, setBlueprints] = useState([]), [actionGraphs, setActionGraphs] = useState([]);
  const [selectedId, setSelectedId] = useState(''), [topologyId, setTopologyId] = useState(''), [mapId, setMapId] = useState('');
  const [viewMode, setViewMode] = useState('Players'), [viewId, setViewId] = useState(0);
  const [paused, setPaused] = useState(true), [clearToken, setClearToken] = useState(0);
  const [placed, setPlaced] = useState([]), [elapsed, setElapsed] = useState(0);

  useEffect(() => { Promise.all([base44.entities.EntityPrototype.list('name', 200), base44.entities.ParticipantTopology.list('-updated_date', 100), base44.entities.MapConfig.list('-updated_date', 100), base44.entities.LevelBlueprint.list('-updated_date', 100), base44.entities.ActionGraph.list('-updated_date', 200)]).then(([p, t, m, b, a]) => { const scopedMaps = m.filter(scope.inScope); setTemplates(p); setTopologies(t.filter(scope.inScope)); setMaps(scopedMaps); setBlueprints(b.filter(scope.inScope)); setActionGraphs(a); setMapId(scopedMaps[0]?.id || ''); }); }, [scope.projectId]);
  const map = maps.find((item) => item.id === mapId) || null;
  const availableTopologies = useMemo(() => topologies.filter((item) => item.map_id === map?.map_id), [topologies, map?.map_id]);
  const topology = availableTopologies.find((item) => item.id === topologyId) || null;
  const template = templates.find((item) => item.id === selectedId) || null;
  const player = topology?.players.find((item) => item.player_id === viewId);
  const binding = viewMode === 'Players' ? { owner_player_id: player?.player_id || null, team_id: player?.team_id || null } : { owner_player_id: null, team_id: viewId || null };
  const view = topology && viewId ? { mode: viewMode, id: viewId } : null;
  const lifecycle = useLevelLifecycleRuntime({ map, blueprints, actionGraphs });
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
  const clear = () => { setPlaced([]); setClearToken((token) => token + 1); };

  return <div className="flex h-full min-h-0 bg-[#0D0F14] text-gray-200">
    <EntityTemplateList templates={templates} selectedId={selectedId} onSelect={setSelectedId} />
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      <PlaygroundToolbar maps={maps} mapId={mapId} onMap={chooseMap} mapEntityCount={map?.entities?.length || 0} paused={paused} onToggle={togglePlayback} onEnd={endLevel} onClear={clear} count={placed.length} elapsed={elapsed} templateName={template?.name || template?.prototype_id || ''} participantView={participantView} lifecycle={lifecycle} />
      <PlaygroundViewport map={map} template={template} binding={binding} view={view} paused={paused} clearToken={clearToken} onPlace={onPlace} onTick={setElapsed} />
    </div>
  </div>;
}