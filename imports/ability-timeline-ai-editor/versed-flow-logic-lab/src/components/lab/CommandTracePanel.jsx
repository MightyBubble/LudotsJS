import React from 'react';
import { ABILITY_DEFS } from '@/lib/commandLab';
import { labGraphCtx } from '@/lib/lab/abilityTemplates.js';

// 指令 · 实现图 —— 决策与实现分离的可见化：
//   每个技能 = 一条 command；实现 = 同名 GraphVM 模板图（内置参考实现 / GraphLab 覆盖）。
//   "▶ 追踪"在指令总线上以 GraphVM 执行该指令，逐节点 trace 展示在下方。
const NODE_LABEL = {
  'flow.start': '开始', 'flow.exit': '返回', 'flow.branch': '分支', 'flow.delay': '延迟(异步)',
  'kb.memAdd': 'Mem.Add', 'kb.bbSet': 'BB.Set', 'kb.wsGet': 'WS.Get', 'act.log': '日志',
};

export default function CommandTracePanel({ state, unit }) {
  const bus = state.cmdBus;
  const lib = state.tplLib;
  if (!bus || !lib) {
    return <div className="text-[11px] text-slate-400">模板库加载中…</div>;
  }
  const rows = Object.entries(ABILITY_DEFS).map(([id, d]) => {
    const t = lib.byCommand[d.command];
    return { id, d, t };
  });
  const issue = (cmd) => {
    if (!unit?.alive || bus.run) return;
    bus.issue(cmd, { origin: 'lab.trace' }, labGraphCtx(state, unit, bus));
  };
  const lt = bus.lastTrace;

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-slate-400 leading-relaxed">
        决策只下达 Command；实现是同名 GraphVM 模板图，可在
        <a href="/graph" className="text-sky-500 hover:underline mx-0.5">GraphLab</a>
        建同名图覆盖内置参考实现。
      </div>
      <div className="space-y-1">
        {rows.map(({ id, d, t }) => (
          <div key={id} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 shrink-0" style={{ background: d.color }} />
            <span className="w-16 shrink-0 font-medium text-slate-700 truncate">{d.label}</span>
            <span className="font-mono text-[10px] text-slate-400 flex-1 truncate">{d.command}</span>
            {t ? (
              <span className={`text-[9px] px-1 border shrink-0 ${t.entityId ? 'border-violet-300 text-violet-500' : 'border-slate-200 text-slate-400'}`}>
                {t.entityId ? 'GraphLab 覆盖' : '内置图'}
              </span>
            ) : (
              <span className="text-[9px] px-1 border border-red-300 text-red-400 shrink-0">未绑定</span>
            )}
            <button
              onClick={() => issue(d.command)}
              disabled={!unit?.alive || !!bus.run}
              className="shrink-0 px-1.5 py-0.5 text-[10px] border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >▶ 追踪</button>
          </div>
        ))}
      </div>

      {bus.run && (
        <div className="text-[10px] text-amber-500 font-mono animate-pulse">
          ▶ {bus.current?.name} 执行中…
        </div>
      )}

      {lt && !bus.run && (
        <div className="border border-slate-200 bg-white">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100">
            <span className="font-mono text-[10px] text-slate-600">{lt.command}</span>
            <span className={`text-[10px] font-bold ${lt.result === 'done' ? 'text-emerald-500' : 'text-red-500'}`}>
              {lt.result === 'done' ? '✓ 成功' : '✗ 失败'}
            </span>
          </div>
          <div className="px-2 py-1.5 flex flex-wrap gap-1">
            {lt.trace.map((step, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-300 text-[10px]">→</span>}
                <span className="text-[9px] font-mono px-1 py-0.5 bg-slate-50 border border-slate-200 text-slate-600"
                  title={`${step.node} (${step.type})`}>
                  {NODE_LABEL[step.type] || step.type}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
