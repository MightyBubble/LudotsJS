import React from 'react';
import { BoolField, ListField, NumberField, SelectField, TextField } from './ui';
import GameplayTagSelect from './GameplayTagSelect';
import JsonValueField from './JsonValueField';

export default function EffectFieldControl({ field, value, onChange, refs }) {
  if (field.type === 'bool') return <BoolField label={field.label} value={value === true} onChange={onChange} />;
  if (field.type === 'number') return <NumberField label={field.label} value={value} onChange={onChange} />;
  if (field.type === 'list') return <ListField label={field.label} value={value || []} onChange={onChange} />;
  if (field.type === 'tag') return <GameplayTagSelect label={field.label} value={value} tags={refs.tags} onChange={onChange} />;
  if (field.type === 'json') return <JsonValueField label={field.label} value={value} onChange={onChange} />;
  if (field.type === 'select') return <SelectField label={field.label} value={value} options={field.options.map(v => ({ value: v, label: v }))} onChange={onChange} />;
  if (field.type === 'effect') return <SelectField label={field.label} value={value} options={refs.effects.map(e => ({ value: e.effect_id, label: e.effect_id }))} onChange={onChange} />;
  if (field.type === 'attribute') return <SelectField label={field.label} value={value} options={refs.attributes.map(a => ({ value: a.attribute_id, label: a.attribute_id }))} onChange={onChange} />;
  return <TextField label={field.label} value={value} onChange={onChange} />;
}