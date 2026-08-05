import React from 'react';
import { Field, SelectField, TextField } from '@/components/ludots/ui';
import { Textarea } from '@/components/ui/textarea';

const DOMAINS = ['performer', 'presentation', 'gameplay', 'input', 'map', 'other'].map(value => ({ value, label: value }));
const STATUSES = [
  ['js_only', '仅 JS'], ['js_planned', 'JS 待接入'], ['csharp_planned', 'C# 待接入'], ['csharp_in_progress', 'C# 接入中'],
  ['aligned', '已对齐'], ['wont_fix', '不对齐'],
].map(([value, label]) => ({ value, label }));

function LongField({ label, value, onChange }) {
  return <Field label={label}><Textarea aria-label={label} value={value || ''} onChange={event => onChange(event.target.value)} className="min-h-28 bg-[#0D0F14] border-[#424a55] text-xs" /></Field>;
}

export default function RuntimeDivergenceDetails({ draft, patch }) {
  return <div className="space-y-3 rounded border border-[#424a55] bg-[#171b21] p-4">
    <div className="grid gap-3 md:grid-cols-2">
      <TextField label="分叉 ID" value={draft.divergence_id} onChange={divergence_id => patch({ divergence_id })} />
      <TextField label="标题" value={draft.title} onChange={title => patch({ title })} />
      <SelectField label="领域" value={draft.domain} options={DOMAINS} onChange={domain => patch({ domain })} />
      <SelectField label="状态" value={draft.status} options={STATUSES} onChange={status => patch({ status })} />
    </div>
    <LongField label="LudotsJS 契约" value={draft.js_contract} onChange={js_contract => patch({ js_contract })} />
    <LongField label="C# 分叉点" value={draft.csharp_gap} onChange={csharp_gap => patch({ csharp_gap })} />
    <LongField label="迁移说明" value={draft.migration_notes} onChange={migration_notes => patch({ migration_notes })} />
    <TextField label="Issue URL" value={draft.issue_url} onChange={issue_url => patch({ issue_url })} />
  </div>;
}