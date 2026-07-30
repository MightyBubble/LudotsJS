import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import AbilityExecEditor from './AbilityExecEditor';
import AbilityActivationEditor from './AbilityActivationEditor';
import AbilityOptionalEditor from './AbilityOptionalEditor';
import AbilityPresentationEditor from './AbilityPresentationEditor';

export default function AbilityDetailsEditor({ draft, patch, refs, issues }) {
  return <div className="max-w-6xl">
    <Section title="标识 Identity">
      <TextField label="Ability ID (JSON id)" value={draft.ability_id} onChange={ability_id => patch({ ability_id })} hint="平台保留 id，因此存储为 ability_id；导出时映射回 id" />
    </Section>
    <AbilityExecEditor value={draft.exec || {}} onChange={exec => patch({ exec })} />
    <AbilityActivationEditor draft={draft} patch={patch} refs={refs} />
    <AbilityOptionalEditor draft={draft} patch={patch} />
    <AbilityPresentationEditor value={draft.presentation || {}} onChange={presentation => patch({ presentation })} />
    <Section title="校验 Validation">
      {issues.length === 0 ? <p className="text-[11px] text-green-500">符合 AbilityExecLoader 契约</p> : issues.map((item, index) => <p key={index} className={`text-[11px] ${item.severity === 'error' ? 'text-red-400' : 'text-yellow-500'}`}>[{item.severity}] {item.field_path}：{item.message} → {item.fix}</p>)}
    </Section>
  </div>;
}