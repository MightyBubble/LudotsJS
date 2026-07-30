import React from 'react';
import { Clock3, Crosshair, Fingerprint, Palette, ShieldCheck, Workflow } from 'lucide-react';

const DOMAINS = [
  { id: 'identity', label: '基础标识', meta: 'Identity', icon: Fingerprint },
  { id: 'execution', label: '执行编排', meta: 'Exec & Clips', icon: Workflow },
  { id: 'rules', label: '激活规则', meta: 'Rules', icon: Clock3 },
  { id: 'targeting', label: '目标与输入', meta: 'Target & Input', icon: Crosshair },
  { id: 'presentation', label: '表现', meta: 'Presentation', icon: Palette },
  { id: 'validation', label: '校验', meta: 'Validation', icon: ShieldCheck },
];

export default function AbilityDomainTabs({ value, onChange, issueCount }) {
  return <div className="sticky top-0 z-20 mb-4 flex gap-1 overflow-x-auto rounded-lg border border-[#2A2E37] bg-[#0D0F14]/95 p-1 shadow-lg backdrop-blur">
    {DOMAINS.map(({ id, label, meta, icon: Icon }) => <button key={id} onClick={() => onChange(id)} className={`flex min-w-max items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${value === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}>
      <Icon className="h-4 w-4" />
      <span><span className="block text-[11px] font-semibold">{label}{id === 'validation' && issueCount ? ` · ${issueCount}` : ''}</span><span className="block text-[9px] opacity-60">{meta}</span></span>
    </button>)}
  </div>;
}