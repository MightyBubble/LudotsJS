import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createAbilityProvider } from '@/lib/runtime/abilityProvider';
import { createCommandPanelRuntime } from '@/lib/runtime/commandPanelRuntime';
import { resolveEntityPanel } from '@/lib/runtime/entityPanelRuntime';
import RuntimePanelView from '@/components/runtime/RuntimePanelView';
import RuntimeEntityPanelView from '@/components/runtime/RuntimeEntityPanelView';

const anchorStyle = anchor => ({
  [anchor?.horizontal || 'right']: Number(anchor?.offsetX) || 12,
  [anchor?.vertical || 'bottom']: Number(anchor?.offsetY) || 12,
  transform: `${anchor?.horizontal === 'center' ? 'translateX(-50%) ' : ''}${anchor?.vertical === 'center' ? 'translateY(-50%)' : ''}`.trim() || undefined,
});

export default function PlaygroundPanelHost({ lifecycle, commandProfiles, entityProfiles, controlProfiles, abilities, prototypes, log }) {
  const [panels, setPanels] = useState([]), [collections, setCollections] = useState({}), [focusedTabs, setFocusedTabs] = useState({}), [controls, setControls] = useState([]);
  const handledRevision = useRef(-1);
  useEffect(() => {
    if (handledRevision.current === lifecycle.revision) return;
    handledRevision.current = lifecycle.revision;
    lifecycle.collectionUpdates.forEach(update => setCollections(current => ({ ...current, [update.collectionKey]: Array.isArray(update.entities) ? update.entities : [] })));
    lifecycle.controlPlaneOperations.forEach(operation => setControls(current => operation.action === 'close' ? current.filter(item => item.instanceKey !== operation.instanceKey) : [...current.filter(item => item.instanceKey !== operation.instanceKey), operation]));
    lifecycle.panelOperations.forEach(operation => {
      if (operation.action === 'focus') setFocusedTabs(current => ({ ...current, [operation.tabGroup]: operation.tabId }));
      else setPanels(current => operation.action === 'close' ? current.filter(item => item.instanceKey !== operation.instanceKey) : [...current.filter(item => item.instanceKey !== operation.instanceKey), operation]);
    });
    lifecycle.panelOperations.forEach(operation => log.info('panel', `${operation.action} ${operation.instanceKey || operation.tabGroup}`, operation));
    lifecycle.collectionUpdates.forEach(update => log.info('collection', `${update.collectionKey} ← ${update.entities?.length || 0} entities`));
  }, [lifecycle.revision]);
  const abilityProvider = useMemo(() => createAbilityProvider(abilities), [abilities]);
  const enrich = list => (list || []).map(entity => { const prototypeId = entity.prototype_id || entity.template; const prototype = prototypes.find(item => item.prototype_id === prototypeId) || {}; return { ...prototype, ...entity, entity_id: entity.entity_id || entity.id || entity.instance_id, prototype_id: prototypeId, name: entity.name || prototype.name || prototypeId }; });
  const groups = [...panels.reduce((map, panel) => { const key = panel.tabGroup || panel.instanceKey; map.set(key, [...(map.get(key) || []), panel]); return map; }, new Map()).entries()];
  return <div className="pointer-events-none absolute inset-0 z-20" data-control-plane-count={controls.length}>
    {groups.map(([groupKey, items]) => {
      const activeId = focusedTabs[groupKey] || items[0]?.tabId;
      const active = items.find(item => item.tabId === activeId) || items[0];
      const profile = active.kind === 'command' ? commandProfiles.find(item => item.panel_id === active.profileId) : entityProfiles.find(item => item.panel_id === active.profileId);
      const entities = enrich(collections[profile?.source?.collection_key]);
      const result = active.kind === 'command' && profile ? createCommandPanelRuntime({ panelProfile: profile, abilityProvider, log }).setEntities(entities).resolve() : profile ? resolveEntityPanel(profile, entities) : null;
      return <div key={groupKey} data-testid={`panel-group-${groupKey}`} className="pointer-events-auto absolute w-80 rounded border border-[#424a55] bg-[#15171C]/95 shadow-xl" style={anchorStyle(active.anchor)}>
        <div className="flex border-b border-[#424a55]">{items.map(item => <button key={item.instanceKey} onClick={() => setFocusedTabs(current => ({ ...current, [groupKey]: item.tabId }))} className={`px-3 py-2 text-[11px] ${item.tabId === active.tabId ? 'bg-[#303845] text-gray-100' : 'text-gray-500'}`}>{item.kind === 'command' ? 'Commands' : 'Entities'}</button>)}</div>
        <div className="p-2">{!result ? <p className="text-[11px] text-red-300">Profile 不存在：{active.profileId}</p> : active.kind === 'command' ? <RuntimePanelView result={result} onActivate={button => log.info('intent', `激活 ${button.ability_id}`, button)} /> : <RuntimeEntityPanelView result={result} />}</div>
      </div>;
    })}
  </div>;
}