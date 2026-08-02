import React from 'react';
import { Play, Pause, Square, Trash2 } from 'lucide-react';
import MapSelector from './MapSelector';
import ParticipantViewSelector from './ParticipantViewSelector';

export default function PlaygroundToolbar({ maps, mapId, onMap, mapEntityCount, paused, onToggle, onEnd, onClear, count, elapsed, templateName, participantView, lifecycle }) {
  return (
    <div className="h-11 shrink-0 border-b border-[#2A2E37] bg-[#15171C] flex items-center gap-2 px-3 overflow-x-auto">
      <MapSelector maps={maps} mapId={mapId} onChange={onMap} />
      <button onClick={onToggle} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242a32] border border-[#424a55] text-[11px] text-gray-200 hover:bg-[#303845]">
        {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}{paused ? '播放' : '暂停'}
      </button>
      <button onClick={onEnd} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242a32] border border-[#424a55] text-[11px] text-gray-200 hover:bg-[#303845]">
        <Square className="w-3.5 h-3.5" />结束
      </button>
      <button onClick={onClear} className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#242a32] border border-[#424a55] text-[11px] text-gray-200 hover:bg-[#303845]">
        <Trash2 className="w-3.5 h-3.5" />清空
      </button>
      <ParticipantViewSelector {...participantView} />
      <span className="ml-auto text-[10px] text-gray-500 whitespace-nowrap">
        生命周期 {lifecycle.status} · 蓝图 {lifecycle.blueprintCount}{lifecycle.lastAction ? ` · Action ${lifecycle.lastAction}` : ''}{lifecycle.lastVariableWrites?.length ? ` · 写入 ${lifecycle.lastVariableWrites.join(', ')}` : ''}{lifecycle.lastLogs?.length ? ` · 日志 ${lifecycle.lastLogs.length}` : ''}{lifecycle.lastLog ? ` · Log ${lifecycle.lastLog}` : ''} · {templateName ? `待放置：${templateName}` : '未选择模板'} · 地图实体 {mapEntityCount} · 临时实体 {count} · 时间 {elapsed.toFixed(1)}s
      </span>
    </div>
  );
}