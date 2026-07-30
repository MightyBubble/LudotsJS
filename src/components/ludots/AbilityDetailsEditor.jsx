import React, { useState } from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import AbilityExecEditor from './AbilityExecEditor';
import AbilityActivationEditor from './AbilityActivationEditor';
import AbilityOptionalEditor from './AbilityOptionalEditor';
import AbilityPresentationEditor from './AbilityPresentationEditor';
import AbilityDomainTabs from './AbilityDomainTabs';

export default function AbilityDetailsEditor({ draft, patch, refs, issues }) {
  const [domain, setDomain] = useState('execution');
  return <div className="max-w-6xl">
    <AbilityDomainTabs value={domain} onChange={setDomain} issueCount={issues.length} />
    {domain === 'identity' && <Section title="标识 Identity"><TextField label="Ability ID (JSON id)" value={draft.ability_id} onChange={ability_id => patch({ ability_id })} hint="平台保留 id，因此存储为 ability_id；导出时映射回 id" /></Section>}
    {domain === 'execution' && <AbilityExecEditor value={draft.exec || {}} refs={refs} onChange={exec => patch({ exec })} />}
    {domain === 'rules' && <><AbilityActivationEditor draft={draft} patch={patch} refs={refs} /><AbilityOptionalEditor draft={draft} patch={patch} refs={refs} domain="state" /></>}
    {domain === 'targeting' && <AbilityOptionalEditor draft={draft} patch={patch} refs={refs} domain="targeting" />}
    {domain === 'presentation' && <AbilityPresentationEditor value={draft.presentation || {}} onChange={presentation => patch({ presentation })} />}
    {domain === 'validation' && <Section title="校验 Validation">{issues.length === 0 ? <p className="text-[11px] text-green-500">符合 AbilityExecLoader 契约</p> : issues.map((item, index) => <p key={index} className={`text-[11px] ${item.severity === 'error' ? 'text-red-400' : 'text-yellow-500'}`}>[{item.severity}] {item.field_path}：{item.message} → {item.fix}</p>)}</Section>}
  </div>;
}