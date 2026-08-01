import React from 'react';
import { Terminal } from 'lucide-react';
import RuntimeDock from './RuntimeDock';

export default function RuntimeConsoleDock({ events, onClose }) {
  return <RuntimeDock title="Runtime Console" icon={Terminal} onClose={onClose} className="h-36 shrink-0"><div className="font-mono">{events.length ? events.map((event, index) => <div key={index} className="grid grid-cols-[70px_1fr] border-b border-border/60 px-2 py-1 text-[10px]"><span className="text-muted-foreground">{event.time}</span><span>{event.message}</span></div>) : <p className="p-3 text-[10px] text-muted-foreground">等待 Runtime 事件。</p>}</div></RuntimeDock>;
}