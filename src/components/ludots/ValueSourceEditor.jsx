import React from 'react';
import { SelectField, TextField, NumberField } from './ui';

export const VALUE_SOURCE_KINDS = [
  { value: 'constant', label: '常量值' },
  { value: 'blackboard', label: '黑板变量' },
  { value: 'attribute', label: '属性值' },
  { value: 'global_constant', label: '全局常量' },
  { value: 'data_graph_output', label: '数据图输出' },
];

export default function ValueSourceEditor({ label, value = {}, onChange, attributes = [], constants = [], dataGraphs = [] }) {
  const kind = value.kind || 'constant';
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="border border-[#2A2E37] rounded p-2 space-y-2 bg-[#0D0F14]">
      <SelectField label={label} value={kind} options={VALUE_SOURCE_KINDS} onChange={(v) => onChange({ kind: v })} />

      {kind === 'constant' && <NumberField label="数值" value={value.constant_value} onChange={(v) => set({ constant_value: v })} />}
      {kind === 'blackboard' && <TextField label="黑板键" value={value.blackboard_key} onChange={(v) => set({ blackboard_key: v })} />}
      {kind === 'attribute' && (
        <>
          <SelectField label="属性" value={value.attribute_id} options={attributes.map(a => ({ value: a.attribute_id, label: a.name }))} onChange={(v) => set({ attribute_id: v })} />
          <TextField label="属性键" value={value.attribute_key} onChange={(v) => set({ attribute_key: v })} />
        </>
      )}
      {kind === 'global_constant' && (
        <SelectField label="全局常量" value={value.constant_key} options={constants.map(c => ({ value: c.constant_key, label: c.constant_key }))} onChange={(v) => set({ constant_key: v })} />
      )}
      {kind === 'data_graph_output' && (
        <SelectField label="数据图" value={value.data_graph_id} options={dataGraphs.map(g => ({ value: g.graph_id, label: `${g.name} · ${g.return_type || 'number'}` }))} onChange={(v) => set({ data_graph_id: v })} />
      )}
    </div>
  );
}