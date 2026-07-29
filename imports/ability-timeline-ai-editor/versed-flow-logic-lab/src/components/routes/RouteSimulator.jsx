import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Seg, describeDo } from '@/components/routes/routeUi';

const KINDS = [['enemy', '指着敌人'], ['ally', '指着友军'], ['ground', '指着地面']];

// 命中模拟器：构造一个上下文，实时求值当前草稿路由表，高亮命中规则
export default function RouteSimulator({ rules, ctx, onChange, matchedIndex }) {
  const vocab = [...new Set(['Role.Healer', ...rules.flatMap((r) => r.when?.selfTags || [])])];
  const matchedRule = matchedIndex >= 0 ? rules[matchedIndex] : null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
      <div className="text-xs font-bold text-slate-700">命中模拟器</div>
      <div className="space-y-1">
        <div className="text-[10px] text-slate-400">我指着什么？</div>
        <Seg options={KINDS} value={ctx.targetKind} onPick={(v) => onChange({ ...ctx, targetKind: v })} />
      </div>
      <div className="space-y-1">
        <div className="text-[10px] text-slate-400">我是谁（自身标签）？</div>
        <div className="flex gap-1 flex-wrap">
          {vocab.map((t) => {
            const on = ctx.selfTags.includes(t);
            return (
              <button key={t} onClick={() => onChange({ ...ctx, selfTags: on ? ctx.selfTags.filter((x) => x !== t) : [...ctx.selfTags, t] })}
                className={`font-mono text-[10px] rounded px-1.5 py-0.5 border ${on ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-500 border-slate-200'}`}>
                {t}
              </button>
            );
          })}
        </div>
      </div>
      {ctx.targetKind !== 'ground' && (
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
            <span>目标血量比</span>
            <span className="font-mono text-slate-600">{Math.round(ctx.targetHpRatio * 100)}%</span>
          </div>
          <Slider value={[Math.round(ctx.targetHpRatio * 100)]} min={0} max={100} step={5}
            onValueChange={([v]) => onChange({ ...ctx, targetHpRatio: v / 100 })} />
        </div>
      )}
      <div className={`rounded-md px-2.5 py-2 text-xs ${matchedRule ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
        {matchedRule
          ? <>命中规则 <b>#{matchedIndex + 1}</b> → <b>{describeDo(matchedRule.do)}</b></>
          : '无匹配 —— 该上下文下这次输入什么都不会发生'}
      </div>
    </div>
  );
}