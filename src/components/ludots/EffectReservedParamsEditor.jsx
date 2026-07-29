import React from 'react';
import { NumberField, Section, SelectField, TextField } from './ui';

const attributeOptions = (refs) => refs.attributes.map(item => ({ value: item.attribute_id, label: item.attribute_id }));

export default function EffectReservedParamsEditor({ draft, patch, refs }) {
  const params = draft.configParams || {};
  const set = (key, type, value) => patch({ configParams: { ...params, [key]: { type, value } } });
  if (draft.presetType === 'ApplyForce2D') return (
    <Section title="ForceParams · Loader 必需保留参数">
      {['_ep.forceXTargetAttrId', '_ep.forceYTargetAttrId'].map(key => <SelectField key={key} label={key} value={params[key]?.value} options={attributeOptions(refs)} onChange={(value) => set(key, 'Attribute', value)} />)}
    </Section>
  );
  if (draft.presetType === 'Exchange') return (
    <Section title="Exchange · Loader 必需保留参数">
      <NumberField label="_ep.exchangeOperationId" value={params['_ep.exchangeOperationId']?.value} onChange={(value) => set('_ep.exchangeOperationId', 'ExchangeOperation', value)} />
    </Section>
  );
  if (draft.presetType === 'DeployConsumeSource') return (
    <Section title="DeployConsumeSource · Loader 必需保留参数">
      <TextField label="_ep.targetEntityTemplate" value={params['_ep.targetEntityTemplate']?.value} onChange={(value) => set('_ep.targetEntityTemplate', 'EntityTemplate', value)} />
      <SelectField label="_ep.lifecycleAttributeValueSource" value={params['_ep.lifecycleAttributeValueSource']?.value} options={['Base', 'Current'].map(value => ({ value, label: value }))} onChange={(value) => set('_ep.lifecycleAttributeValueSource', 'LifecycleAttributeValueSource', value)} />
      {[0, 1, 2, 3].map(index => { const key = `_ep.lifecycleAttribute${index}`; return <SelectField key={key} label={key} value={params[key]?.value} options={attributeOptions(refs)} onChange={(value) => set(key, 'Attribute', value)} />; })}
    </Section>
  );
  return null;
}