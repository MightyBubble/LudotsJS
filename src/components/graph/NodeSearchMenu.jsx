import React, { useState, useMemo, useEffect, useRef } from 'react';
import { getAvailableNodes } from './nodeConfigs';

export default function NodeSearchMenu({ x, y, graphType = 'data', onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const nodes = useMemo(() => {
    const all = getAvailableNodes(graphType);
    const q = search.trim().toLowerCase();
    return q ? all.filter(n => n.label.toLowerCase().includes(q) || n.type.includes(q)) : all;
  }, [graphType, search]);

  const categories = useMemo(() => [...new Set(nodes.map(n => n.category))], [nodes]);

  const left = Math.min(x, window.innerWidth - 240);
  const top = Math.min(y, window.innerHeight - 340);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <div
        className="fixed z-50 w-56 bg-[#15171C] border border-[#2A2E37] rounded shadow-2xl flex flex-col max-h-80"
        style={{ left, top }}
      >
        <div className="p-1.5 border-b border-[#2A2E37]">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索节点..."
            className="w-full h-7 px-2 bg-[#0D0F14] border border-[#2A2E37] rounded text-xs text-[#e5e5e5] outline-none focus:border-[#D97706]"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-2">
          {categories.length === 0 && <div className="text-[11px] text-gray-600 px-1 py-2">无匹配节点</div>}
          {categories.map(category => (
            <div key={category}>
              <div className="text-[10px] font-semibold text-gray-500 mb-1 px-1">{category}</div>
              <div className="space-y-0.5">
                {nodes.filter(n => n.category === category).map(nodeType => {
                  const Icon = nodeType.icon;
                  return (
                    <button
                      key={nodeType.type}
                      onClick={() => { onAdd(nodeType.type); onClose(); }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-colors hover:bg-[#262626] border-l-2 border-[#2A2E37] hover:border-[#D97706]"
                    >
                      <Icon className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] text-[#e5e5e5]">{nodeType.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}