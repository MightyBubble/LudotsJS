import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function ExampleConfigPanel({ example }) {
  if (!example) return null;
  return <details className="group mb-3 min-w-0 rounded border border-border bg-card">
    <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs text-card-foreground">
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
      <span className="font-semibold">示例配置 · {example.title}</span>
      <span className="ml-auto hidden text-muted-foreground sm:inline">点击展开</span>
    </summary>
    <div className="border-t border-border p-3">
      <p className="mb-3 text-xs leading-5 text-muted-foreground">配置后可获得：{example.result}</p>
      <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded border border-border bg-background p-3 font-mono text-[11px] leading-5 text-foreground">{JSON.stringify(example.config, null, 2)}</pre>
    </div>
  </details>;
}