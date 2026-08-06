import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Section, SelectField, TextField, ListField } from '@/components/ludots/ui';
import GameplayTagListSelect from '@/components/ludots/GameplayTagListSelect';
import { normalizeUiSelectionRouteProfile, UI_PANEL_KINDS } from '@/lib/runtime/uiScreenRuntime';

const SELECTION_OPTIONS = [
  { value: 'none', label: '无选中' },
  { value: 'single', label: '单选' },
  { value: 'multiple', label: '多选(≥2)' },
  { value: 'any', label: '任意' },
];

export default function UISelectionRouteProfileDetails({ draft, patch, collections = [], tags = [], slotIds = [], profilesByKind = {} }) {
  const route = normalizeUiSelectionRouteProfile(draft);
  const patchRuleAt = (index, update) => patch({ rules: route.rules.map((rule, i) => (i === index ? { ...rule, ...update } : rule)) });
  const patchMatchAt = (index, update) => patchRuleAt(index, { match: { ...route.rules[index].match, ...update } });
  const patchPanelAt = (ruleIndex, panelIndex, update) => patchRuleAt(ruleIndex, {
    panels: route.rules[ruleIndex].panels.map((panel, i) => (i === panelIndex ? { ...panel, ...update } : panel)),
  });
  const addRule = () => patch({ rules: [...route.rules, { rule_id: `rule_${route.rules.length + 1}`, label: '', match: { selection: 'any', required_all_tags: [], blocked_any_tags: [], prototype_ids: [] }, panels: [] }] });
  const addPanelAt = ruleIndex => patchRuleAt(ruleIndex, { panels: [...route.rules[ruleIndex].panels, { slot_id: slotIds[0] || '', panel_kind: 'selection_info', profile_ref: '' }] });

  const profileOptions = kind => {
    const registryEntry = UI_PANEL_KINDS.find(item => item.value === kind);
    return (profilesByKind[registryEntry?.profileSource] || []).map(item => ({
      value: item.panel_id || item.profile_id,
      label: `${item.label || item.panel_id || item.profile_id} · ${item.panel_id || item.profile_id}`,
    }));
  };

  return <div className="mx-auto max-w-5xl space-y-3">
    <Section title="基础与选中来源">
      <div className="grid gap-3 lg:grid-cols-3">
        <TextField label="Route ID" value={route.route_id} onChange={route_id => patch({ route_id })} />
        <TextField label="显示名" value={route.label} onChange={label => patch({ label })} />
        <SelectField label="选中集合" value={route.source.collection_key}
          options={collections.map(item => ({ value: item.collection_key, label: item.label ? `${item.collection_key} · ${item.label}` : item.collection_key }))}
          onChange={collection_key => patch({ source: { ...route.source, collection_key } })}
          hint="路由只消费集合；Playground 框选写入 Global.Selection" />
      </div>
    </Section>
    <Section title="路由规则（按顺序首条命中，未命中槽位留空）" right={
      <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={addRule}><Plus className="mr-1 h-3 w-3" />添加规则</Button>
    }>
      {route.rules.length === 0 && <p className="text-[10px] text-gray-500">尚无规则。示例：单选 → 选中信息+技能栏；多选 → 群组面板+技能栏。</p>}
      {route.rules.map((rule, ruleIndex) => (
        <div key={ruleIndex} className="rounded border border-[#2A2E37] p-2 space-y-2">
          <div className="flex items-end gap-2">
            <div className="w-40"><TextField label="Rule ID" value={rule.rule_id} onChange={rule_id => patchRuleAt(ruleIndex, { rule_id })} /></div>
            <div className="flex-1"><TextField label="显示名" value={rule.label} onChange={label => patchRuleAt(ruleIndex, { label })} /></div>
            <div className="w-32"><SelectField label="选中数量" value={rule.match.selection} options={SELECTION_OPTIONS} onChange={selection => patchMatchAt(ruleIndex, { selection })} /></div>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => patch({ rules: route.rules.filter((_, i) => i !== ruleIndex) })}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <div className="grid gap-2 lg:grid-cols-3">
            <GameplayTagListSelect label="每个选中实体须全部命中" value={rule.match.required_all_tags} tags={tags} onChange={required_all_tags => patchMatchAt(ruleIndex, { required_all_tags })} />
            <GameplayTagListSelect label="任一实体命中即排除" value={rule.match.blocked_any_tags} tags={tags} onChange={blocked_any_tags => patchMatchAt(ruleIndex, { blocked_any_tags })} />
            <ListField label="限定 Prototype（留空不限）" value={rule.match.prototype_ids} onChange={prototype_ids => patchMatchAt(ruleIndex, { prototype_ids })} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-400">命中后各槽位挂载</span>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => addPanelAt(ruleIndex)}><Plus className="mr-1 h-3 w-3" />添加落位</Button>
            </div>
            {rule.panels.map((panel, panelIndex) => (
              <div key={panelIndex} className="flex items-end gap-2">
                <div className="w-44"><SelectField label="槽位" value={panel.slot_id} options={slotIds.map(id => ({ value: id, label: id }))} onChange={slot_id => patchPanelAt(ruleIndex, panelIndex, { slot_id })} /></div>
                <div className="w-44"><SelectField label="面板种类" value={panel.panel_kind} options={UI_PANEL_KINDS.map(kind => ({ value: kind.value, label: kind.label }))} onChange={panel_kind => patchPanelAt(ruleIndex, panelIndex, { panel_kind, profile_ref: '' })} /></div>
                <div className="flex-1"><SelectField label="Profile" value={panel.profile_ref} options={profileOptions(panel.panel_kind)} onChange={profile_ref => patchPanelAt(ruleIndex, panelIndex, { profile_ref })} /></div>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400" onClick={() => patchRuleAt(ruleIndex, { panels: rule.panels.filter((_, i) => i !== panelIndex) })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            {rule.panels.length === 0 && <p className="text-[10px] text-gray-600">未配置落位：该规则命中时清空所有槽位（常用于"无选中"规则）。</p>}
          </div>
        </div>
      ))}
    </Section>
  </div>;
}
