// Utility 资产 · Consideration —— 独立考量资产（对齐 Utility Worlds Consideration Tab），跨决策复用。
// 考量 = Input（引用）→ InputNormalization（引用）→ 响应曲线（15 预设 + 4 参数微调）。
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { T, AssetList, Tag, Sel, Toggle, SectionLabel, fieldStyle, CurvePreview } from '@/components/aieditor/uikit.jsx';
import { loadUtilityAssets, saveUtilityAssets, uid } from '@/lib/ai/utility/seedassets.js';
import { countAssetRefs } from '@/lib/ai/utility/utility.js';
import { sourceKind } from './UtilityInputs.jsx';

// 15 预设对齐参考项目；我们引擎为三曲线（linear/exponential/logistic）+ 参数，
// 可精确表达的给精确映射，其余给最近等价并标注 ≈。
export const CURVE_PRESETS = [
  { name: 'Basic Linear', p: { type: 'Linear', slope: 1, exponent: 1, x_shift: 0, y_shift: 0 } },
  { name: 'Inverse Linear', p: { type: 'Linear', slope: -1, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Constant', p: { type: 'Linear', slope: 0, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Basic logistic', p: { type: 'Logistic', slope: -1, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Inverse logistic', p: { type: 'Logistic', slope: 1, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Basic logit', p: { type: 'Logistic', slope: -2, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Inverse logit', p: { type: 'Logistic', slope: 2, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Basic quadric lower left', p: { type: 'Exponential', slope: 1, exponent: 2, x_shift: 0, y_shift: 1 } },
  { name: 'Basic quadric upper left', p: { type: 'Exponential', slope: 1, exponent: 0.5, x_shift: 0, y_shift: 1 } },
  { name: 'Basic quadric lower right', approx: true, p: { type: 'Logistic', slope: -1, exponent: 1, x_shift: 0.25, y_shift: 1 } },
  { name: 'Basic quadric upper right', approx: true, p: { type: 'Logistic', slope: -1, exponent: 1, x_shift: -0.25, y_shift: 1 } },
  { name: 'Basic sine', approx: true, p: { type: 'Logistic', slope: -1.2, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Inverse sine', approx: true, p: { type: 'Logistic', slope: 1.2, exponent: 1, x_shift: 0, y_shift: 1 } },
  { name: 'Basic bell curve', approx: true, p: { type: 'Logistic', slope: -2.5, exponent: 1, x_shift: -0.1, y_shift: 1 } },
  { name: 'Inverse bell curve', approx: true, p: { type: 'Logistic', slope: 2.5, exponent: 1, x_shift: -0.1, y_shift: 1 } },
];
const CURVE_TYPES = ['Linear', 'Exponential', 'Logistic'];

export default function UtilityConsiderations() {
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
  const inputOf = (id) => assets.inputs.find((i) => i.id === id);
  const normOf = (id) => assets.normalizations.find((n) => n.id === id);

  const upd = async (patch) => {
    const next = { ...sel, ...patch };
    setSel(next);
    await persist({ ...assets, considerations: assets.considerations.map((i) => (i.id === next.id ? next : i)) });
  };
  const updCurve = (k, v) => upd({ response_curve: { ...(sel.response_curve || {}), [k]: v } });
  const add = async () => {
    const row = {
      id: uid('cons'), name: 'consideration.new', has_no_target: false,
      response_curve: { type: 'Logistic', slope: -1, exponent: 1, x_shift: 0, y_shift: 1 },
    };
    await persist({ ...assets, considerations: [...assets.considerations, row] });
    setSel(row);
  };
  const del = async (it) => {
    const n = refs.consideration[it.id] || 0;
    if (n && !window.confirm(`「${it.name}」被 ${n} 个决策引用，删除后将从这些决策中移除。继续？`)) return;
    const decisions = assets.decisions.map((d) => (d.considerations || []).includes(it.id)
      ? { ...d, considerations: d.considerations.filter((x) => x !== it.id) } : d);
    if (sel?.id === it.id) setSel(null);
    await persist({ ...assets, decisions, considerations: assets.considerations.filter((i) => i.id !== it.id) });
  };

  const cv = sel?.response_curve || {};
  const norm = sel ? normOf(sel.input_normalization_id) : null;
  const input = sel ? inputOf(sel.input_id) : null;
  const sliders = [
    ['slope', -2.5, 2.5, 0.05], ['exponent', 0.2, 3, 0.05], ['x_shift', -0.5, 0.5, 0.01], ['y_shift', 0, 1, 0.01],
  ];
  return (
    <div className="h-full flex" style={{ background: T.canvas, color: T.text1, fontFamily: T.font }}>
      <AssetList title="考量 Consideration" items={assets.considerations} selId={sel?.id} onSelect={setSel} onAdd={add} onDelete={del}
        groupKey={(it) => it.category}
        renderMeta={(it) => {
          const src = inputOf(it.input_id)?.source || '';
          const [label, color] = sourceKind(src);
          return <Tag color={color} bg="rgba(255,255,255,0.06)">{label}</Tag>;
        }} />
      {!sel ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 13 }}>选择或新建一个考量</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</span>
            {(refs.consideration[sel.id] || 0) > 0 && <Tag color={T.text2}>被 {refs.consideration[sel.id]} 个决策引用</Tag>}
          </div>
          <SectionLabel>名称</SectionLabel>
          <input value={sel.name} onChange={(e) => upd({ name: e.target.value })} style={{ ...fieldStyle, width: 280 }} />
          <SectionLabel>Category（分组，对齐参考项目 Category 字段）</SectionLabel>
          <input value={sel.category || ''} onChange={(e) => upd({ category: e.target.value })} placeholder="如 Examples" style={{ ...fieldStyle, width: 200 }} />

          <div style={{ display: 'flex', gap: 16, marginTop: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel style={{ marginTop: 0 }}>Input（引用）</SectionLabel>
              <Sel value={sel.input_id || ''} onChange={(v) => upd({ input_id: v || null })}
                options={[{ value: '', label: '（未选择）' }, ...assets.inputs.map((i) => ({ value: i.id, label: i.name }))]} style={{ width: 220 }} />
            </div>
            <div>
              <SectionLabel style={{ marginTop: 0 }}>Normalization（引用）</SectionLabel>
              <Sel value={sel.input_normalization_id || ''} onChange={(v) => upd({ input_normalization_id: v || null })}
                options={[{ value: '', label: '（未选择）' }, ...assets.normalizations.map((n) => ({ value: n.id, label: n.name }))]} style={{ width: 220 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
              <Toggle value={!!sel.has_no_target} onChange={(v) => upd({ has_no_target: v })} />
              <span style={{ fontSize: 12, color: T.text2 }}>无目标（对 self 求值）</span>
            </div>
          </div>
          {input && <div style={{ fontSize: 11, color: T.text3, marginTop: 8, fontFamily: T.mono }}>source: {input.source}{norm ? ` · 归一化 ${norm.type} ${norm.min_value}~${norm.max_value}` : ''}</div>}

          <SectionLabel>响应曲线预设（15 · 对齐参考项目；≈ 为最近等价）</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CURVE_PRESETS.map((pr) => (
              <button key={pr.name} onClick={() => upd({ response_curve: { ...pr.p } })}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${T.border}`, background: T.active, color: T.text2,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.hover; e.currentTarget.style.color = T.text1; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = T.active; e.currentTarget.style.color = T.text2; }}>
                {pr.name}{pr.approx ? ' ≈' : ''}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <SectionLabel style={{ marginTop: 0 }}>曲线类型</SectionLabel>
              <Sel value={CURVE_TYPES.includes(cv.type) ? cv.type : 'Logistic'} onChange={(v) => updCurve('type', v)} options={CURVE_TYPES} style={{ width: 150 }} />
            </div>
            {sliders.map(([k, mn, mx, st]) => (
              <div key={k} style={{ width: 110 }}>
                <div style={{ fontSize: 11, color: T.text2, marginBottom: 4 }}>{k} = {(cv[k] ?? { slope: -1, exponent: 1, x_shift: 0, y_shift: 1 }[k]).toFixed(2)}</div>
                <input type="range" min={mn} max={mx} step={st} value={cv[k] ?? { slope: -1, exponent: 1, x_shift: 0, y_shift: 1 }[k]}
                  onChange={(e) => updCurve(k, +e.target.value)} style={{ width: '100%', accentColor: T.accent }} />
              </div>
            ))}
          </div>
          <SectionLabel>预览（归一化后 x → 曲线输出 y）</SectionLabel>
          <CurvePreview norm={norm || { type: 'range', min_value: 0, max_value: 100 }}
            curve={{ type: (cv.type || 'Logistic').toLowerCase(), slope: cv.slope, exponent: cv.exponent, x_shift: cv.x_shift, y_shift: cv.y_shift }} h={84} />
        </div>
      )}
    </div>
  );
}
