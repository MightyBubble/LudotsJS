import React from 'react';
import { BoolField, ListField, NumberField, SelectField, TextField } from '@/components/ludots/ui';
import GameplayTagSelect from '@/components/ludots/GameplayTagSelect';
import RefListSelector from '@/components/ludots/RefListSelector';
import ContractFields from '@/components/input/contract/ContractFields';
import ContractArrayField from '@/components/input/contract/ContractArrayField';
import ContractMapField from '@/components/input/contract/ContractMapField';

export default function ContractField({ field, value, onChange, refs }) {
  if (field.type === 'number') return <NumberField label={field.label} value={value} onChange={onChange} hint={field.hint} />;
  if (field.type === 'boolean') return <BoolField label={field.label} value={value} onChange={onChange} />;
  if (field.type === 'select') return <SelectField label={field.label} value={value} options={field.options.map(x => ({ value: x, label: x }))} onChange={onChange} hint={field.hint} />;
  if (field.type === 'nullableBoolean') return <SelectField label={field.label} value={value == null ? '未设置' : String(value)} options={['未设置','true','false'].map(x => ({ value:x,label:x }))} onChange={next => onChange(next === '未设置' ? null : next === 'true')} />;
  if (field.type === 'list') return <ListField label={field.label} value={value || []} onChange={onChange} hint={field.hint} />;
  if (field.type === 'tag') return <GameplayTagSelect label={field.label} value={value} tags={refs.tags} onChange={onChange} />;
  if (field.type === 'tagList') return <RefListSelector label={field.label} value={value || []} options={refs.tagOptions} onChange={onChange} />;
  if (field.type === 'object') return <fieldset className="rounded border border-[#2A2E37] p-3"><legend className="px-1 text-[11px] text-[#E2D8B3]">{field.label}</legend><ContractFields fields={field.fields} value={value || field.default} onChange={onChange} refs={refs} /></fieldset>;
  if (field.type === 'array') return <ContractArrayField field={field} value={value || []} onChange={onChange} refs={refs} />;
  if (field.type === 'map') return <ContractMapField field={field} value={value || {}} onChange={onChange} refs={refs} />;
  return <TextField label={field.label} value={value} onChange={onChange} hint={field.hint} placeholder={field.placeholder} />;
}