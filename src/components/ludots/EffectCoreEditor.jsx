import React from 'react';
import { BoolField, Section, SelectField, TextField } from './ui';
import GameplayTagSelect from './GameplayTagSelect';
import OptionalEffectSection from './OptionalEffectSection';
import { EFFECT_PRESET_OPTIONS } from './effectPresetTypes';
import { EFFECT_OBJECTS } from './effectConfigFields';
import { EFFECT_PRESETS, presetPatch } from './effectPresetDefinitions';

export default function EffectCoreEditor({ draft, patch, refs }) {
  const preset = EFFECT_PRESETS[draft.presetType] || EFFECT_PRESETS.None;
  const durable = draft.lifetime !== 'Instant';
  const changeLifetime = (lifetime) => patch({ lifetime, ...(lifetime === 'Instant' ? { expireCondition: null, stack: null, phaseListeners: [] } : {}) });
  return (
    <>
      <Section title="基础 Basic · EffectTemplateConfig">
        <TextField label="id" value={draft.effect_id} onChange={(effect_id) => patch({ effect_id })} hint="C# JSON 的 id；数据库中存为 effect_id" />
        <GameplayTagSelect label="tags[0]" value={draft.tags?.[0]} tags={refs.tags} onChange={(tag) => patch({ tags: tag ? [tag] : [] })} />
        <SelectField label="presetType" value={draft.presetType || 'None'} options={EFFECT_PRESET_OPTIONS} onChange={(presetType) => patch(presetPatch(draft, presetType))} />
        <SelectField label="lifetime" value={draft.lifetime || preset.allowedLifetimes[0]} options={preset.allowedLifetimes.map(value => ({ value, label: value }))} onChange={changeLifetime} hint="来自 preset_types.json 的 allowedLifetimes" />
        <BoolField label="participatesInResponse" value={draft.participatesInResponse === true} onChange={(participatesInResponse) => patch({ participatesInResponse })} />
      </Section>
      {durable && ['expireCondition', 'stack'].map(key => <OptionalEffectSection key={key} config={EFFECT_OBJECTS[key]} value={draft[key]} onChange={(value) => patch({ [key]: value })} refs={refs} />)}
    </>
  );
}