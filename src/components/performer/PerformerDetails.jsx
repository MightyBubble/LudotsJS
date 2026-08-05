import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';
import PerformerAuthoringSettings from './PerformerAuthoringSettings';
import PerformerBehaviorList from './PerformerBehaviorList';
import PerformerParamsSection from './PerformerParamsSection';
import PerformerRulesSection from './PerformerRulesSection';

export default function PerformerDetails({ draft, patch, compact = false }) {
  const refs = usePresentationRefs();
  return <div className="space-y-4">
    <Section title="基础信息">
      <div className={`grid grid-cols-1 gap-3 ${compact ? '' : 'md:grid-cols-3'}`}>
        <TextField label="Performer ID" value={draft.performer_id} onChange={performer_id => patch({ performer_id })} />
        <TextField label="名称（不导出）" value={draft.label} onChange={label => patch({ label })} />
        <ReferenceSelect label="Extends" hint="继承的 performer id" value={draft.extends} options={refs.performers} onChange={extendsId => patch({ extends: extendsId })} />
      </div>
      <TextField label="说明（不导出）" value={draft.description} onChange={description => patch({ description })} />
    </Section>

    <PerformerAuthoringSettings draft={draft} patch={patch} compact={compact} />

    <PerformerBehaviorList behaviors={draft.behaviors} refs={refs} onChange={behaviors => patch({ behaviors })} />
    <PerformerParamsSection
      paramDefaults={draft.paramDefaults}
      onChangeParams={paramDefaults => patch({ paramDefaults })}
    />
    <PerformerRulesSection rules={draft.rules} refs={refs} onChange={rules => patch({ rules })} />
  </div>;
}