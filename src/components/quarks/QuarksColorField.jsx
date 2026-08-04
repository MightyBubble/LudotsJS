import React from 'react';
const channelHex = value => Math.round(Math.max(0, Math.min(1, value ?? 1)) * 255).toString(16).padStart(2, '0');
export default function QuarksColorField({ value, onChange }) {
  const color = value?.color || { r: 1, g: 1, b: 1, a: 1 };
  const hex = `#${channelHex(color.r)}${channelHex(color.g)}${channelHex(color.b)}`;
  const setHex = next => onChange({ type: 'ConstantColor', color: { ...color, r: parseInt(next.slice(1,3),16)/255, g: parseInt(next.slice(3,5),16)/255, b: parseInt(next.slice(5,7),16)/255 } });
  return <div className="space-y-1"><label className="text-[10px] text-gray-400">初始颜色</label><div className="flex gap-2"><input aria-label="初始颜色" type="color" value={hex} onChange={e => setHex(e.target.value)} className="h-8 w-12 rounded border border-[#424A55] bg-[#0D0F14] p-1"/><label className="flex flex-1 items-center gap-2 text-[10px] text-gray-400">透明度<input aria-label="初始透明度" type="number" min="0" max="1" step="0.05" value={color.a ?? 1} onChange={e => onChange({ type: 'ConstantColor', color: { ...color, a: Number(e.target.value) } })} className="h-8 min-w-0 flex-1 rounded border border-[#424A55] bg-[#0D0F14] px-2 text-xs"/></label></div></div>;
}