// Utility 资产 · InputNormalization —— 独立归一化资产（对齐 Utility Worlds Input Normalization Tab）。
// 六种类型与参考项目一一对应：range(→Range) / divide(→DivideByMaxValue) / gte(→GreaterThanOrEqual)
// / lte(→LessThanOrEqual) / in_range(→IsInRange) / bool(→Bool)。
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { T, AssetList, Tag, Sel, Num, SectionLabel, fieldStyle, CurvePreview } from '@/components/aieditor/uikit.jsx';
import { loadUtilityAssets, saveUtilityAssets, uid } from '@/lib/ai/utility/seedassets.js';
import { countAssetRefs } from '@/lib/ai/utility/utility.js';

export const NORM_TYPES = [
  { value: 'range', label: 'range → WithinRange（线性映射到 0~1）' },
  { value: 'divide', label: 'divide → DivideByMaxValue（除以最大值）' },
  { value: 'gte', label: 'gte → IsGreaterThanOrEqualToValue（≥ 阈值 → 1）' },
  { value: 'lte', label: 'lte → IsLessThanOrEqualToValue（≤ 阈值 → 1）' },
  { value: 'in_range', label: 'in_range → IsWithinRange（区间内 → 1）' },
  { value: 'bool', label: 'bool → BasicNormalization（真 → 1）' },
];

export default function UtilityNormalizations() {
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

  const upd = async (patch) => {
    const next = { ...sel, ...patch };
    setSel(next);
    await persist({ ...assets, normalizations: assets.normalizations.map((i) => (i.id === next.id ? next : i)) });
  };
  const add = async () => {
    const row = { id: uid('norm'), name: 'norm.new', type: 'range', min_value: 0, max_value: 100 };
    await persist({ ...assets, normalizations: [...assets.normalizations, row] });
    setSel(row);
  };
  const del = async (it) => {
    const n = refs.norm[it.id] || 0;
    if (n && !window.confirm(`「${it.name}」被 ${n} 个考量引用，删除后相关考量将失效。继续？`)) return;
    if (sel?.id === it.id) setSel(null);
    await persist({ ...assets, normalizations: assets.normalizations.filter((i) => i.id !== it.id) });
  };

  return (
    <div className="h-full flex" style={{ background: T.canvas, color: T.text1, fontFamily: T.font }}>
      <AssetList title="归一化 Normalization" items={assets.normalizations} selId={sel?.id} onSelect={setSel} onAdd={add} onDelete={del}
        groupKey={(it) => it.category}
        renderMeta={(it) => <Tag color={T.info} bg="rgba(255,255,255,0.06)">{it.type}</Tag>} />
      {!sel ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 13 }}>选择或新建一个归一化</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</span>
            {(refs.norm[sel.id] || 0) > 0 && <Tag color={T.text2}>被 {refs.norm[sel.id]} 个考量引用</Tag>}
          </div>
          <SectionLabel>名称</SectionLabel>
          <input value={sel.name} onChange={(e) => upd({ name: e.target.value })} style={{ ...fieldStyle, width: 280 }} />
          <SectionLabel>Category（分组，对齐参考项目 Category 字段）</SectionLabel>
          <input value={sel.category || ''} onChange={(e) => upd({ category: e.target.value })} placeholder="如 Examples" style={{ ...fieldStyle, width: 200 }} />
          <SectionLabel>归一化类型</SectionLabel>
          <Sel value={sel.type || 'range'} onChange={(v) => upd({ type: v })} options={NORM_TYPES} style={{ width: 280 }} />
          <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
            <div>
              <SectionLabel style={{ marginTop: 0 }}>min</SectionLabel>
              <Num value={sel.min_value ?? 0} onChange={(v) => upd({ min_value: v })} style={{ width: 120 }} />
            </div>
            <div>
              <SectionLabel style={{ marginTop: 0 }}>max</SectionLabel>
              <Num value={sel.max_value ?? 100} onChange={(v) => upd({ max_value: v })} style={{ width: 120 }} />
            </div>
          </div>
          <SectionLabel>映射预览（x 轴 = 原始值 min~max，y 轴 = 归一化 0~1）</SectionLabel>
          <CurvePreview norm={sel} curve={{ type: 'linear', slope: 1, y_shift: 0 }} h={72} />
        </div>
      )}
    </div>
  );
}
