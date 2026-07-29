// Utility 资产 · Input —— 独立输入资产（对齐 Utility Worlds Input Tab）。
// 知识层超集：除参考项目的 Self/Target/Distance 派生输入外，source 支持本项目
// 知识层路径语法（bb:黑板 / mem:记忆 / ws:世界状态位 / belief:主观认识 / target:/self: 属性 / dist 距离）。
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { T, AssetList, Field, Btn, Tag, Sel, SectionLabel, fieldStyle } from '@/components/aieditor/uikit.jsx';
import { loadUtilityAssets, saveUtilityAssets, uid } from '@/lib/ai/utility/seedassets.js';
import { countAssetRefs } from '@/lib/ai/utility/utility.js';

const HINTS = ['bb:gold', 'bb:city_count', 'bb:army_count', 'bb:min_relation', 'mem:attacked:20', 'ws:has_city', 'ws:farm_built',
  'belief:threat', 'belief:opportunity', 'target:rel', 'target:power', 'self:x', 'self:team', 'dist'];

export const sourceKind = (s = '') => {
  if (s.startsWith('bb:')) return ['黑板', T.info];
  if (s.startsWith('mem:')) return ['记忆', T.warn];
  if (s.startsWith('ws:')) return ['世界状态', T.ok];
  if (s.startsWith('belief:')) return ['主观认识', T.exec];
  if (s.startsWith('target:')) return ['目标属性', '#DA9A67'];
  if (s.startsWith('self:')) return ['自身属性', '#6EA8E1'];
  if (s === 'dist') return ['距离', '#D584A6'];
  return ['字面量', T.text3];
};

export default function UtilityInputs() {
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
    await persist({ ...assets, inputs: assets.inputs.map((i) => (i.id === next.id ? next : i)) });
  };
  const add = async () => {
    const row = { id: uid('input'), name: 'input.new', source: 'bb:gold' };
    await persist({ ...assets, inputs: [...assets.inputs, row] });
    setSel(row);
  };
  const del = async (it) => {
    const n = refs.input[it.id] || 0;
    if (n && !window.confirm(`「${it.name}」被 ${n} 个考量引用，删除后相关考量将失效。继续？`)) return;
    if (sel?.id === it.id) setSel(null);
    await persist({ ...assets, inputs: assets.inputs.filter((i) => i.id !== it.id) });
  };

  const kind = sel ? sourceKind(sel.source) : null;
  return (
    <div className="h-full flex" style={{ background: T.canvas, color: T.text1, fontFamily: T.font }}>
      <AssetList title="Input 输入" items={assets.inputs} selId={sel?.id} onSelect={setSel} onAdd={add} onDelete={del}
        groupKey={(it) => it.category}
        renderMeta={(it) => { const [label, color] = sourceKind(it.source); return <Tag color={color} bg="rgba(255,255,255,0.06)">{label}</Tag>; }} />
      {!sel ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 13 }}>选择或新建一个 Input</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</span>
            <Tag color={kind[1]} bg="rgba(255,255,255,0.06)">{kind[0]}</Tag>
            {(refs.input[sel.id] || 0) > 0 && <Tag color={T.text2}>被 {refs.input[sel.id]} 个考量引用</Tag>}
          </div>
          <SectionLabel>名称</SectionLabel>
          <input value={sel.name} onChange={(e) => upd({ name: e.target.value })} style={{ ...fieldStyle, width: 280 }} />
          <SectionLabel>Category（分组，对齐参考项目 Category 字段）</SectionLabel>
          <input value={sel.category || ''} onChange={(e) => upd({ category: e.target.value })} placeholder="如 Examples" style={{ ...fieldStyle, width: 200 }} />
          <SectionLabel>Source（数据出处 · 知识层路径）</SectionLabel>
          <input value={sel.source || ''} onChange={(e) => upd({ source: e.target.value })} list="utility-src-hints"
            style={{ ...fieldStyle, width: 360, fontFamily: T.mono }} />
          <datalist id="utility-src-hints">{HINTS.map((s) => <option key={s} value={s} />)}</datalist>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 10, lineHeight: 1.7 }}>
            bb: 黑板客观键（bb:gold）· mem: 事件记忆（mem:attacked:20 = 20 秒内计数）· ws: 世界状态布尔位<br />
            belief: 主观认识曲线输出 · target:/self: 目标/自身属性 · dist 到目标距离（对齐参考项目派生输入）
          </div>
        </div>
      )}
    </div>
  );
}
