import React from 'react';
import { Info } from 'lucide-react';

export default function ConfigGuideButton({ guide, open, onToggle }) {
  return <button type="button" onClick={onToggle} aria-pressed={open} aria-label={`${guide.title}字段说明`} title={`${guide.title}字段说明`} className={`flex h-8 w-8 items-center justify-center rounded border text-secondary-foreground hover:bg-accent ${open ? 'border-primary bg-accent' : 'border-border bg-secondary'}`}><Info className="h-4 w-4" /></button>;
}