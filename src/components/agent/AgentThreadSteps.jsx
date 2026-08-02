import React, { useState } from 'react';
import { ChevronRight, Wrench } from 'lucide-react';

export default function AgentThreadSteps({ steps = [] }) {
  const [open, setOpen] = useState(null);
  const toolSteps = steps.filter((s) => s.kind === 'tool');
  if (!toolSteps.length) return null;

  return (
    <div className="space-y-1 mb-1.5">
      {toolSteps.map((s, i) => (
        <div key={i} className="bg-[#0D0F14] border border-[#2A2E37] rounded">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center gap-1.5 px-2 py-1 text-[10px] text-gray-400"
          >
            <Wrench className="w-3 h-3" />
            <span className="font-mono">{s.tool}</span>
            <span className="truncate flex-1 text-left text-gray-600">{s.thought}</span>
            <ChevronRight className={`w-3 h-3 transition-transform ${open === i ? 'rotate-90' : ''}`} />
          </button>
          {open === i && (
            <pre className="px-2 pb-1.5 text-[10px] text-gray-500 whitespace-pre-wrap break-all">
{JSON.stringify(s.args, null, 2)}{'\n→ '}{s.observation}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}