import React from 'react';
import { Section, TextField, NumberField, BoolField, ListField } from '@/components/ludots/ui';
import VectorField from './VectorField';
import PerformerBehaviorList from './PerformerBehaviorList';
import PerformerParamsSection from './PerformerParamsSection';
import PerformerRulesSection from './PerformerRulesSection';

export default function PerformerDetails({ draft, patch }) {
  return <div className="space-y-4">
    <Section title="基础信息">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <TextField label="Performer ID" value={draft.performer_id} onChange={performer_id => patch({ performer_id })} />
        <TextField label="名称（不导出）" value={draft.label} onChange={label => patch({ label })} />
        <TextField label="Extends" hint="继承的 performer id" value={draft.extends} onChange={v => patch({ extends: v })} />
      </div>
      <TextField label="说明（不导出）" value={draft.description} onChange={description => patch({ description })} />
    </Section>

    <Section title="默认表现参数">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NumberField label="defaultLifetime (秒)" value={draft.default_lifetime} onChange={default_lifetime => patch({ default_lifetime })} />
        <NumberField label="defaultFontSize" value={draft.default_font_size} onChange={default_font_size => patch({ default_font_size })} />
        <NumberField label="positionYDriftPerSecond" value={draft.position_y_drift_per_second} onChange={position_y_drift_per_second => patch({ position_y_drift_per_second })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <VectorField label="defaultColor (RGBA)" length={4} value={draft.default_color} onChange={default_color => patch({ default_color })} />
        <VectorField label="positionOffset (XYZ)" length={3} value={draft.position_offset} onChange={position_offset => patch({ position_offset })} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <TextField label="worldTextMode" value={draft.world_text_mode} onChange={world_text_mode => patch({ world_text_mode })} />
        <TextField label="visibility.inline" hint="None / ..." value={draft.visibility_inline} onChange={visibility_inline => patch({ visibility_inline })} />
        <NumberField label="visibility.graphProgramId" value={draft.visibility_graph_program_id} onChange={visibility_graph_program_id => patch({ visibility_graph_program_id })} />
        <div className="pt-5"><BoolField label="alphaFadeOverLifetime" value={Boolean(draft.alpha_fade_over_lifetime)} onChange={alpha_fade_over_lifetime => patch({ alpha_fade_over_lifetime })} /></div>
      </div>
      <ListField label="children（子 performer id）" value={draft.children} onChange={children => patch({ children })} />
    </Section>

    <PerformerBehaviorList behaviors={draft.behaviors} onChange={behaviors => patch({ behaviors })} />
    <PerformerParamsSection
      paramDefaults={draft.paramDefaults}
      bindings={draft.bindings}
      onChangeParams={paramDefaults => patch({ paramDefaults })}
      onChangeBindings={bindings => patch({ bindings })}
    />
    <PerformerRulesSection rules={draft.rules} onChange={rules => patch({ rules })} />
  </div>;
}