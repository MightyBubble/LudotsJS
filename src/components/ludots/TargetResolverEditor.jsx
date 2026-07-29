import React from 'react';
import { SelectField, TextField } from './ui';

export const TARGET_KINDS = [
  { value: 'self', label: '自身 (self)' },
  { value: 'source', label: '施法者 (source)' },
  { value: 'explicit_target', label: '显式目标 (explicit_target)' },
  { value: 'event_source', label: '事件源 (event_source)' },
  { value: 'event_target', label: '事件目标 (event_target)' },
  { value: 'blackboard', label: '黑板变量 (blackboard)' },
  { value: 'entity_query', label: '实体查询 (entity_query)' },
];

export default function TargetResolverEditor({ label = '目标解析', value = {}, onChange, entityQueries = [] }) {
  const kind = value.kind || 'self';
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="border border-[#2A2E37] rounded p-2 space-y-2 bg-[#0D0F14]">
      <SelectField label={label} value={kind} options={TARGET_KINDS} onChange={(v) => onChange({ kind: v })} />
      {kind === 'blackboard' && <TextField label="黑板键" value={value.blackboard_key} onChange={(v) => set({ blackboard_key: v })} />}
      {kind === 'entity_query' && (
        <SelectField
          label="实体查询"
          value={value.entity_query_id}
          options={entityQueries.map(q => ({ value: q.id, label: q.query_name }))}
          onChange={(v) => set({ entity_query_id: v })}
        />
      )}
    </div>
  );
}