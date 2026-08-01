import React from 'react';
import { X } from 'lucide-react';

export default function RuntimeDock({ title, icon: Icon, onClose, children, className = '' }) {
  return <section className={`min-h-0 border border-border bg-card text-card-foreground ${className}`}>
    <header className="flex h-8 items-center gap-2 border-b border-border bg-muted px-2">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <h2 className="flex-1 text-[11px] font-semibold uppercase tracking-wide">{title}</h2>
      {onClose && <button aria-label={`关闭${title}`} onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"><X className="h-3 w-3" /></button>}
    </header>
    <div className="h-[calc(100%-2rem)] min-h-0 overflow-auto">{children}</div>
  </section>;
}