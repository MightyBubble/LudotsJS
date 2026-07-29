import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { Section } from './ui';
import { buildRuntimeFiles, downloadRuntimeJson } from '@/lib/runtime/ludotsRuntimeExport';

export default function RuntimeExportPanel({ effects, actionGraphs }) {
  const runtime = useMemo(() => buildRuntimeFiles(effects, actionGraphs), [effects, actionGraphs]);
  const blocked = runtime.errors.length > 0;
  const buttonClass = 'h-7 px-2.5 inline-flex items-center gap-1.5 rounded border border-[#424a55] bg-[#242a32] text-[11px] text-gray-200 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <Section title="C# Runtime Export · 严格契约">
      <div className="flex flex-wrap items-center gap-2">
        <button className={buttonClass} disabled={blocked} onClick={() => downloadRuntimeJson('effects.json', runtime.effects)}><Download className="h-3.5 w-3.5" />effects.json</button>
        <button className={buttonClass} disabled={blocked} onClick={() => downloadRuntimeJson('graphs.json', runtime.graphs)}><Download className="h-3.5 w-3.5" />graphs.json</button>
        <span className={`text-[11px] ${blocked ? 'text-red-400' : 'text-green-500'}`}>{blocked ? `阻止导出 · ${runtime.errors.length} 项不兼容` : `${runtime.effects.length} Effects · ${runtime.graphs.length} Graphs · 可直接交给 C# Loader`}</span>
      </div>
      {blocked && <div className="mt-2 max-h-28 space-y-1 overflow-y-auto">{runtime.errors.map((error, index) => <p key={`${error}-${index}`} className="font-mono text-[10px] text-red-400">{error}</p>)}</div>}
    </Section>
  );
}