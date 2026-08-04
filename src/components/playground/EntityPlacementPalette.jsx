import React from 'react';
import { Boxes } from 'lucide-react';

export default function EntityPlacementPalette({ templates, selectedId, onSelect }) {
  return <div className="flex h-full min-h-0 flex-col">
    <div className="flex-1 min-h-0 overflow-y-auto">
      {templates.length === 0 && <p className="px-3 py-2 text-[11px] text-gray-600">还没有实体原型。</p>}
      {templates.map(template => <button
        key={template.id}
        type="button"
        onClick={() => onSelect(template.id === selectedId ? '' : template.id)}
        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] border-b border-[#2A2E37] ${template.id === selectedId ? 'bg-[#242a32] text-gray-100' : 'text-gray-400 hover:bg-[#171b21]'}`}
      >
        <Boxes className="w-3.5 h-3.5 shrink-0" />
        <span className="min-w-0 truncate">{template.name || template.prototype_id}<span className="block truncate text-[10px] text-gray-600">{template.prototype_id}</span></span>
      </button>)}
    </div>
    <p className="shrink-0 border-t border-[#2A2E37] px-3 py-2 text-[10px] text-gray-600">选中模板后在场景中点击即可放置。</p>
  </div>;
}