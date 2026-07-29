import React from 'react';
import { BoolField, Section, SelectField, TextField } from './ui';
import GameplayTagSelect from './GameplayTagSelect';
import OptionalEffectSection from './OptionalEffectSection';
import { EFFECT_PRESET_OPTIONS } from './effectPresetTypes';
import { EFFECT_OBJECTS } from './effectConfigFields';

export default function EffectCoreEditor({ draft, patch, refs }) {
  return (
    <>
      <Section title="基础 Basic · EffectTemplateConfig">
        <TextField label="id" value={draft.effect_id} onChange={(effect_id) => patch({ effect_id })} hint="C# JSON 的 id；数据库中存为 effect_id" />
        <GameplayTagSelect label="tags[0]" value={draft.tags?.[0]} tags={refs.tags} onChange={(tag) => patch({ tags: tag ? [tag] : [] })} />
        <SelectField label="presetType" value={draft.presetType || 'None'} options={EFFECT_PRESET_OPTIONS} onChange={(presetType) => patch({ presetType })} />
        <SelectField label="lifetime" value={draft.lifetime || 'Instant'} options={['Instant', 'After', 'Infinite'].map(value => ({ value, label: value }))} onChange={(lifetime) => patch({ lifetime })} />
        <BoolField label="participatesInResponse" value={draft.participatesInResponse === true} onChange={(participatesInResponse) => patch({ participatesInResponse })} />
      </Section>
      {['expireCondition', 'duration', 'stack'].map(key => <OptionalEffectSection key={key} config={EFFECT_OBJECTS[key]} value={draft[key]} onChange={(value) => patch({ [key]: value })} refs={refs} />)}
    </>
  );
}