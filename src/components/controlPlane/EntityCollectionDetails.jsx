import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';

export default function EntityCollectionDetails({ draft, patch }) {
  return (
    <Section title="实体集合键">
      <div className="grid grid-cols-2 gap-2">
        <TextField label="集合键" value={draft.collection_key}
          onChange={collection_key => patch({ collection_key })}
          hint="纯标识，不含来源与规则" />
        <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
      </div>
      <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
    </Section>
  );
}