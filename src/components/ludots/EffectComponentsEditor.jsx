import React from 'react';
import EffectObjectListEditor from './EffectObjectListEditor';
import OptionalEffectSection from './OptionalEffectSection';
import { EFFECT_OBJECTS, MODIFIER_FIELDS } from './effectConfigFields';

const BLOCKS = ['projectile', 'unitCreation', 'displacement', 'relation', 'revealArea', 'submitOrderFromBlackboard', 'progression'];

export default function EffectComponentsEditor({ draft, patch, refs }) {
  return (
    <>
      <EffectObjectListEditor title="属性修改 modifiers" value={draft.modifiers || []} fields={MODIFIER_FIELDS} onChange={(modifiers) => patch({ modifiers })} refs={refs} />
      {BLOCKS.map(key => <OptionalEffectSection key={key} config={EFFECT_OBJECTS[key]} value={draft[key]} onChange={(value) => patch({ [key]: value })} refs={refs} />)}
    </>
  );
}