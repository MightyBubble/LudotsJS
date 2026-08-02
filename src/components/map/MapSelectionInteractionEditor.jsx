import React from 'react';
import { BoolField, Field, SelectField, Section } from '@/components/ludots/ui';

const MODES = [
  ['screen_box', '屏幕 Box'], ['screen_lasso', '屏幕画线'],
  ['world_box', '世界 Box'], ['world_lasso', '世界画线'],
];
const defaults = { enabled: false, default_mode: 'screen_box', modes: {} };

export default function MapSelectionInteractionEditor({ value, onChange }) {
  const config = { ...defaults, ...(value || {}), modes: value?.modes || {} };
  const patchMode = (key, update) => onChange({ ...config, modes: { ...config.modes, [key]: { enabled: true, stroke_color: '#7DD3FC', fill_color: '#38BDF833', line_width: 2, ...(config.modes[key] || {}), ...update } } });
  return <Section title="框选交互视觉">
    <BoolField label="启用地图框选交互" value={config.enabled} onChange={enabled => onChange({ ...config, enabled })} />
    <SelectField label="默认交互" value={config.default_mode} options={MODES.map(([value, label]) => ({ value, label }))} onChange={default_mode => onChange({ ...config, default_mode })} />
    <div className="grid gap-3 md:grid-cols-2">{MODES.map(([key, label]) => {
      const style = { enabled: true, stroke_color: '#7DD3FC', fill_color: '#38BDF833', line_width: 2, ...(config.modes[key] || {}) };
      return <div key={key} className="rounded border border-[#2A2E37] p-2 space-y-2">
        <BoolField label={label} value={style.enabled} onChange={enabled => patchMode(key, { enabled })} />
        <Field label="描边 / 填充"><div className="flex gap-2"><input aria-label={`${label}描边`} type="color" value={style.stroke_color.slice(0, 7)} onChange={event => patchMode(key, { stroke_color: event.target.value })} /><input aria-label={`${label}填充`} type="color" value={style.fill_color.slice(0, 7)} onChange={event => patchMode(key, { fill_color: `${event.target.value}33` })} /></div></Field>
      </div>;
    })}</div>
  </Section>;
}