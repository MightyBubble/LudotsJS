import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import useProjectScope from '@/lib/projectScope';
import EntityTemplateList from '@/components/playground/EntityTemplateList';
import PlaygroundToolbar from '@/components/playground/PlaygroundToolbar';
import PlaygroundViewport from '@/components/playground/PlaygroundViewport';

export default function AbilityPlaygroundPage() {
  const scope = useProjectScope();
  const [templates, setTemplates] = useState([]), [topologies, setTopologies] = useState([]);
  const [selectedId, setSelectedId] = useState(''), [topologyId, setTopologyId] = useState('');
  const [viewMode, setViewMode] = useState('Players'), [viewId, setViewId] = useState(0);
  const [paused, setPaused] = useState(false), [clearToken, setClearToken] = useState(0);
  const [placed, setPlaced] = useState([]), [elapsed, setElapsed] = useState(0);

  useEffect(() => { Promise.all([base44.entities.EntityPrototype.list('name', 200), base44.entities.ParticipantTopology.list('-updated_date', 100)]).then(([p, t]) => { setTemplates(p); const scoped = t.filter(scope.inScope); setTopologies(scoped); if (scoped[0]) { setTopologyId(scoped[0].id); setViewId(scoped[0].players[0]?.player_id || 0); } }); }, [scope.projectId]);
  const topology = topologies.find((t) => t.id === topologyId) || null;
  const template = templates.find((t) => t.id === selectedId) || null;
  const player = topology?.players.find((p) => p.player_id === viewId);
  const binding = viewMode === 'Players' ? { owner_player_id: player?.player_id || null, team_id: player?.team_id || null } : { owner_player_id: null, team_id: viewId || null };
  const view = topology && viewId ? { mode: viewMode, id: viewId } : null;
  const participantView = useMemo(() => ({ topologies, topologyId, onTopology: (id) => { const t = topologies.find((x) => x.id === id); setTopologyId(id); setViewMode('Players'); setViewId(t?.players[0]?.player_id || 0); }, mode: viewMode, onMode: (mode) => { setViewMode(mode); setViewId(mode === 'Players' ? topology?.players[0]?.player_id || 0 : topology?.teams[0]?.team_id || 0); }, viewId, onView: setViewId }), [topologies, topologyId, topology, viewMode, viewId]);
  const onPlace = useCallback((entity) => setPlaced((list) => [...list, entity]), []);
  const clear = () => { setPlaced([]); setClearToken((t) => t + 1); };

  return <div className="flex h-full min-h-0 bg-[#0D0F14] text-gray-200">
    <EntityTemplateList templates={templates} selectedId={selectedId} onSelect={setSelectedId} />
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      <PlaygroundToolbar paused={paused} onToggle={() => setPaused((p) => !p)} onClear={clear} count={placed.length} elapsed={elapsed} templateName={template?.name || template?.prototype_id || ''} participantView={participantView} />
      <PlaygroundViewport template={template} binding={binding} view={view} paused={paused} clearToken={clearToken} onPlace={onPlace} onTick={setElapsed} />
    </div>
  </div>;
}