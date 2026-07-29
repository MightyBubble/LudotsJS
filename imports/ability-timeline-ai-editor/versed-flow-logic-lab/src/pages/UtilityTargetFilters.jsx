// Utility 资产 · 目标筛选族 —— TargetFilter（决策目标过滤，对齐 Utility Worlds Target Filter Tab）
// + Selector（选目标器：lab 引擎选目标 graph 的命名资产，filters 硬门 + considerations 加权平均）。
// 决策经 target_filters 数组引用过滤器；技能/姿态候选经 {ref:'名称'} 引用选目标器，
// 引擎执行期由 resolveSelector 统一解引用（lab/targetSelector.js）。
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { T, AssetList, Tag, Sel, Num, SectionLabel, fieldStyle } from '@/components/aieditor/uikit.jsx';
import { loadUtilityAssets, saveUtilityAssets, uid } from '@/lib/ai/utility/seedassets.js';
import { countAssetRefs } from '@/lib/ai/utility/utility.js';

const TYPES = [
  { value: 'AnyFilter', label: 'AnyFilter（任意目标）', color: T.text2 },
  { value: 'EnemyFilter', label: 'EnemyFilter（敌方）', color: T.err },
  { value: 'AllyFilter', label: 'AllyFilter（友方）', color: T.ok },
  { value: 'UtilityAgentFilter', label: 'UtilityAgentFilter（Utility 代理）', color: T.info },
  { value: 'OtherAgentFilter', label: 'OtherAgentFilter（其他代理）', color: T.info },
  { value: 'OtherEntityFilter', label: 'OtherEntityFilter（其他实体）', color: T.info },
  { value: 'WithinDistanceFilter', label: 'WithinDistanceFilter（距离内）', color: T.warn },
];
const typeColor = (t) => TYPES.find((x) => x.value === t)?.color || T.text2;

const SEL_FILTER_TYPES = [
  { value: 'requireTag', label: 'requireTag（需带标签）' },
  { value: 'forbidTag', label: 'forbidTag（禁带标签）' },
  { value: 'hpBelow', label: 'hpBelow（血量低于比例）' },
  { value: 'hpAbove', label: 'hpAbove（血量高于比例）' },
];
const SEL_INPUTS = [['distance', '距离'], ['hp', '血量'], ['aimDistance', '鼠标距离']];
const SEL_CURVES = [['inverse', '反比'], ['linear', '正比'], ['poly', '正比²'], ['invpoly', '反比²'], ['logistic', 'S曲线'], ['step', '阶跃']];

export default function UtilityTargetFilters() {
  const [tab, setTab] = useState('filters'); // filters | selectors
  const [assets, setAssets] = useState(null);
  const [sel, setSel] = useState(null);

  const [recId, setRecId] = useState(null);
  const reload = async () => {
    const { recordId, assets: a } = await loadUtilityAssets(base44);
    setRecId(recordId);
    setAssets(a);
  };
  const persist = async (na) => { setAssets(na); await saveUtilityAssets(base44, recId, na); };
  const [loadErr, setLoadErr] = useState(null);
  useEffect(() => { reload().catch((e) => setLoadErr(String(e?.message || e))); }, []);

  if (loadErr) return (
    <div className="h-full flex flex-col items-center justify-center gap-3" style={{ background: T.canvas, color: T.text2, fontFamily: T.font }}>
      <div style={{ fontSize: 13 }}>Utility 资产加载失败：{loadErr}</div>
      <button onClick={() => { setLoadErr(null); reload().catch((e) => setLoadErr(String(e?.message || e))); }}
        style={{ padding: '6px 14px', background: T.active, color: T.text1, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 12 }}>重试</button>
    </div>
  );
  if (!assets) return <div className="h-full" style={{ background: T.canvas }} />;
  const refs = countAssetRefs(assets);
  const selectors = assets.selectors || [];

  const upd = async (patch) => {
    const next = { ...sel, ...patch };
    setSel(next);
    await persist({ ...assets, filters: assets.filters.map((i) => (i.id === next.id ? next : i)) });
  };
  const add = async () => {
    const row = { id: uid('filter'), name: 'filter.new', type: 'AnyFilter' };
    await persist({ ...assets, filters: [...assets.filters, row] });
    setSel(row);
  };
  const del = async (it) => {
    const n = refs.filter[it.id] || 0;
    if (n && !window.confirm(`「${it.name}」被 ${n} 个决策引用，删除后这些决策回退为「任意目标」。继续？`)) return;
    if (sel?.id === it.id) setSel(null);
    await persist({ ...assets, filters: assets.filters.filter((i) => i.id !== it.id) });
  };

  // ── 选目标器 CRUD ──
  const updSel = async (patch) => {
    const next = { ...sel, ...patch };
    setSel(next);
    await persist({ ...assets, selectors: selectors.map((i) => (i.id === next.id ? next : i)) });
  };
  const addSel = async () => {
    const row = { id: uid('sel'), name: 'selector.new', category: '', filters: [], considerations: [{ input: 'distance', curve: { type: 'inverse' }, weight: 1 }] };
    await persist({ ...assets, selectors: [...selectors, row] });
    setSel(row);
  };
  const delSel = async (it) => {
    if (sel?.id === it.id) setSel(null);
    await persist({ ...assets, selectors: selectors.filter((i) => i.id !== it.id) });
  };
  const patchFilter = (i, f) => updSel({ filters: sel.filters.map((x, j) => (j === i ? f : x)) });
  const patchCons = (i, c) => updSel({ considerations: sel.considerations.map((x, j) => (j === i ? c : x)) });

  return (
    <div className="h-full flex flex-col" style={{ background: T.canvas, color: T.text1, fontFamily: T.font }}>
      {/* 族内切换：过滤器（决策用）/ 选目标器（执行层选目标 graph） */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}`, background: T.panel, padding: '0 12px' }}>
        {[['filters', '目标过滤 TargetFilter'], ['selectors', '选目标器 Selector']].map(([k, lbl]) => (
          <button key={k} onClick={() => { setTab(k); setSel(null); }}
            style={{ padding: '8px 14px', fontSize: 12, cursor: 'pointer', background: 'none', border: 'none', borderBottom: tab === k ? `2px solid ${T.info}` : '2px solid transparent', color: tab === k ? T.text1 : T.text3, fontWeight: tab === k ? 600 : 400 }}>
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'filters' ? (
        <div className="flex-1 flex min-h-0">
          <AssetList title="目标过滤 TargetFilter" items={assets.filters} selId={sel?.id} onSelect={setSel} onAdd={add} onDelete={del}
            groupKey={(it) => it.category}
            renderMeta={(it) => <Tag color={typeColor(it.type)} bg="rgba(255,255,255,0.06)">{it.type?.replace('Filter', '')}</Tag>} />
          {!sel ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 13 }}>选择或新建一个目标过滤器</div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 560 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</span>
                {(refs.filter[sel.id] || 0) > 0 && <Tag color={T.text2}>被 {refs.filter[sel.id]} 个决策引用</Tag>}
              </div>
              <SectionLabel>名称</SectionLabel>
              <input value={sel.name} onChange={(e) => upd({ name: e.target.value })} style={{ ...fieldStyle, width: 280 }} />
              <SectionLabel>Category（分组，对齐参考项目 Category 字段）</SectionLabel>
              <input value={sel.category || ''} onChange={(e) => upd({ category: e.target.value })} placeholder="如 Examples" style={{ ...fieldStyle, width: 200 }} />
              <SectionLabel>过滤类型（决策只对通过过滤的目标打分 · 多过滤器取交集）</SectionLabel>
              <Sel value={sel.type || 'AnyFilter'} onChange={(v) => upd({ type: v })}
                options={TYPES.map((t) => ({ value: t.value, label: t.label }))} style={{ width: 280 }} />
              {sel.type === 'WithinDistanceFilter' && (
                <>
                  <SectionLabel>最大距离 max_distance</SectionLabel>
                  <Num value={sel.max_distance ?? 10} onChange={(v) => upd({ max_distance: v })} style={{ width: 120 }} />
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <AssetList title="选目标器 Selector" items={selectors} selId={sel?.id} onSelect={setSel} onAdd={addSel} onDelete={delSel}
            groupKey={(it) => it.category}
            renderMeta={(it) => <Tag color={T.info} bg="rgba(255,255,255,0.06)">{(it.considerations || []).length} 考量</Tag>} />
          {!sel ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 13 }}>选择或新建一个选目标器</div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 620 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</span>
                <Tag color={T.info}>实验室施法偏好按名称 ⚓ 引用</Tag>
              </div>
              <SectionLabel>名称（引用键：{'{ ref: \'' + sel.name + '\' }'}</SectionLabel>
              <input value={sel.name} onChange={(e) => updSel({ name: e.target.value })} style={{ ...fieldStyle, width: 280 }} />
              <SectionLabel>Category（分组）</SectionLabel>
              <input value={sel.category || ''} onChange={(e) => updSel({ category: e.target.value })} placeholder="如 内置" style={{ ...fieldStyle, width: 200 }} />

              <SectionLabel>硬过滤门（不满足直接出局 · 与 Utility TargetFilter 交集语义同族）</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(sel.filters || []).map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sel value={f.type} onChange={(v) => patchFilter(i, { type: v })}
                      options={SEL_FILTER_TYPES} style={{ width: 190 }} />
                    {(f.type === 'requireTag' || f.type === 'forbidTag') && (
                      <input value={f.tag || ''} onChange={(e) => patchFilter(i, { ...f, tag: e.target.value })} placeholder="State.X / Role.Y" style={{ ...fieldStyle, width: 150 }} />
                    )}
                    {(f.type === 'hpBelow' || f.type === 'hpAbove') && (
                      <Num value={f.ratio ?? 1} min={0} max={1} step={0.05} onChange={(v) => patchFilter(i, { ...f, ratio: v })} style={{ width: 90 }} />
                    )}
                    <button onClick={() => updSel({ filters: sel.filters.filter((_, j) => j !== i) })} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => updSel({ filters: [...(sel.filters || []), { type: 'hpBelow', ratio: 1 }] })}
                  style={{ alignSelf: 'flex-start', padding: '3px 10px', fontSize: 11, background: 'none', color: T.text3, border: `1px dashed ${T.border}`, cursor: 'pointer' }}>+ 硬门</button>
              </div>

              <SectionLabel>考量（input 归一化 × 曲线 × 权重 → 加权平均取最高分）</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(sel.considerations || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sel value={c.input} onChange={(v) => patchCons(i, { ...c, input: v })}
                      options={SEL_INPUTS.map(([value, label]) => ({ value, label }))} style={{ width: 110 }} />
                    <Sel value={c.curve?.type || 'linear'} onChange={(v) => patchCons(i, { ...c, curve: { ...c.curve, type: v } })}
                      options={SEL_CURVES.map(([value, label]) => ({ value, label }))} style={{ width: 100 }} />
                    <span style={{ fontSize: 10, color: T.text3 }}>权重</span>
                    <Num value={c.weight ?? 1} min={0} max={1} step={0.05} onChange={(v) => patchCons(i, { ...c, weight: v })} style={{ width: 80 }} />
                    <button onClick={() => updSel({ considerations: sel.considerations.filter((_, j) => j !== i) })} style={{ color: T.text3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
                  </div>
                ))}
                <button onClick={() => updSel({ considerations: [...(sel.considerations || []), { input: 'hp', curve: { type: 'inverse' }, weight: 0.5 }] })}
                  style={{ alignSelf: 'flex-start', padding: '3px 10px', fontSize: 11, background: 'none', color: T.text3, border: `1px dashed ${T.border}`, cursor: 'pointer' }}>+ 考量</button>
              </div>
              <div style={{ marginTop: 14, fontSize: 11, color: T.text3, lineHeight: 1.7 }}>
                曲线词汇已并入统一打分管线（core/scoring.js）：反比=inverse · 正比=linear · 正比²=poly(exponential) · 反比²=invpoly · S曲线=logistic · 阶跃=step —— 与 Belief/Utility 同一套原语。
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
