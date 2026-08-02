import React from 'react';
import { Play, Pause, Trash2 } from 'lucide-react';

export default function PlaygroundToolbar({ paused, onToggle, onClear, count, elapsed, templateName }) {
  return (
    <div className="h-11 shrink-0 border-b border-[#2A2E37] bg-[#15171C] flex items-center gap-2 px-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242a32] border border-[#424a55] text-[11px] text-gray-200 hover:bg-[#303845]"
      >
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        {paused ? '播放' : '暂停'}
      </button>
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242a32] border border-[#424a55] text-[11px] text-gray-200 hover:bg-[#303845]"
      >
        <Trash2 className="w-3.5 h-3.5" />清空
      </button>
      <span className="ml-auto text-[10px] text-gray-500">
        {templateName ? `待放置：${templateName}` : '未选择模板'} · 实体 {count} · 时间 {elapsed.toFixed(1)}s
      </span>
    </div>
  );
}