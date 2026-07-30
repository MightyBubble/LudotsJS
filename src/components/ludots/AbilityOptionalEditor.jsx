import React from 'react';
import { ListField, NumberField, Section, TextField } from '@/components/ludots/ui';
import AbilityExecEditor from './AbilityExecEditor';
import AbilityInputEditor from './AbilityInputEditor';

export default function AbilityOptionalEditor({ draft, patch }) {
  return <>
    <Section title="冷却 Cooldown">
      <TextField label="冷却值属性 valueAttribute" value={draft.cooldown?.valueAttribute} onChange={valueAttribute => patch({ cooldown: { ...(draft.cooldown || {}), valueAttribute } })} />
      <TextField label="冷却标签 tag" value={draft.cooldown?.tag} onChange={tag => patch({ cooldown: { ...(draft.cooldown || {}), tag } })} />
    </Section>
    <Section title="目标 Targeting">
      <NumberField label="施法范围 cm castRangeCm" value={draft.targeting?.castRangeCm} onChange={castRangeCm => patch({ targeting: { ...(draft.targeting || {}), castRangeCm } })} />
      <TextField label="命中效果 impactEffect" value={draft.targeting?.impactEffect} onChange={impactEffect => patch({ targeting: { ...(draft.targeting || {}), impactEffect } })} />
    </Section>
    <Section title="切换能力 Toggle Spec" right={<button onClick={() => patch({ toggleSpec: { ...(draft.toggleSpec || {}), deactivateExec: draft.toggleSpec?.deactivateExec ? undefined : { clockId: 'FixedFrame', items: [{ kind: 'End', tick: 0 }] } } })} className="text-[10px] text-[#D97706]">{draft.toggleSpec?.deactivateExec ? '移除 Deactivate Exec' : '添加 Deactivate Exec'}</button>}>
      <TextField label="切换标签 toggleTag" value={draft.toggleSpec?.toggleTag} onChange={toggleTag => patch({ toggleSpec: { ...(draft.toggleSpec || {}), toggleTag } })} />
      <ListField label="激活效果 activeEffects（最多 4）" value={draft.toggleSpec?.activeEffects || []} onChange={activeEffects => patch({ toggleSpec: { ...(draft.toggleSpec || {}), activeEffects } })} />
    </Section>
    {draft.toggleSpec?.deactivateExec && <AbilityExecEditor title="关闭执行 Deactivate Exec" value={draft.toggleSpec.deactivateExec} onChange={deactivateExec => patch({ toggleSpec: { ...draft.toggleSpec, deactivateExec } })} />}
    <AbilityInputEditor value={draft.input || {}} onChange={input => patch({ input })} />
  </>;
}