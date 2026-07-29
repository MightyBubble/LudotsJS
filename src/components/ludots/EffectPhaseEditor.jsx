import React from 'react';
import { Section } from './ui';
import EffectPhaseRow from './EffectPhaseRow';
import { EFFECT_PHASES, EFFECT_PRESETS } from './effectPresetDefinitions';

export default function EffectPhaseEditor({ draft, patch, refs }) {
  const handlers = (EFFECT_PRESETS[draft.presetType] || EFFECT_PRESETS.None).handlers;
  const update = (phase, config) => {
    const phaseGraphs = { ...(draft.phaseGraphs || {}) };
    const clean = { ...(config.pre ? { pre: config.pre } : {}), ...(config.post ? { post: config.post } : {}), ...(config.skipMain ? { skipMain: true } : {}) };
    if (Object.keys(clean).length) phaseGraphs[phase] = clean; else delete phaseGraphs[phase];
    patch({ phaseGraphs });
  };
  return (
    <Section title="Runtime Phase Pipeline · Pre → Main → Post → Listeners">
      <p className="text-[11px] text-gray-500">Main 由 preset_types.json 决定；Pre/Post 引用 ActionGraph，Skip Main 可完全接管该阶段。</p>
      <div className="space-y-2">{EFFECT_PHASES.map(phase => <EffectPhaseRow key={phase} phase={phase} config={draft.phaseGraphs?.[phase] || {}} handler={handlers[phase]} onChange={(config) => update(phase, config)} graphs={refs.actionGraphs} />)}</div>
    </Section>
  );
}