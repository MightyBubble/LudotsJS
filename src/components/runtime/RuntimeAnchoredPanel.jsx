import React from 'react';
import RuntimePanelView from '@/components/runtime/RuntimePanelView';
import RuntimeEntityPanelView from '@/components/runtime/RuntimeEntityPanelView';

export const positionStyle = anchor => {
  const horizontal = anchor?.horizontal || 'right', vertical = anchor?.vertical || 'bottom';
  const x = Number(anchor?.offsetX) || 0, y = Number(anchor?.offsetY) || 0;
  return {
    ...(horizontal === 'center' ? { left: `calc(50% + ${x}px)` } : { [horizontal]: x }),
    ...(vertical === 'center' ? { top: `calc(50% + ${y}px)` } : { [vertical]: y }),
    transform: `${horizontal === 'center' ? 'translateX(-50%) ' : ''}${vertical === 'center' ? 'translateY(-50%)' : ''}`.trim() || undefined,
  };
};

export default function RuntimeAnchoredPanel({ panel, profile, result, log }) {
  return <section data-testid={`runtime-panel-${panel.instanceKey}`} className="pointer-events-auto absolute w-80 rounded border border-[#424a55] bg-[#15171C]/95 shadow-xl" style={positionStyle(panel.anchor)}>
    <header className="border-b border-[#424a55] px-3 py-2 text-[11px] font-semibold text-gray-200">{profile?.label || profile?.panel_id || panel.instanceKey}</header>
    <div className="p-2">{!result ? <p className="text-[11px] text-red-300">Profile 不存在：{panel.profileId}</p> : panel.kind === 'command'
      ? <RuntimePanelView result={result} onActivate={button => log.info('intent', `激活 ${button.ability_id}`, button)} />
      : <RuntimeEntityPanelView result={result} />}</div>
  </section>;
}