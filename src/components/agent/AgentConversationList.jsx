import React from 'react';
import { Plus, MessageSquare } from 'lucide-react';

export default function AgentConversationList({ conversations, activeId, onSelect, onCreate, onRename }) {
  return (
    <div className="border-b border-[#2A2E37]">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">会话</span>
        <button onClick={onCreate} className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white">
          <Plus className="w-3 h-3" />新建
        </button>
      </div>
      <div className="max-h-32 overflow-y-auto">
        {conversations.length === 0 && (
          <div className="px-2 pb-2 text-[10px] text-gray-600">还没有会话，点「新建」开始。</div>
        )}
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-[11px] ${c.id === activeId ? 'bg-[#242a32] text-gray-100' : 'text-gray-400 hover:bg-[#171b21]'}`}
            onClick={() => onSelect(c.id)}
          >
            <MessageSquare className="w-3 h-3 shrink-0" />
            <span className="truncate flex-1">{c.metadata?.name || '未命名会话'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onRename(c); }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-200"
              title="重命名"
            >
              <span className="text-[10px]">改名</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}