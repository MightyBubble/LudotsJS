export function normalizePanelProfile(record = {}) {
  return {
    ...record,
    source: record.source || { collection_key: record.actor_collection_key || '' },
    filter: record.filter || {
      required_all_tags: record.required_all_tags || [],
      blocked_any_tags: record.blocked_any_tags || [],
    },
    grouping: record.grouping || { rules: record.aggregate_rules || [] },
    layout: record.layout || {
      mode: record.layout_mode || 'dynamic',
      grid: { columns: record.columns, visible_rows: record.visible_rows },
      fixed: { slots: record.slots || [] },
      dynamic: {
        buckets: (record.sort_tag_priority || []).map(tag => ({ required_all_tags: [tag], blocked_any_tags: [] })),
        hotkey_action_ids: record.hotkey_action_ids || [],
      },
    },
  };
}

export function preparePanelProfileSave(record) {
  const panel = normalizePanelProfile(record);
  const slots = (panel.layout.fixed?.slots || []).map(slot => ({
    slot_id: slot.slot_id || '', role_id: slot.role_id || '', action_id: slot.action_id || '',
  }));
  return {
    panel_id: panel.panel_id,
    label: panel.label || '',
    description: panel.description || '',
    source: panel.source,
    filter: panel.filter,
    grouping: panel.grouping,
    layout: { ...panel.layout, fixed: { slots } },
  };
}