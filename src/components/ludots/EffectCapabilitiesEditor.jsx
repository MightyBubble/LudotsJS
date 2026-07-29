import React from 'react';
import EffectObjectListEditor from './EffectObjectListEditor';
import EffectObjectMapEditor from './EffectObjectMapEditor';
import { CONFIG_PARAM_FIELDS, GRANTED_TAG_FIELDS, PHASE_GRAPH_FIELDS, PHASE_LISTENER_FIELDS } from './effectConfigFields';

export default function EffectCapabilitiesEditor({ draft, patch, refs }) {
  return (
    <>
      <EffectObjectMapEditor title="阶段图 phaseGraphs" value={draft.phaseGraphs || {}} fields={PHASE_GRAPH_FIELDS} onChange={(phaseGraphs) => patch({ phaseGraphs })} refs={refs} />
      <EffectObjectListEditor title="阶段监听 phaseListeners" value={draft.phaseListeners || []} fields={PHASE_LISTENER_FIELDS} onChange={(phaseListeners) => patch({ phaseListeners })} refs={refs} />
      <EffectObjectMapEditor title="配置参数 configParams" value={draft.configParams || {}} fields={CONFIG_PARAM_FIELDS} onChange={(configParams) => patch({ configParams })} refs={refs} />
      <EffectObjectListEditor title="授予标签 grantedTags" value={draft.grantedTags || []} fields={GRANTED_TAG_FIELDS} onChange={(grantedTags) => patch({ grantedTags })} refs={refs} />
    </>
  );
}