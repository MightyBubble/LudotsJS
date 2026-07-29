import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { SelectField } from './ui';
import { ENTITY_LIFECYCLE_REQUESTS } from './phaseModel';

const REQUEST_TYPES = [
  { value: 'apply_effect', label: 'Effect Request · apply_effect' },
  { value: 'remove_effect', label: 'Effect Request · remove_effect' },
  { value: 'activate_ability', label: 'Ability Request · activate_ability' },
  { value: 'entity_lifecycle_request', label: 'Entity Lifecycle Request' },
];

const SCOPES = ['owner', 'source', 'target', 'global'].map(v => ({ value: v, label: v }));

/** Trigger 命中后只能入队 Request，不能直接修改 World */
export default function TriggerRequestsEditor({ requests = [], onChange, refs = {} }) {
  const { effects = [], abilities = [], prototypes = [] } = refs;
  const update = (idx, patch) => onChange(requests.map((r, i) => i === idx ? { ...r, ...patch } : r));

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-gray-600">
        链路：Event / 状态变化 → Trigger → Request 入队 → 完整 Phase pipeline。Trigger 自身不写状态、不做结构变化。
      </p>
      {requests.map((req, idx) => (
        <div key={req.request_id || idx} className="border border-[#2A2E37] rounded bg-[#0D0F14] p-2 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#E2D8B3] flex-1 truncate">请求 #{idx + 1} · {req.request_type}</span>
            <button onClick={() => onChange(requests.filter((_, i) => i !== idx))} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <SelectField label="请求类型" value={req.request_type} options={REQUEST_TYPES} onChange={(v) => update(idx, { request_type: v })} />
          {['apply_effect', 'remove_effect'].includes(req.request_type) && (
            <SelectField label="效果" value={req.effect_id} options={effects.map(e => ({ value: e.effect_id, label: e.name }))} onChange={(v) => update(idx, { effect_id: v })} />
          )}
          {req.request_type === 'activate_ability' && (
            <SelectField label="能力" value={req.ability_id} options={abilities.map(a => ({ value: a.ability_id, label: a.name }))} onChange={(v) => update(idx, { ability_id: v })} />
          )}
          {req.request_type === 'entity_lifecycle_request' && (
            <>
              <SelectField label="生命周期请求" value={req.lifecycle_request} options={ENTITY_LIFECYCLE_REQUESTS} onChange={(v) => update(idx, { lifecycle_request: v })} />
              {req.lifecycle_request === 'create' && (
                <SelectField label="实体原型" value={req.prototype_id} options={prototypes.map(p => ({ value: p.prototype_id, label: p.name }))} onChange={(v) => update(idx, { prototype_id: v })} />
              )}
            </>
          )}
          <SelectField label="目标作用域" value={req.target_scope || 'owner'} options={SCOPES} onChange={(v) => update(idx, { target_scope: v })} />
        </div>
      ))}
      <Button
        onClick={() => onChange([...requests, { request_id: `req_${Date.now()}`, request_type: 'apply_effect', target_scope: 'owner' }])}
        size="sm" variant="outline" className="w-full h-6 text-[11px] bg-[#0D0F14] border-[#2A2E37] text-gray-300 hover:bg-[#2A2E37]"
      >
        <Plus className="w-3 h-3 mr-1" />添加请求
      </Button>
    </div>
  );
}