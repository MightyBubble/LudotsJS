import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const COLORS = { info: 'text-gray-300', warn: 'text-amber-400', error: 'text-red-400' };

/** 运行时控制台：订阅 runtime 日志总线。 */
export default function RuntimeConsole({ log }) {
  const [entries, setEntries] = useState([]);
  useEffect(() => log.subscribe(setEntries), [log]);

  return (
    <div className="bg-[#0D0F14] border border-[#2A2E37] rounded flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2E37]">
        <span className="text-xs font-semibold text-[#E2D8B3]">Runtime Console</span>
        <Button variant="outline" onClick={() => log.clear()} className="h-6 text-[10px] px-2">清空</Button>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-2 space-y-0.5 font-mono">
        {entries.length === 0 && <p className="text-[10px] text-gray-600">暂无日志。</p>}
        {entries.map(e => (
          <div key={e.id} className={`text-[10px] ${COLORS[e.level] || 'text-gray-300'}`}>
            <span className="text-gray-600">[{new Date(e.at).toLocaleTimeString()}] [{e.channel}] </span>
            {e.message}
          </div>
        ))}
      </div>
    </div>
  );
}