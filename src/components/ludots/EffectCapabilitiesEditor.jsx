import React from 'react';
import EffectObjectListEditor from './EffectObjectListEditor';
import EffectObjectMapEditor from './EffectObjectMapEditor';
import EffectPhaseEditor from './EffectPhaseEditor';
import EffectPhaseListenersEditor from './EffectPhaseListenersEditor';
import { CONFIG_PARAM_FIELDS, GRANTED_TAG_FIELDS } from './effectConfigFields';

export default function EffectCapabilitiesEditor({ draft, patch, refs }) {
  return (
    <>
      <EffectPhaseEditor draft={draft} patch={patch} refs={refs} />
      {draft.lifetime !== 'Instant' && <EffectPhaseListenersEditor value={draft.phaseListeners || []} onChange={(phaseListeners) => patch({ phaseListeners })} refs={refs} />}
      <EffectObjectListEditor title="授予标签 grantedTags" value={draft.grantedTags || []} fields={GRANTED_TAG_FIELDS} onChange={(grantedTags) => patch({ grantedTags })} refs={refs} />
      <EffectObjectMapEditor title="高级配置参数 configParams" value={draft.configParams || {}} fields={CONFIG_PARAM_FIELDS} onChange={(configParams) => patch({ configParams })} refs={refs} />
    </>
  );
}