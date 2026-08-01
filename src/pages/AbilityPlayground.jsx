import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AbilityPlaygroundScene from '@/components/playground/AbilityPlaygroundScene';
import RuntimeDockToolbar from '@/components/playground/RuntimeDockToolbar';
import RuntimeAssetsDock from '@/components/playground/RuntimeAssetsDock';
import RuntimeInspectorDock from '@/components/playground/RuntimeInspectorDock';
import RuntimeCommandPanelDock from '@/components/playground/RuntimeCommandPanelDock';
import RuntimeTraceDock from '@/components/playground/RuntimeTraceDock';
import RuntimeConsoleDock from '@/components/playground/RuntimeConsoleDock';
import { buildCommandPanelProfile, createCommandPanel } from '@/lib/runtime/commandPanelRuntime';

const initialDocks = { assets: true, inspector: true, commandPanel: true, trace: true, console: true };
const runtimeParamsPanel = { ...buildCommandPanelProfile({ panel_id: 'Runtime.DynamicParameters', label: 'Runtime · 动态参数面板', columns: 4, visible_rows: 2 }), id: '__runtime__' };

export default function AbilityPlaygroundPage() {
  const [abilities, setAbilities] = useState([]), [prototypes, setPrototypes] = useState([]), [panels, setPanels] = useState([]);
  const [abilityId, setAbilityId] = useState(''), [prototypeId, setPrototypeId] = useState(''), [panelId, setPanelId] = useState('');
  const [events, setEvents] = useState([]), [runtimeCount, setRuntimeCount] = useState(0), [docks, setDocks] = useState(initialDocks);
  const sceneRef = useRef(null);

  useEffect(() => { Promise.all([
    base44.entities.Ability.list('ability_id'), base44.entities.EntityPrototype.list('name'), base44.entities.CommandPanelProfile.list('panel_id'),
  ]).then(([abilityRows, prototypeRows, panelRows]) => {
    setAbilities(abilityRows); setPrototypes(prototypeRows); setPanels(panelRows);
    setAbilityId(abilityRows.find(a => a.ability_id === 'Sample.Command.Move')?.id || abilityRows[0]?.id || '');
    setPrototypeId(prototypeRows.find(p => p.prototype_id === 'Sample.Prototype.War3Unit')?.id || prototypeRows[0]?.id || '');
    setPanelId(panelRows.find(p => p.panel_id === 'Sample.Panel.War3.CommandCard')?.id || panelRows[0]?.id || '__runtime__');
  }); }, []);

  const onEvent = useCallback(message => setEvents(current => [{ time: new Date().toLocaleTimeString(), message }, ...current].slice(0, 60)), []);
  const onSpawn = useCallback(() => setRuntimeCount(count => count + 1), []);
  const prototype = prototypes.find(item => item.id === prototypeId);
  const ability = abilities.find(item => item.id === abilityId);
  const allPanels = useMemo(() => [...panels, runtimeParamsPanel], [panels]);
  const panel = allPanels.find(item => item.id === panelId) || runtimeParamsPanel;
  const result = useMemo(() => createCommandPanel({ profile: panel.id === '__runtime__' ? null : panel, params: panel.id === '__runtime__' ? { label: panel.label, columns: 4, visible_rows: 2 } : null, actors: prototype ? [prototype] : [], abilities }), [panel, prototype, abilities]);
  const toggle = key => setDocks(current => ({ ...current, [key]: !current[key] }));
  const selectPanelAbility = selected => { const record = abilities.find(item => item.ability_id === selected.ability_id); if (record) setAbilityId(record.id); onEvent(`Panel resolved: ${selected.ability_id}`); };
  const reset = () => { sceneRef.current?.reset(); setEvents([]); };
  const clearPlaced = () => { sceneRef.current?.clearPlaced(); setRuntimeCount(0); };

  return <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
    <RuntimeDockToolbar prototypes={prototypes} panels={allPanels} abilities={abilities} prototypeId={prototypeId} panelId={panelId} abilityId={abilityId}
      onPrototype={setPrototypeId} onPanel={setPanelId} onAbility={setAbilityId} onCast={() => sceneRef.current?.cast()} onReset={reset}
      onPlace={() => sceneRef.current?.beginPlacement(prototype)} onCancel={() => sceneRef.current?.cancelPlacement()} onClear={clearPlaced} runtimeCount={runtimeCount}
      docks={docks} toggle={toggle} />
    <div className="flex min-h-0 flex-1 gap-1 p-1">
      {docks.assets && <RuntimeAssetsDock prototypes={prototypes} abilities={abilities} panels={allPanels} prototypeId={prototypeId} abilityId={abilityId} panelId={panelId} onPrototype={setPrototypeId} onAbility={setAbilityId} onPanel={setPanelId} onClose={() => toggle('assets')} />}
      <main className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-h-0 flex-1 gap-1">
          <AbilityPlaygroundScene ref={sceneRef} ability={ability} onEvent={onEvent} onSpawn={onSpawn} />
          {docks.trace && <RuntimeTraceDock trace={result.trace} onClose={() => toggle('trace')} />}
        </div>
        {docks.commandPanel && <RuntimeCommandPanelDock result={result} onAbility={selectPanelAbility} onClose={() => toggle('commandPanel')} />}
      </main>
      {docks.inspector && <RuntimeInspectorDock prototype={prototype} panel={panel} result={result} onClose={() => toggle('inspector')} />}
    </div>
    {docks.console && <RuntimeConsoleDock events={events} onClose={() => toggle('console')} />}
  </div>;
}