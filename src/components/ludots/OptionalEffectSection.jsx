import React from 'react';
import { BoolField, Section } from './ui';
import EffectFieldControl from './EffectFieldControl';
import { getEffectPath, setEffectPath } from './effectFieldUtils';

export default function OptionalEffectSection({ config, value, onChange, refs, required = false }) {
  const enabled = required || value != null;
  const current = value || {};
  return (
    <Section title={`${config.title}${required ? ' · Preset 必需' : ''}`}>
      {!required && <BoolField label="配置此字段" value={enabled} onChange={(next) => onChange(next ? {} : null)} />}
      {enabled && config.fields.map(field => (
        <EffectFieldControl
          key={field.key}
          field={field}
          value={getEffectPath(current, field.key)}
          onChange={(next) => onChange(setEffectPath(current, field.key, next))}
          refs={refs}
        />
      ))}
    </Section>
  );
}