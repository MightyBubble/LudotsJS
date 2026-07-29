import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// 右栏分组卡片：金色小标题 + 可折叠
export default function LabSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 rounded-t-lg"
      >
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-amber-400">{title}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="px-3 pb-3 space-y-3 border-t border-slate-100 pt-3">{children}</div>}
    </div>
  );
}