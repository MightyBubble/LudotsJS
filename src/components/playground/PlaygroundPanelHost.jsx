import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createAbilityProvider } from '@/lib/runtime/abilityProvider';
import { createCommandPanelRuntime } from '@/lib/runtime/commandPanelRuntime';
import { resolveEntityPanel } from '@/lib/runtime/entityPanelRuntime';
import RuntimeAnchoredPanel from '@/components/runtime/RuntimeAnchoredPanel';

export default function PlaygroundPanelHost({ lifecycle, commandProfiles, entityProfiles, controlProfiles, queryGraphs, abilities, prototypes, systemCollections = {}, log }) {
  const [panels, setPanels] = useState([]), [collections, setCollections] = useState({}), [controls, setControls] = useState([]);
  const handledRevision = useRef(-1);
  useEffect(() => {
    if (handledRevision.current === lifecycle.revision) return;
    handledRevision.current = lifecycle.revision;
    lifecycle.collectionUpdates.forEach(update => setCollections(current => ({ ...current, [update.collectionKey]: Array.isArray(update.entities) ? update.entities : [] })));
    lifecycle.controlPlaneOperations.forEach(operation => {
      setControls(current => operation.action === 'close' ? current.filter(item => item.instanceKey !== operation.instanceKey) : [...current.filter(item => item.instanceKey !== operation.instanceKey), operation]);
      const profile = controlProfiles.find(item => item.control_plane_id === operation.profileId);
      const contextEntities = Array.isArray(operation.context) ? operation.context : operation.context?.entities;
      if (operation.action === 'create' && profile?.output_collection_key && Array.isArray(contextEntities)) {
        setCollections(current => ({ ...current, [profile.output_collection_key]: contextEntities }));
      }
    });
    lifecycle.panelOperations.forEach(operation => setPanels(current => operation.action === 'close' ? current.filter(item => item.instanceKey !== operation.instanceKey) : [...current.filter(item => item.instanceKey !== operation.instanceKey), operation]));
    lifecycle.panelOperations.forEach(operation => log.info('panel', `${operation.action} ${operation.instanceKey || operation.tabGroup}`, operation));
    lifecycle.collectionUpdates.forEach(update => log.info('collection', `${update.collectionKey} ← ${update.entities?.length || 0} entities`));
  }, [lifecycle.revision]);
  const abilityProvider = useMemo(() => createAbilityProvider(abilities), [abilities]);
  const enrich = list => (list || []).map(entity => { const prototypeId = entity.prototype_id || entity.template; const prototype = prototypes.find(item => item.prototype_id === prototypeId) || {}; return { ...prototype, ...entity, entity_id: entity.entity_id || entity.id || entity.instance_id, prototype_id: prototypeId, name: entity.name || prototype.name || prototypeId }; });
  return <div className="pointer-events-none absolute inset-0 z-20" data-control-plane-count={controls.length}>
    {panels.map(panel => {
      const profile = panel.kind === 'command' ? commandProfiles.find(item => item.panel_id === panel.profileId) : entityProfiles.find(item => item.panel_id === panel.profileId);
      const collectionKey = profile?.source?.collection_key;
      const sourceEntities = Object.prototype.hasOwnProperty.call(systemCollections, collectionKey) ? systemCollections[collectionKey] : collections[collectionKey];
      const entities = enrich(sourceEntities);
      const queryGraph = panel.kind === 'entity' ? queryGraphs.find(item => item.query_name === profile?.filter?.entity_query_graph_ref) : null;
      const result = panel.kind === 'command' && profile ? createCommandPanelRuntime({ panelProfile: profile, abilityProvider, log }).setEntities(entities).resolve() : profile ? resolveEntityPanel(profile, entities, queryGraph) : null;
      return <RuntimeAnchoredPanel key={panel.instanceKey} panel={panel} profile={profile} result={result} log={log} />;
    })}
  </div>;
}