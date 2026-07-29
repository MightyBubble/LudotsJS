import React, { useRef } from 'react';
import { ABILITY_DEFS, orderAbility } from '@/lib/commandLab';
import { labGraphCtx } from '@/lib/lab/abilityTemplates.js';
import { evaluateUtility, utilityBest } from '@/lib/ai/utility/utility.js';
import { createChainDemo, CHAIN_MAKER } from '@/lib/lab/chainDemo.js';

// 全链路演示 —— Utility 解算 → Command 下达 → GraphVM 模板图 trace → 引擎效果命中。
//
// 决策与实现分离在这一面板闭合（与 4X brain.js 同一条链路）：
//   ① Utility：受控单位知识层（BB/Mem/WS/Belief）喂给统一打分管线，解算"接战抉择"
//   ② Command：最优决策只产出一条指令名（决策不认识实现）
//   ③ GraphVM：指令总线 issue → 同名模板图执行，逐节点 trace（见下方"指令 · 实现图"面板）
//   ④ 引擎：同一指令语义同时驱动实验室引擎真实施放 —— 场景里看得到效果命中
//
// 演示集见 lib/lab/chainDemo.js（代码内置数据，不污染 Utility 资产库）。

const STAGES = ['Utility 解算', 'Command 下达', 'GraphVM trace', '引擎命中'];

export default function UtilityChainPanel({ state, unit, autoTargets }) {
  const setRef = useRef(null);
  if (!setRef.current) setRef.current = createChainDemo();
  const set = setRef.current;

  if (!unit?.alive || !unit.knowledge) {
    return <div className="text-[11px] text-slate-400">受控单位不可用</div>;
  }
  const ctx = labGraphCtx(state, unit, state.cmdBus);
  evaluateUtility(set, ctx, []);
  const maker = set.makers[0];
  const best = utilityBest(set, CHAIN_MAKER);

  const run = () => {
    if (!best || !state.cmdBus) return;
    // ③ GraphVM 可追溯实现（模板图执行，逐节点 trace；结果在下方"指令 · 实现图"面板可见）
    state.cmdBus.issue(best.command.name, { origin: 'utility:lab' }, ctx);
    // ④ 引擎真实行为：同一指令语义 → 场景效果命中
    const ability = best.command.name.replace('ability.', '');
    if (ABILITY_DEFS[ability]) {
      orderAbility(state, ability, false, 'utility', null, autoTargets?.[ability] || null);
    }
  };

  return (
    <div className="space-y-2">
      {/* 链路四段 */}
      <div className="flex items-center gap-1 text-[9px]">
        {STAGES.map((st, i) => (
          <React.Fragment key={st}>
            {i > 0 && <span className="text-slate-300">→</span>}
            <span className={`px-1 py-0.5 border ${i <= (state.cmdBus?.lastTrace ? 3 : 1) ? 'border-slate-300 text-slate-600 bg-white' : 'border-slate-200 text-slate-300'}`}>{st}</span>
          </React.Fragment>
        ))}
      </div>

      {/* 决策得分（统一打分管线：source → 归一化 → 曲线 → 乘积 × 动量） */}
      <div className="space-y-1">
        {maker.decisions.map((dd) => {
          const isBest = best?.id === dd.id;
          const pct = Math.round(Math.min(1, dd.out.final) * 100);
          return (
            <div key={dd.id} className={`border px-1.5 py-1 ${isBest ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className={`font-medium ${isBest ? 'text-amber-600' : 'text-slate-700'}`}>{dd.name}</span>
                {isBest && <span className="text-[9px] text-amber-500">★ 最优</span>}
                <span className="font-mono text-[10px] text-slate-400 ml-auto">{dd.command?.name}</span>
                <span className="font-mono text-[10px] text-slate-500 w-8 text-right">{pct}%</span>
              </div>
              <div className="h-1 mt-1 bg-slate-100 overflow-hidden">
                <div className={`h-full ${isBest ? 'bg-amber-400' : 'bg-slate-300'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-0.5 text-[9px] text-slate-400">
                {dd.consNames.join(' × ')}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={run}
        disabled={!best || !state.cmdBus || !!state.cmdBus?.run}
        className="w-full px-2 py-1.5 text-[11px] font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ▶ 执行最优决策（{best?.name || '—'}）→ 指令 → 图 → 命中
      </button>
      <div className="text-[9px] text-slate-400 leading-relaxed">
        与 4X 战略层同一条链路：决策只产出指令名；实现 = 同名 GraphVM 模板图（trace 见下方面板）；引擎同语义真实施放。
      </div>
    </div>
  );
}
