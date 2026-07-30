import React from 'react';

export default function AbilityFieldDomain({ title, meta, description, children }) {
  return <section className="rounded-md border border-[#2A2E37] bg-[#15171C]">
    <header className="border-b border-[#2A2E37] px-3 py-2">
      <div className="flex items-baseline gap-2"><h4 className="text-[11px] font-semibold text-[#E2D8B3]">{title}</h4><span className="text-[9px] uppercase tracking-wider text-muted-foreground">{meta}</span></div>
      {description && <p className="mt-0.5 text-[10px] text-muted-foreground">{description}</p>}
    </header>
    <div className="grid gap-3 p-3 md:grid-cols-2">{children}</div>
  </section>;
}