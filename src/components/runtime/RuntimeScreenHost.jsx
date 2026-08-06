import { useEffect } from 'react';
import { positionStyle } from '@/components/runtime/RuntimeAnchoredPanel';
import RuntimePanelView from '@/components/runtime/RuntimePanelView';
import RuntimeEntityPanelView from '@/components/runtime/RuntimeEntityPanelView';
import RuntimeSelectionInfoPanel from '@/components/runtime/RuntimeSelectionInfoPanel';
import { createCommandPanelRuntime } from '@/lib/runtime/commandPanelRuntime';
import { resolveEntityPanel } from '@/lib/runtime/entityPanelRuntime';
import { normalizeUiScreenProfile, resolveSelectionRoute } from '@/lib/runtime/uiScreenRuntime';

const missing = message => ({ title: '配置缺失', body: <p className="p-2 text-[11px] text-red-300">{message}</p> });

/** UI Screen 宿主：Screen Profile 定槽位与皮肤，选中路由定各槽位挂什么面板。 */
export default function RuntimeScreenHost({ instanceKey, screenProfile, routeProfile, selection = [], context, log }) {
  const screen = normalizeUiScreenProfile(screenProfile || {});
  const { rule, panels, trace } = resolveSelectionRoute(routeProfile, selection);
  const { commandProfiles, entityProfiles, uiItemProfiles, queryGraphs, abilityProvider, itemPresenter, getEntities } = context;

  useEffect(() => {
    log?.info('screen', `${instanceKey} 路由：${trace.join(' → ')}`, { rule_id: rule?.rule_id || null, slots: panels.map(panel => panel.slot_id) });
  }, [instanceKey, rule?.rule_id, selection.length]);

  const renderBinding = binding => {
    if (binding.panel_kind === 'command') {
      const profile = commandProfiles.find(item => item.panel_id === binding.profile_ref);
      if (!profile) return missing(`Command Panel Profile 不存在：${binding.profile_ref}`);
      const result = createCommandPanelRuntime({ panelProfile: profile, abilityProvider, log })
        .setEntities(getEntities(profile.source?.collection_key)).resolve();
      return {
        title: profile.label || profile.panel_id,
        body: <RuntimePanelView result={result} onActivate={button => log?.info('intent', `激活 ${button.ability_id}`, button)} />,
      };
    }
    if (binding.panel_kind === 'entity') {
      const profile = entityProfiles.find(item => item.panel_id === binding.profile_ref);
      if (!profile) return missing(`Entity Panel Profile 不存在：${binding.profile_ref}`);
      const queryGraph = queryGraphs.find(item => item.query_name === profile.filter?.entity_query_graph_ref) || null;
      const result = resolveEntityPanel(profile, getEntities(profile.source?.collection_key), queryGraph, itemPresenter);
      return { title: profile.label || profile.panel_id, body: <RuntimeEntityPanelView result={result} /> };
    }
    if (binding.panel_kind === 'selection_info') {
      const profile = uiItemProfiles.find(item => item.profile_id === binding.profile_ref);
      if (!profile) return missing(`UI Item Presenter 不存在：${binding.profile_ref}`);
      const entity = selection[0] || null;
      const display = entity ? itemPresenter.resolve(entity, 'entity', binding.profile_ref) : null;
      return { title: profile.label || profile.profile_id, body: <RuntimeSelectionInfoPanel entity={entity} display={display} /> };
    }
    return missing(`未注册的面板种类：${binding.panel_kind}`);
  };

  return <>
    {screen.slots.map(slot => {
      const binding = panels.find(panel => panel.slot_id === slot.slot_id);
      if (!binding) return null;
      const rendered = renderBinding(binding);
      const anchor = { horizontal: slot.anchor.horizontal, vertical: slot.anchor.vertical, offsetX: slot.anchor.offset_x, offsetY: slot.anchor.offset_y };
      return <section key={`${instanceKey}:${slot.slot_id}`} data-testid={`runtime-screen-slot-${slot.slot_id}`}
        className="pointer-events-auto absolute border shadow-xl"
        style={{ ...positionStyle(anchor), width: slot.width, background: screen.skin.panel_background, borderColor: screen.skin.panel_border, borderRadius: screen.skin.corner_radius }}>
        <header className="border-b px-3 py-2 text-[11px] font-semibold" style={{ borderColor: screen.skin.panel_border, color: screen.skin.header_text_color }}>
          {rendered.title}
          {slot.label && <span className="ml-2 font-normal opacity-60">{slot.label}</span>}
        </header>
        <div>{rendered.body}</div>
      </section>;
    })}
  </>;
}
