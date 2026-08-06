import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createAbilityProvider } from '@/lib/runtime/abilityProvider';
import { createCommandPanelRuntime } from '@/lib/runtime/commandPanelRuntime';
import { resolveEntityPanel } from '@/lib/runtime/entityPanelRuntime';
import { executeQueryGraph } from '@/lib/queryRuntime';
import { createUIItemPresenter } from '@/lib/runtime/uiItemPresentationRuntime';
import RuntimeAnchoredPanel from '@/components/runtime/RuntimeAnchoredPanel';
import RuntimeUtilityPanel from '@/components/runtime/RuntimeUtilityPanel';
import RuntimeScreenHost from '@/components/runtime/RuntimeScreenHost';

export default function PlaygroundPanelHost({ lifecycle, commandProfiles, entityProfiles, controlProfiles, screenProfiles = [], routeProfiles = [], queryGraphs, abilities, prototypes, uiItemProfiles = [], textTokens = [], systemCollections = {}, controlContext, log, selectedTemplateId, onSelectTemplate }) {
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
  const itemPresenter = useMemo(() => createUIItemPresenter(uiItemProfiles, textTokens), [uiItemProfiles, textTokens]);
  const abilityProvider = useMemo(() => createAbilityProvider(abilities, itemPresenter), [abilities, itemPresenter]);
  const controlCollections = useMemo(() => Object.fromEntries(controls.flatMap(operation => {
    const profile = controlProfiles.find(item => item.control_plane_id === operation.profileId);
    const query = queryGraphs.find(item => item.query_name === profile?.entity_query_graph_ref);
    if (!profile?.output_collection_key || !query) return [];
    const graph = JSON.parse(query.graph_definition);
    const context = Array.isArray(operation.context) ? controlContext : { ...controlContext, ...(operation.context || {}) };
    return [[profile.output_collection_key, executeQueryGraph(graph, systemCollections['Global.Units'] || [], context).output]];
  })), [controls, controlProfiles, queryGraphs, systemCollections, controlContext]);
  const enrich = list => (list || []).map(entity => { const prototypeId = entity.prototype_id || entity.template; const prototype = prototypes.find(item => item.prototype_id === prototypeId) || {}; return { ...prototype, ...entity, entity_id: entity.entity_id || entity.id || entity.instance_id, prototype_id: prototypeId, name: entity.name || prototype.name || prototypeId }; });
  const getCollectionEntities = key => Object.prototype.hasOwnProperty.call(systemCollections, key) ? systemCollections[key] : controlCollections[key] || collections[key];
  return <div className="pointer-events-none absolute inset-0 z-20" data-control-plane-count={controls.length}>
    {panels.map(panel => {
      if (panel.kind === 'console' || panel.kind === 'entity_palette') return <RuntimeUtilityPanel key={panel.instanceKey} panel={panel} templates={prototypes} selectedId={selectedTemplateId} onSelect={onSelectTemplate} log={log} />;
      if (panel.kind === 'screen') {
        const screenProfile = screenProfiles.find(item => item.screen_id === panel.screenProfileId);
        const routeProfile = routeProfiles.find(item => item.route_id === panel.routeProfileId);
        if (!screenProfile || !routeProfile) return <section key={panel.instanceKey} className="pointer-events-auto absolute bottom-3 left-3 rounded border border-red-500/60 bg-[#15171C]/95 p-2 text-[11px] text-red-300">UI Screen 配置缺失：{!screenProfile ? `screen ${panel.screenProfileId || '(空)'}` : `route ${panel.routeProfileId || '(空)'}`}</section>;
        const selection = enrich(getCollectionEntities(routeProfile.source?.collection_key || 'Global.Selection'));
        return <RuntimeScreenHost key={panel.instanceKey} instanceKey={panel.instanceKey} screenProfile={screenProfile} routeProfile={routeProfile} selection={selection}
          context={{ commandProfiles, entityProfiles, uiItemProfiles, queryGraphs, abilityProvider, itemPresenter, getEntities: key => enrich(getCollectionEntities(key)) }} log={log} />;
      }
      const profile = panel.kind === 'command' ? commandProfiles.find(item => item.panel_id === panel.profileId) : entityProfiles.find(item => item.panel_id === panel.profileId);
      const collectionKey = profile?.source?.collection_key;
      const entities = enrich(getCollectionEntities(collectionKey));
      const queryGraph = panel.kind === 'entity' ? queryGraphs.find(item => item.query_name === profile?.filter?.entity_query_graph_ref) : null;
      const result = panel.kind === 'command' && profile ? createCommandPanelRuntime({ panelProfile: profile, abilityProvider, log }).setEntities(entities).resolve() : profile ? resolveEntityPanel(profile, entities, queryGraph, itemPresenter) : null;
      return <RuntimeAnchoredPanel key={panel.instanceKey} panel={panel} profile={profile} result={result} log={log} />;
    })}
  </div>;
}