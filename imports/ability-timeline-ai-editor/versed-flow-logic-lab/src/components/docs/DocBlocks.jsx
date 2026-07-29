import React from 'react';

// 文档积木：配置表（配置项 / 编辑器输入 / 得到的游戏行为）与食谱卡（怎么配 → 玩起来是什么）
export function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
      {children}
    </div>
  );
}

export function ConfigTable({ rows }) {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="grid grid-cols-[130px_1fr_1.3fr] bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-slate-500">
        <span>配置项</span><span>编辑器输入</span><span>得到的游戏行为</span>
      </div>
      {rows.map(([field, input, result], i) => (
        <div key={i} className="grid grid-cols-[130px_1fr_1.3fr] px-3 py-2 border-t border-slate-100 text-[11px] leading-5">
          <span className="font-mono font-bold text-pink-600 pr-2">{field}</span>
          <span className="text-slate-500 pr-3">{input}</span>
          <span className="text-slate-700">{result}</span>
        </div>
      ))}
    </div>
  );
}

export function Recipe({ title, config, result }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3.5">
      <div className="text-[12px] font-bold text-slate-800 mb-2">{title}</div>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {config.map((c, i) => (
          <span key={i} className="text-[10px] rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5">
            <b className="text-amber-600">{c.at}</b>
            <span className="font-mono text-slate-600"> · {c.set}</span>
          </span>
        ))}
      </div>
      <div className="text-[11px] leading-5 text-slate-600 border-l-2 border-primary/60 pl-2.5">{result}</div>
    </div>
  );
}