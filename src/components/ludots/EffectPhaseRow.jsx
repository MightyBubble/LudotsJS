import React from 'react';
import { BoolField } from './ui';
import EffectGraphSelect from './EffectGraphSelect';

const DESCRIPTIONS = {
  OnPropose: '进入 Proposal，ResponseChain 之前', OnCalculate: 'ResponseChain 收敛后计算 Modifier',
  OnResolve: '解析候选目标', OnHit: '逐目标命中校验', OnApply: '应用到有效目标',
  OnPeriod: '持续效果周期 Tick', OnExpire: '自然到期', OnRemove: '强制移除',
};

export default function EffectPhaseRow({ phase, config, handler, onChange, graphs }) {
  const mainLabel = handler ? `${handler.type === 'builtin' ? 'Builtin' : 'Graph'} · ${handler.id}` : 'None';
  return (
    <div className="grid gap-3 border border-[#2A2E37] rounded p-3 md:grid-cols-[140px_1fr_180px_1fr]">
      <div><div className="text-xs font-semibold text-[#E2D8B3]">{phase}</div><div className="text-[10px] text-gray-500 mt-1">{DESCRIPTIONS[phase]}</div></div>
      <EffectGraphSelect label="Pre Graph" value={config.pre} onChange={(pre) => onChange({ ...config, pre })} graphs={graphs} />
      <div><div className="text-[11px] text-gray-400 mb-1">Main（Preset）</div><div className={`h-8 px-2 rounded border flex items-center text-[11px] ${handler ? 'border-[#59616d] bg-[#242a32] text-[#dce2e8]' : 'border-[#2A2E37] text-gray-600'}`}>{mainLabel}</div><BoolField label="Skip Main" value={config.skipMain} onChange={(skipMain) => onChange({ ...config, skipMain })} /></div>
      <EffectGraphSelect label="Post Graph" value={config.post} onChange={(post) => onChange({ ...config, post })} graphs={graphs} />
    </div>
  );
}