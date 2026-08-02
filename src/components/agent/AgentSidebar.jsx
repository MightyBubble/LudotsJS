import React, { useState } from 'react';
import { Bot, X, Users } from 'lucide-react';
import AgentChat from './AgentChat';
import ModelRoundtable from './ModelRoundtable';

export default function AgentSidebar() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('agent');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="配置助手"
        className="fixed right-3 bottom-3 z-40 w-10 h-10 rounded-full bg-[#242a32] border border-[#424a55] text-gray-200 flex items-center justify-center hover:bg-[#303845]"
      >
        <Bot className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="w-[360px] max-w-full shrink-0 h-full border-l border-[#2A2E37] bg-[#15171C] flex flex-col min-h-0">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#2A2E37]">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('agent')}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded ${tab === 'agent' ? 'bg-[#242a32] text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Bot className="w-3 h-3" />配置助手
          </button>
          <button
            onClick={() => setTab('roundtable')}
            className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded ${tab === 'roundtable' ? 'bg-[#242a32] text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Users className="w-3 h-3" />模型圆桌
          </button>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-200">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'agent' ? <AgentChat /> : <ModelRoundtable />}
      </div>
    </div>
  );
}