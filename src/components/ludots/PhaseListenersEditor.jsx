import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { SelectField, TextField, NumberField, BoolField } from './ui';
import RefListSelector from './RefListSelector';
import { LISTENER_SCOPES, LISTENER_RESPONSE_TYPES, ENTITY_LIFECYCLE_REQUESTS } from './phaseModel';

/**
 * Phase Listener 编辑器（原 Hook）。
 * Listener 在该 Phase 的 Pre → Main → Post 完成后分发；
 * Response 只允许入队 Request，禁止在分发过程中直接做结构变化或销毁。
 */
export default function PhaseListenersEditor({ listeners = [], onChange, refs = {}, phaseLabel, phaseOptions }) {
  const { requirements = [], effects = [], events = [], abilities = [], prototypes = [] } = refs;

  const update = (idx, patch) => onChange(listeners.map((l, i) => i === idx ? { ...l, ...patch } : l));
  const add = () => onChange([...listeners, {
    listener_id: `listener_${Date.now()}`,
    name: '新监听器',
    scope: 'target',
    requirements: [],
    priority: 0,
    max_executions: 1,
    enabled: true,
    responses: [],
  }]);

  const updateResponse = (lIdx, rIdx, patch) => {
    const l = listeners[lIdx];
    update(lIdx, { responses: (l.responses || []).map((r, i) => i === rIdx ? { ...r, ...patch } : r) });
  };

  const responseRefField = (resp, lIdx, rIdx) => {
    const set = (patch) => updateResponse(lIdx, rIdx, patch);
    switch (resp.response_type) {
      case 'apply_effect':
      case 'remove_effect':
        return <SelectField label="效果" value={resp.effect_id} options={effects.map(e => ({ value: e.effect_id, label: e.name }))} onChange={(v) => set({ effect_id: v })} />;
      case 'emit_event':
        return <SelectField label="事件" value={resp.event_id} options={events.map(e => ({ value: e.event_id, label: e.name }))} onChange={(v) => set({ event_id: v })} />;
      case 'activate_ability':
        return <SelectField label="能力" value={resp.ability_id} options={abilities.map(a => ({ value: a.ability_id, label: a.name }))} onChange={(v) => set({ ability_id: v })} />;
      case 'entity_lifecycle_request':
        return (
          <>
            <SelectField label="请求类型" value={resp.lifecycle_request} options={ENTITY_LIFECYCLE_REQUESTS} onChange={(v) => set({ lifecycle_request: v })} />
            {resp.lifecycle_request === 'create' && (
              <SelectField label="实体原型" value={resp.prototype_id} options={prototypes.map(p => ({ value: p.prototype_id, label: p.name }))} onChange={(v) => set({ prototype_id: v })} />
            )}
            <p className="text-[10px] text-gray-600">销毁请求只入队 Entity Lifecycle Request，实际销毁在事务 Finalize Destroy 阶段完成。</p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-600">
        Listeners 在 {phaseLabel || '所属阶段'} 的 Pre / Main / Post 全部完成后分发；响应仅入队 Request。
      </p>
      {listeners.map((l, idx) => (
        <div key={l.listener_id || idx} className="border border-[#2A2E37] rounded bg-[#0D0F14]">
          <div className="flex items-center gap-2 px-2 py-1.5 border-b border-[#2A2E37]">
            <span className="text-[11px] text-[#E2D8B3] flex-1 truncate">{l.name} · {l.scope}</span>
            <button onClick={() => onChange(listeners.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-2 space-y-2">
            <BoolField label="启用" value={l.enabled !== false} onChange={(v) => update(idx, { enabled: v })} />
            <TextField label="名称" value={l.name} onChange={(v) => update(idx, { name: v })} />
            {phaseOptions && (
              <SelectField label="监听阶段 phase" value={l.phase} options={phaseOptions.map(p => ({ value: p, label: p }))} onChange={(v) => update(idx, { phase: v })} />
            )}
            <SelectField label="作用域 scope" value={l.scope || 'target'} options={LISTENER_SCOPES} onChange={(v) => update(idx, { scope: v })} />
            <RefListSelector label="前置需求 requirements" value={l.requirements || []} options={requirements.map(r => ({ value: r.requirement_id, label: r.name }))} onChange={(v) => update(idx, { requirements: v })} />
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="优先级 priority" value={l.priority} onChange={(v) => update(idx, { priority: v })} />
              <NumberField label="最大执行次数 maxExecutions" value={l.max_executions} onChange={(v) => update(idx, { max_executions: v })} />
            </div>

            <div className="border-t border-[#2A2E37] pt-2 space-y-2">
              <span className="text-[11px] text-gray-400">响应 responses（仅入队）</span>
              {(l.responses || []).map((resp, rIdx) => (
                <div key={rIdx} className="border border-[#2A2E37] rounded p-2 bg-[#15171C] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 flex-1">响应 #{rIdx + 1}</span>
                    <button onClick={() => update(idx, { responses: l.responses.filter((_, i) => i !== rIdx) })} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <SelectField label="类型" value={resp.response_type} options={LISTENER_RESPONSE_TYPES} onChange={(v) => updateResponse(idx, rIdx, { response_type: v })} />
                  {responseRefField(resp, idx, rIdx)}
                </div>
              ))}
              <Button
                onClick={() => update(idx, { responses: [...(l.responses || []), { response_type: 'apply_effect' }] })}
                size="sm" variant="outline" className="w-full h-6 text-[11px] bg-[#15171C] border-[#2A2E37] text-gray-300 hover:bg-[#2A2E37]"
              >
                <Plus className="w-3 h-3 mr-1" />添加响应
              </Button>
            </div>
          </div>
        </div>
      ))}
      <Button onClick={add} size="sm" variant="outline" className="w-full h-6 text-[11px] bg-[#15171C] border-[#2A2E37] text-gray-300 hover:bg-[#2A2E37]">
        <Plus className="w-3 h-3 mr-1" />添加 Listener
      </Button>
    </div>
  );
}