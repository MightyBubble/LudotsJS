import React from 'react';
import { Section } from './ui';
import EffectObjectListEditor from './EffectObjectListEditor';
import OptionalEffectSection from './OptionalEffectSection';
import { EFFECT_OBJECTS, MODIFIER_FIELDS } from './effectConfigFields';
import { getEffectPresetDefinition } from './effectPresetDefinitions';
import EffectReservedParamsEditor from './EffectReservedParamsEditor';

export default function EffectPresetEditor({ draft, patch, refs }) {
  const def = getEffectPresetDefinition(draft.presetType, refs.constants);
  return (
    <>
      <Section title={`Preset · ${draft.presetType || 'None'}`}>
        <div className="grid gap-2 text-[11px] md:grid-cols-3"><div><span className="text-gray-500">Components</span><p>{def.components.join(', ') || 'None'}</p></div><div><span className="text-gray-500">Allowed Lifetimes</span><p>{def.allowedLifetimes.join(', ')}</p></div><div><span className="text-gray-500">Default Main</span><p>{Object.entries(def.handlers).map(([phase, h]) => `${phase}: ${h.id}`).join(' · ') || 'None'}</p></div></div>
      </Section>
      <EffectReservedParamsEditor draft={draft} patch={patch} refs={refs} />
      {(def.fields || []).map(key => key === 'modifiers'
        ? <EffectObjectListEditor key={key} title="ModifierParams · modifiers" value={draft.modifiers || []} fields={MODIFIER_FIELDS} onChange={(modifiers) => patch({ modifiers })} refs={refs} />
        : <OptionalEffectSection key={key} required config={EFFECT_OBJECTS[key]} value={draft[key]} onChange={(value) => patch({ [key]: value })} refs={refs} />)}
      {(def.optionalFields || []).map(key => <OptionalEffectSection key={key} config={EFFECT_OBJECTS[key]} value={draft[key]} onChange={(value) => patch({ [key]: value })} refs={refs} />)}
    </>
  );
}