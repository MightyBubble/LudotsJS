import React from 'react';
import { Workflow } from 'lucide-react';
import RuntimeDock from './RuntimeDock';

export default function RuntimeTraceDock({ trace = [], onClose }) {
  return <RuntimeDock title="Resolution Trace" icon={Workflow} onClose={onClose} className="w-64 shrink-0 max-lg:hidden"><ol className="p-2">{trace.map((line, index) => <li key={`${line}-${index}`} className="relative border-l border-border pb-3 pl-4 text-[10px] text-muted-foreground before:absolute before:-left-1 before:top-1 before:h-2 before:w-2 before:rounded-full before:bg-primary"><span className="mr-1 font-mono text-foreground">{index + 1}.</span>{line}</li>)}</ol></RuntimeDock>;
}