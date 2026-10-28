import React from 'react';
import { Section, BoolField, ListField, NumberField, TextField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';

export default function MapAssetsEditor({ value, patch }) {
  return (
    <Section title="标签与元数据">
      <ListField helpIndex={4} label="Tags" value={value.tags} onChange={tags => patch({ tags })} />
      <JsonValueField helpIndex={5} label="Metadata (JSON Object)" value={value.metadata} onChange={metadata => patch({ metadata: metadata || {} })} />
    </Section>
  );
}