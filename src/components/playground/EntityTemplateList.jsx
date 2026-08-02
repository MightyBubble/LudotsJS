import React from 'react';
import { Boxes } from 'lucide-react';

export default function EntityTemplateList({ templates, selectedId, onSelect }) {
  return (
    <aside className="w-56 shrink-0 border-r border-[#2A2E37] bg-[#15171C] flex flex-col min-h-0">
      <div className="px-3 py-2 border-b border-[#2A2E37] text-[10px] uppercase tracking-wider text-gray-500">
        实体模板
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {templates.length === 0 && (
          <p className="px-3 py-2 text-[11px] text-gray-600">还没有实体原型。</p>
        )}
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id === selectedId ? '' : t.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] border-b border-[#2A2E37] ${
              t.id === selectedId ? 'bg-[#242a32] text-gray-100' : 'text-gray-400 hover:bg-[#171b21]'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {t.name || t.prototype_id}
              <span className="block text-[10px] text-gray-600 truncate">{t.prototype_id}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="px-3 py-2 border-t border-[#2A2E37] text-[10px] text-gray-600">
        选中模板后在场景中点击即可放置。
      </div>
    </aside>
  );
}