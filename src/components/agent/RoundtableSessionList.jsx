import React from 'react';
import { Plus, MessagesSquare, Trash2 } from 'lucide-react';

export default function RoundtableSessionList({ sessions, activeId, onSelect, onCreate, onDelete }) {
  return (
    <div className="border-b border-[#2A2E37]">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-gray-500">圆桌会话</span>
        <button onClick={onCreate} className="flex items-center gap-1 text-[10px] text-gray-300 hover:text-white">
          <Plus className="w-3 h-3" />新建
        </button>
      </div>
      <div className="max-h-28 overflow-y-auto">
        {sessions.length === 0 && (
          <div className="px-2 pb-2 text-[10px] text-gray-600">还没有会话，提出议题后会自动保存。</div>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer text-[11px] ${s.id === activeId ? 'bg-[#242a32] text-gray-100' : 'text-gray-400 hover:bg-[#171b21]'}`}
          >
            <MessagesSquare className="w-3 h-3 shrink-0" />
            <span className="truncate flex-1">{s.title || '未命名会话'}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(s); }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
              title="删除会话"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}