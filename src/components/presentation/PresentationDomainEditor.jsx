import React from 'react';
import { Link } from 'react-router-dom';

export default function PresentationDomainEditor({ tabs, active, children }) {
  return (
    <div className="h-full min-h-0 flex flex-col bg-[#0D0F14]">
      <div className="shrink-0 flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[#2A2E37] bg-[#15171C]">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            to={tab.to}
            className={`px-3 py-1.5 rounded text-xs ${tab.value === active
              ? 'bg-[#D97706] text-black'
              : 'text-gray-400 hover:bg-[#1E2128] hover:text-gray-200'}`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}