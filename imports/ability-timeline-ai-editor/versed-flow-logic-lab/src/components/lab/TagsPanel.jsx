import React from 'react';

// Live gameplay tags (GAS-style)
export default function TagsPanel({ tags }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-500">Gameplay Tags</div>
      {tags.length === 0 ? (
        <div className="h-7 rounded-md border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300">
          无激活标签
        </div>
      ) : (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <span key={t} className="rounded bg-slate-800 text-white px-1.5 py-0.5 text-[10px] font-mono">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}