import React from 'react';
import { Section } from './ui';
import EffectCoreEditor from './EffectCoreEditor';
import EffectTargetingEditor from './EffectTargetingEditor';
import EffectComponentsEditor from './EffectComponentsEditor';
import EffectCapabilitiesEditor from './EffectCapabilitiesEditor';

export default function EffectDetailsEditor({ draft, patch, refs, issues }) {
  return (
    <div className="max-w-3xl space-y-3">
      <EffectCoreEditor draft={draft} patch={patch} refs={refs} />
      <EffectTargetingEditor draft={draft} patch={patch} refs={refs} />
      <EffectComponentsEditor draft={draft} patch={patch} refs={refs} />
      <EffectCapabilitiesEditor draft={draft} patch={patch} refs={refs} />
      <Section title="校验 Validation">
        {issues.length === 0 ? <p className="text-[11px] text-green-500">未发现问题</p> : issues.map((item, index) => <p key={index} className={`text-[11px] ${item.severity === 'error' ? 'text-red-400' : 'text-yellow-500'}`}>[{item.severity}] {item.field_path}：{item.message}　→ {item.fix}</p>)}
      </Section>
    </div>
  );
}