import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GitFork } from 'lucide-react';
import { SelectField, TextField, NumberField, BoolField } from './ui';
import RefListSelector from './RefListSelector';
import { RESPONSE_CHAIN_ACTIONS } from './phaseModel';

/** ResponseChain：OnPropose 与 OnCalculate 之间的响应窗口（不是 phase enum） */
export default function ResponseChainEditor({ value = {}, onChange, refs = {}, selfEffectId }) {
  const { requirements = [], effects = [], entityQueries = [] } = refs;
  const entries = value.entries || [];
  const set = (patch) => onChange({ ...value, ...patch });
  const updateEntry = (idx, patch) => set({ entries: entries.map((e, i) => i === idx ? { ...e, ...patch } : e) });
  const effectOptions = effects.filter(e => e.effect_id !== selfEffectId).map(e => ({ value: e.effect_id, label: e.name }));

  return (
    <div className="border border-dashed border-[#D97706]/60 rounded bg-[#15171C] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <GitFork className="w-3.5 h-3.5 text-[#D97706]" />
        <span className="text-xs font-semibold text-[#E2D8B3]">ResponseChain · 响应窗口</span>
        <span className="text-[10px] text-gray-500">OnPropose → ResponseChain → OnCalculate</span>
      </div>
      <BoolField label="启用响应窗口" value={!!value.enabled} onChange={(v) => set({ enabled: v })} />
      {value.enabled && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <NumberField label="最大响应深度 maxDepth" value={value.max_depth} onChange={(v) => set({ max_depth: v })} />
            <NumberField label="最大响应数 maxResponses" value={value.max_responses} onChange={(v) => set({ max_responses: v })} />
            <NumberField label="root budget" value={value.root_budget} onChange={(v) => set({ root_budget: v })} />
          </div>
          <BoolField label="按 correlationId / causationId 去重" value={!!value.dedupe_by_correlation} onChange={(v) => set({ dedupe_by_correlation: v })} />

          {entries.map((entry, idx) => (
            <div key={entry.entry_id || idx} className="border border-[#2A2E37] rounded bg-[#0D0F14] p-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#E2D8B3] flex-1 truncate">{entry.name} · {entry.action}</span>
                <button onClick={() => set({ entries: entries.filter((_, i) => i !== idx) })} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <TextField label="名称" value={entry.name} onChange={(v) => updateEntry(idx, { name: v })} />
              <SelectField label="动作 action" value={entry.action} options={RESPONSE_CHAIN_ACTIONS} onChange={(v) => updateEntry(idx, { action: v })} />
              <RefListSelector label="命中需求 requirements" value={entry.requirements || []} options={requirements.map(r => ({ value: r.requirement_id, label: r.name }))} onChange={(v) => updateEntry(idx, { requirements: v })} />
              <NumberField label="优先级 priority" value={entry.priority} onChange={(v) => updateEntry(idx, { priority: v })} />
              {entry.action === 'modify' && (
                <TextField label="修改映射" value={entry.modify_mapping_text} onChange={(v) => updateEntry(idx, { modify_mapping_text: v })} placeholder="magnitude=*0.5, duration=+2" />
              )}
              {entry.action === 'redirect' && (
                <SelectField label="重定向到实体查询" value={entry.redirect_query_id} options={entityQueries.map(q => ({ value: q.query_id || q.id, label: q.name }))} onChange={(v) => updateEntry(idx, { redirect_query_id: v })} />
              )}
              {entry.action === 'replace' && (
                <SelectField label="替换为效果" value={entry.replacement_effect_id} options={effectOptions} onChange={(v) => updateEntry(idx, { replacement_effect_id: v })} />
              )}
              {entry.action === 'append' && (
                <SelectField label="追加效果" value={entry.appended_effect_id} options={effectOptions} onChange={(v) => updateEntry(idx, { appended_effect_id: v })} />
              )}
              {(entry.action === 'reject' || entry.action === 'cancel') && (
                <p className="text-[10px] text-gray-600">
                  {entry.action === 'reject' ? 'reject：Request 不进入 OnCalculate。' : 'cancel：跳过 OnExpire，仍执行 OnRemove。'}
                </p>
              )}
            </div>
          ))}
          <Button
            onClick={() => set({ entries: [...entries, { entry_id: `rc_${Date.now()}`, name: '新响应', action: 'modify', requirements: [], priority: 0 }] })}
            size="sm" variant="outline" className="w-full h-6 text-[11px] bg-[#0D0F14] border-[#2A2E37] text-gray-300 hover:bg-[#2A2E37]"
          >
            <Plus className="w-3 h-3 mr-1" />添加响应项
          </Button>
        </>
      )}
    </div>
  );
}