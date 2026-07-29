import React from 'react';
import OptionalEffectSection from './OptionalEffectSection';
import { EFFECT_OBJECTS } from './effectConfigFields';

export default function EffectTargetingEditor({ draft, patch, refs }) {
  return <>{['targetQuery', 'targetFilter', 'targetDispatch'].map(key => <OptionalEffectSection key={key} config={EFFECT_OBJECTS[key]} value={draft[key]} onChange={(value) => patch({ [key]: value })} refs={refs} />)}</>;
}