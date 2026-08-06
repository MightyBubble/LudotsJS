import { getItemTags } from './uiItemPresentationRuntime';

/**
 * 面板种类注册表：通用 UI 面板库的唯一挂靠点。
 * 新增预设面板（小地图、生产队列、事件任务等）先在此登记，
 * 编辑器下拉与 Screen 宿主渲染均从这里取值，不得各自维护清单。
 */
export const UI_PANEL_KINDS = [
  { value: 'command', label: '命令/技能面板', profileSource: 'commandPanels' },
  { value: 'entity', label: '实体群组面板', profileSource: 'entityPanels' },
  { value: 'selection_info', label: '选中信息面板', profileSource: 'uiItemProfiles' },
];

export const DEFAULT_UI_SKIN = {
  panel_background: '#15171CF2',
  panel_border: '#424a55',
  header_text_color: '#E5E7EB',
  accent_color: '#7DD3FC',
  corner_radius: 4,
};

export function normalizeUiScreenProfile(profile = {}) {
  return {
    ...profile,
    skin: { ...DEFAULT_UI_SKIN, ...(profile.skin || {}) },
    slots: (profile.slots || []).map(slot => ({
      label: '',
      width: 320,
      ...slot,
      anchor: { horizontal: 'center', vertical: 'bottom', offset_x: 0, offset_y: 0, ...(slot.anchor || {}) },
    })),
  };
}

export function normalizeUiSelectionRouteProfile(profile = {}) {
  return {
    ...profile,
    source: { collection_key: 'Global.Selection', ...(profile.source || {}) },
    rules: (profile.rules || []).map(rule => ({
      label: '',
      ...rule,
      match: { selection: 'any', required_all_tags: [], blocked_any_tags: [], prototype_ids: [], ...(rule.match || {}) },
      panels: rule.panels || [],
    })),
  };
}

const countMatches = (selectionMode, count) => {
  if (selectionMode === 'any') return true;
  if (selectionMode === 'none') return count === 0;
  if (selectionMode === 'single') return count === 1;
  return count >= 2;
};

/** 选中上下文路由：按规则顺序首条命中；未命中不做兜底，槽位显式留空并留痕 */
export function resolveSelectionRoute(routeProfile, selection = []) {
  const route = normalizeUiSelectionRouteProfile(routeProfile || {});
  const count = selection.length;
  const trace = [`选中 ${count} 个实体`];
  for (const rule of route.rules) {
    const { selection: selectionMode, required_all_tags, blocked_any_tags, prototype_ids } = rule.match;
    if (!countMatches(selectionMode, count)) continue;
    const hasEntityConditions = required_all_tags.length || blocked_any_tags.length || prototype_ids.length;
    if (hasEntityConditions && count === 0) continue;
    const tagsOk = selection.every(entity => {
      const tags = getItemTags(entity);
      return required_all_tags.every(tag => tags.includes(tag)) && !blocked_any_tags.some(tag => tags.includes(tag));
    });
    if (!tagsOk) continue;
    if (prototype_ids.length && !selection.every(entity => prototype_ids.includes(entity.prototype_id))) continue;
    trace.push(`命中规则 ${rule.rule_id}${rule.label ? ` · ${rule.label}` : ''}`);
    return { rule, panels: rule.panels, trace };
  }
  trace.push('无路由规则命中：所有槽位留空');
  return { rule: null, panels: [], trace };
}
