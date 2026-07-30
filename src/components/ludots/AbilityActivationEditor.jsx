import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import RefListSelector from './RefListSelector';

export default function AbilityActivationEditor({ draft, patch, refs }) {
  const effectOptions = refs.effects.map(effect => ({ value: effect.effect_id, label: effect.effect_id }));
  const tagOptions = refs.tags.map(tag => ({ value: tag.full_path, label: tag.full_path }));
  return <>
    <Section title="激活规则 Activation">
      <RefListSelector label="激活效果 onActivateEffects" value={draft.onActivateEffects || []} options={effectOptions} onChange={onActivateEffects => patch({ onActivateEffects })} />
      <RefListSelector label="目录标签 catalogTags" value={draft.catalogTags || []} options={tagOptions} onChange={catalogTags => patch({ catalogTags })} emptyText="暂无目录标签" />
      <RefListSelector label="必须全部存在 blockTags.requiredAll" value={draft.blockTags?.requiredAll || []} options={tagOptions} onChange={requiredAll => patch({ blockTags: { ...(draft.blockTags || {}), requiredAll } })} emptyText="暂无必需标签" />
      <RefListSelector label="任一阻止 blockTags.blockedAny" value={draft.blockTags?.blockedAny || []} options={tagOptions} onChange={blockedAny => patch({ blockTags: { ...(draft.blockTags || {}), blockedAny } })} emptyText="暂无阻止标签" />
      <TextField label="校验图 activationPrecondition.validationGraph" value={draft.activationPrecondition?.validationGraph} onChange={validationGraph => patch({ activationPrecondition: { validationGraph } })} />
    </Section>
    <Section title="进度与交互 Progression">
      <TextField label="使用需求 useRequirement" value={draft.useRequirement} onChange={useRequirement => patch({ useRequirement })} />
      <TextField label="显示需求 showRequirement" value={draft.showRequirement} onChange={showRequirement => patch({ showRequirement })} />
      <TextField label="交互上下文 interactionContextProfile" value={draft.interactionContextProfile} onChange={interactionContextProfile => patch({ interactionContextProfile })} />
    </Section>
  </>;
}