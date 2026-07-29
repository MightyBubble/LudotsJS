import React from 'react';
import { Slider } from '@/components/ui/slider';

const CURVES = [['inverse', '反比'], ['linear', '正比'], ['invpoly', '反比²'], ['logistic', 'S曲线']];
const INPUT_LABEL = { distance: '距离', hp: '血量', aimDistance: '鼠标距离' };
const FILTER_TEXT = {
  requireTag: (f) => `需 ${f.tag}`, forbidTag: (f) => `禁 ${f.tag}`,
  hpBelow: (f) => `血量<${Math.round((f.ratio ?? 1) * 100)}%`, hpAbove: (f) => `血量>${Math.round((f.ratio ?? 0) * 100)}%`,
};

const INLINE_FALLBACK = { considerations: [{ input: 'distance', curve: { type: 'inverse' }, weight: 1 }] };
const asInline = (asset) => ({
  filters: (asset.filters || []).map((f) => ({ ...f })),
  considerations: (asset.considerations || []).map((c) => ({ ...c, curve: { ...c.curve } })),
});
// byId+byName 双键索引 → 去重资产列表
export const uniqueAssets = (assets) => [...new Map(Object.values(assets || {}).filter((a) => a?.id).map((a) => [a.id, a])).values()];

// 选目标 graph 编辑：硬过滤门（chips）+ utility 曲线（input × curve formula × weight）
// 两种持有方式：{ref:'资产名'} 引用 Utility 资产库 selectors 区（跨技能/姿态/决策共享）；
// 内联对象（本技能私有微调）。引擎执行期经 resolveSelector 统一解引用。
export default function SelectorEditor({ selector, onChange, assets = {} }) {
  // ── 引用模式：显示资产摘要，可转内联微调或解除引用 ──
  if (selector?.ref) {
    const asset = assets[selector.ref];
    return (
      <div className="mt-1.5 rounded bg-slate-50 border border-slate-100 px-2 py-1.5 space-y-1">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] text-slate-400">选目标 graph:</span>
          <span className="text-[9px] rounded px-1 bg-sky-50 text-sky-600 border border-sky-200">⚓ 资产：{asset?.name || selector.ref}</span>
          {asset && (
            <button onClick={() => onChange(asInline(asset))} className="text-[9px] rounded px-1 border border-dashed border-slate-300 text-slate-400 hover:text-slate-600">
              转内联微调
            </button>
          )}
          <button onClick={() => onChange({ ...INLINE_FALLBACK, considerations: INLINE_FALLBACK.considerations.map((c) => ({ ...c, curve: { ...c.curve } })) })} className="text-[9px] text-slate-300 hover:text-rose-500">✕ 解除引用</button>
        </div>
        {asset ? (
          <div className="flex items-center gap-1 flex-wrap">
            {(asset.filters || []).map((f, i) => (
              <span key={i} className="text-[9px] rounded px-1 bg-rose-50 text-rose-600 border border-rose-200">⛔ {FILTER_TEXT[f.type]?.(f) || f.type}</span>
            ))}
            {(asset.considerations || []).map((c, i) => (
              <span key={i} className="text-[9px] rounded px-1 bg-slate-100 text-slate-500 border border-slate-200">
                {INPUT_LABEL[c.input] || c.input}·{CURVES.find(([m]) => m === (c.curve?.type || 'linear'))?.[1] || c.curve?.type}×{(c.weight ?? 1).toFixed(2)}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-[9px] text-amber-500">⚠ 资产库中找不到「{selector.ref}」——执行期将回退默认（最近）</div>
        )}
      </div>
    );
  }

  // ── 内联模式：逐条编辑 + 可切换为资产引用 ──
  const cons = selector.considerations || [];
  const list = uniqueAssets(assets);
  const patch = (i, c) => onChange({ ...selector, considerations: cons.map((x, j) => (j === i ? c : x)) });
  const addable = Object.keys(INPUT_LABEL).filter((k) => !cons.some((c) => c.input === k));
  return (
    <div className="mt-1.5 rounded bg-slate-50 border border-slate-100 px-2 py-1.5 space-y-1.5">
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[9px] text-slate-400">选目标 graph:</span>
        {(selector.filters || []).map((f, i) => (
          <span key={i} className="text-[9px] rounded px-1 bg-rose-50 text-rose-600 border border-rose-200">⛔ {FILTER_TEXT[f.type]?.(f) || f.type}</span>
        ))}
        {addable.map((k) => (
          <button
            key={k}
            onClick={() => onChange({ ...selector, considerations: [...cons, { input: k, curve: { type: 'inverse' }, weight: 0.5 }] })}
            className="text-[9px] rounded px-1 border border-dashed border-slate-300 text-slate-400 hover:text-slate-600"
          >
            +{INPUT_LABEL[k]}
          </button>
        ))}
        {list.length > 0 && (
          <select
            value=""
            onChange={(e) => e.target.value && onChange({ ref: e.target.value })}
            className="text-[9px] rounded px-1 py-0.5 border border-dashed border-sky-300 text-sky-500 bg-white"
          >
            <option value="">⚓ 改用资产…</option>
            {list.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
          </select>
        )}
      </div>
      {cons.map((c, i) => (
        <div key={c.input} className="flex items-center gap-1.5">
          <span className="text-[9px] w-12 shrink-0 text-slate-600">{INPUT_LABEL[c.input] || c.input}</span>
          {CURVES.map(([m, lbl]) => (
            <button
              key={m}
              onClick={() => patch(i, { ...c, curve: { ...c.curve, type: m } })}
              className={`text-[9px] rounded px-1 py-0.5 border ${(c.curve?.type || 'linear') === m ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-400 border-slate-200'}`}
            >
              {lbl}
            </button>
          ))}
          <Slider value={[c.weight ?? 1]} min={0} max={1} step={0.05} className="w-14" onValueChange={([v]) => patch(i, { ...c, weight: v })} />
          <span className="text-[9px] font-mono text-slate-500 w-7">{(c.weight ?? 1).toFixed(2)}</span>
          {cons.length > 1 && (
            <button onClick={() => onChange({ ...selector, considerations: cons.filter((_, j) => j !== i) })} className="text-[9px] text-slate-300 hover:text-rose-500">✕</button>
          )}
        </div>
      ))}
    </div>
  );
}
