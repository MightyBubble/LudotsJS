import React, { useCallback, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import AbilityPlaygroundScene from '@/components/playground/AbilityPlaygroundScene';
import PlaygroundControls from '@/components/playground/PlaygroundControls';
import PrototypePlacementControls from '@/components/playground/PrototypePlacementControls';

export default function AbilityPlaygroundPage() {
  const [abilities, setAbilities] = useState([]), [selectedId, setSelectedId] = useState(''), [events, setEvents] = useState([]);
  const [prototypes, setPrototypes] = useState([]), [prototypeId, setPrototypeId] = useState(''), [runtimeCount, setRuntimeCount] = useState(0);
  const sceneRef = useRef(null);
  useEffect(() => { Promise.all([base44.entities.Ability.list('-updated_date', 100), base44.entities.EntityPrototype.list('name', 100)]).then(([abilityRows, prototypeRows]) => { setAbilities(abilityRows); setSelectedId(abilityRows[0]?.id || ''); setPrototypes(prototypeRows); setPrototypeId(prototypeRows[0]?.id || ''); }); }, []);
  const onEvent = useCallback(message => setEvents(current => [{ time: new Date().toLocaleTimeString(), message }, ...current].slice(0, 30)), []);
  const onSpawn = useCallback(() => setRuntimeCount(count => count + 1), []);
  const ability = abilities.find(a => a.id === selectedId), prototype = prototypes.find(p => p.id === prototypeId);
  const clearPlaced = () => { sceneRef.current?.clearPlaced(); setRuntimeCount(0); };
  return <div className="flex h-full flex-col bg-[#0D0F14] text-white">
    <PlaygroundControls abilities={abilities} selectedId={selectedId} onSelect={setSelectedId} onCast={() => sceneRef.current?.cast()} onReset={() => { sceneRef.current?.reset(); setEvents([]); }} />
    <PrototypePlacementControls prototypes={prototypes} selectedId={prototypeId} onSelect={setPrototypeId} onBegin={() => sceneRef.current?.beginPlacement(prototype)} onCancel={() => sceneRef.current?.cancelPlacement()} onClear={clearPlaced} count={runtimeCount} />
    <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1fr_300px]">
      <AbilityPlaygroundScene ref={sceneRef} ability={ability} onEvent={onEvent} onSpawn={onSpawn} />
      <aside className="overflow-auto rounded border border-[#2A2E37] bg-[#15171C] p-3"><h2 className="mb-3 text-xs font-semibold text-[#E2D8B3]">运行事件</h2>{events.length ? events.map((e,i) => <div key={i} className="border-b border-[#2A2E37] py-2 text-[11px]"><span className="mr-2 text-gray-600">{e.time}</span>{e.message}</div>) : <p className="text-xs text-gray-600">移动并施放 Ability 开始测试。</p>}</aside>
    </div>
  </div>;
}