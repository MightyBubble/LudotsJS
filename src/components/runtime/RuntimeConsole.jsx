import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const COLORS = { info: 'text-gray-300', warn: 'text-amber-400', error: 'text-red-400' };

/** 运行时控制台：订阅 runtime 日志总线。 */
export default function RuntimeConsole({ log, embedded = false }) {
  const [entries, setEntries] = useState([]);
  useEffect(() => log.subscribe(setEntries), [log]);
  const stream = <div className="flex-1 min-h-0 overflow-auto p-2 space-y-0.5 font-mono">
    {entries.length === 0 && <p className="text-[10px] text-gray-600">暂无日志。</p>}
    {entries.map(entry => <div key={entry.id} className={`text-[10px] ${COLORS[entry.level] || 'text-gray-300'}`}>
      <span className="text-gray-600">[{new Date(entry.at).toLocaleTimeString()}] [{entry.channel}] </span>{entry.message}
    </div>)}
  </div>;
  if (embedded) return <div className="flex h-full min-h-0 flex-col bg-[#0D0F14]">
    <div className="flex justify-end border-b border-[#2A2E37] px-2 py-1"><Button variant="outline" onClick={() => log.clear()} className="h-6 px-2 text-[10px]">清空</Button></div>
    {stream}
  </div>;
  return <div className="bg-[#0D0F14] border border-[#2A2E37] rounded flex flex-col h-full min-h-0">
    <div className="flex items-center justify-between px-3 py-2 border-b border-[#2A2E37]"><span className="text-xs font-semibold text-[#E2D8B3]">Runtime Console</span><Button variant="outline" onClick={() => log.clear()} className="h-6 text-[10px] px-2">清空</Button></div>
    {stream}
  </div>;
}