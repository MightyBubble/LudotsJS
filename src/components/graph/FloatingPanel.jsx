import React from 'react';
import { X } from 'lucide-react';

export default function FloatingPanel({ title, icon: Icon, onClose, className = '', children }) {
  return (
    <div
      className={`absolute z-30 w-72 max-h-[calc(100%-2rem)] flex flex-col bg-[#15171C]/95 backdrop-blur-sm border border-[#2A2E37] rounded-lg shadow-2xl overflow-hidden ${className}`}
      onContextMenu={(e) => e.stopPropagation()}
    >
      <div className="h-8 flex items-center gap-2 px-2.5 border-b border-[#2A2E37] bg-[#0D0F14]/60 shrink-0">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#D97706]" />}
        <span className="text-xs font-semibold text-[#e5e5e5] flex-1">{title}</span>
        <button onClick={onClose} className="text-gray-500 hover:text-[#e5e5e5] transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
    </div>
  );
}