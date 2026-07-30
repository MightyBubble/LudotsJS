import React from 'react';
import { NumberField, Section } from '@/components/ludots/ui';
import AbilityExecEditor from './AbilityExecEditor';
import AbilityInputEditor from './AbilityInputEditor';
import EffectSelect from './EffectSelect';
import GameplayTagSelect from './GameplayTagSelect';
import RefListSelector from './RefListSelector';

export default function AbilityOptionalEditor({ draft, patch, refs = {}, domain = 'all' }) {
  const showState = domain === 'all' || domain === 'state';
  const showTargeting = domain === 'all' || domain === 'targeting';
  const effectOptions = (refs.effects || []).map(effect => ({ value: effect.effect_id, label: effect.effect_id }));
  return <>
    {showTargeting && <Section title="目标 Targeting">
      <NumberField label="施法范围 cm castRangeCm" value={draft.targeting?.castRangeCm} onChange={castRangeCm => patch({ targeting: { ...(draft.targeting || {}), castRangeCm } })} />
      <EffectSelect label="命中效果 impactEffect" value={draft.targeting?.impactEffect} effects={refs.effects || []} onChange={impactEffect => patch({ targeting: { ...(draft.targeting || {}), impactEffect } })} />
    </Section>}
    {showState && <Section title="切换能力 Toggle Spec" right={<button onClick={() => patch({ toggleSpec: { ...(draft.toggleSpec || {}), deactivateExec: draft.toggleSpec?.deactivateExec ? undefined : { clockId: 'FixedFrame', items: [{ kind: 'End', tick: 0 }] } } })} className="text-[10px] text-[#D97706]">{draft.toggleSpec?.deactivateExec ? '移除 Deactivate Exec' : '添加 Deactivate Exec'}</button>}>
      <GameplayTagSelect label="切换标签 toggleTag" value={draft.toggleSpec?.toggleTag} tags={refs.tags || []} onChange={toggleTag => patch({ toggleSpec: { ...(draft.toggleSpec || {}), toggleTag } })} />
      <RefListSelector label="激活效果 activeEffects（最多 4）" value={draft.toggleSpec?.activeEffects || []} options={effectOptions} onChange={activeEffects => patch({ toggleSpec: { ...(draft.toggleSpec || {}), activeEffects: activeEffects.slice(0, 4) } })} emptyText="暂无激活效果" />
    </Section>}
    {showState && draft.toggleSpec?.deactivateExec && <AbilityExecEditor title="关闭执行 Deactivate Exec" value={draft.toggleSpec.deactivateExec} refs={refs} onChange={deactivateExec => patch({ toggleSpec: { ...draft.toggleSpec, deactivateExec } })} />}
    {showTargeting && <AbilityInputEditor value={draft.input || {}} refs={refs} onChange={input => patch({ input })} />}
  </>;
}