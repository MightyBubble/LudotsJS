import React from 'react';

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'data', label: '数据图' },
  { key: 'query', label: '查询图' },
  { key: 'function', label: '纯函数图' },
  { key: 'action', label: '动作图' },
];

export default function GraphTypeTabs({ value, onChange, counts = {} }) {
  return (
    <div className="h-9 bg-[#0D0F14] border-b border-[#2A2E37] flex items-center px-2 md:px-4 gap-1 overflow-x-auto">
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
            value === t.key
              ? 'bg-[#2A2E37] text-[#D97706] font-medium'
              : 'text-gray-500 hover:text-gray-300 hover:bg-[#15171C]'
          }`}
        >
          {t.label}
          <span className="ml-1.5 text-[10px] text-gray-600">{counts[t.key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}