import React from 'react';
import { Sparkles } from 'lucide-react';
export default function QuarksEmitterList({ emitters, selectedUuid, onSelect }) {
  return <aside className="w-full shrink-0 border-b border-[#2A2E37] bg-[#15171C] p-2 md:w-48 md:border-b-0 md:border-r"><div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">发射器</div>{emitters.map(item => <button key={item.uuid} onClick={() => onSelect(item.uuid)} className={`mb-1 flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs ${item.uuid === selectedUuid ? 'bg-[#B9C2CC] text-black' : 'text-gray-300 hover:bg-[#242A32]'}`}><Sparkles className="h-3 w-3"/><span className="truncate">{item.name}</span></button>)}</aside>;
}