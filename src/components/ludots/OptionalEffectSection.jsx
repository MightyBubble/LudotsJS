import React from 'react';
import { BoolField, Section } from './ui';
import EffectFieldControl from './EffectFieldControl';
import { getEffectPath, setEffectPath } from './effectFieldUtils';

export default function OptionalEffectSection({ config, value, onChange, refs }) {
  const enabled = value != null;
  return (
    <Section title={config.title}>
      <BoolField label="配置此字段" value={enabled} onChange={(next) => onChange(next ? {} : null)} />
      {enabled && config.fields.map(field => (
        <EffectFieldControl
          key={field.key}
          field={field}
          value={getEffectPath(value, field.key)}
          onChange={(next) => onChange(setEffectPath(value, field.key, next))}
          refs={refs}
        />
      ))}
    </Section>
  );
}