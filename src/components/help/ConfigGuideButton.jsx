import React from 'react';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function ConfigGuideButton({ guide }) {
  return <Dialog>
    <DialogTrigger asChild><button type="button" aria-label={`${guide.title}说明`} title={`${guide.title}说明`} className="flex h-8 w-8 items-center justify-center rounded border border-border bg-secondary text-secondary-foreground hover:bg-accent"><Info className="h-4 w-4" /></button></DialogTrigger>
    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto bg-popover text-popover-foreground">
      <DialogHeader><DialogTitle>{guide.title}</DialogTitle><DialogDescription className="leading-6">{guide.description}</DialogDescription></DialogHeader>
      <div><h3 className="mb-2 text-sm font-semibold">主要作用</h3><ul className="space-y-1 text-sm text-muted-foreground">{guide.points.map(point => <li key={point}>• {point}</li>)}</ul></div>
      <div><h3 className="mb-2 text-sm font-semibold">示例配置</h3><pre className="overflow-x-auto rounded border border-border bg-background p-3 text-xs leading-5 text-foreground">{JSON.stringify(guide.example, null, 2)}</pre></div>
    </DialogContent>
  </Dialog>;
}