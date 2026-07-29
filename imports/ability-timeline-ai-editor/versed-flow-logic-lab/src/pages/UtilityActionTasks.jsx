// Utility 资产 · ActionTask —— 独立动作任务资产（对齐 Utility Worlds Action Tasks）。
// 每个任务 = 一条指令（command），实现由 GraphLab 模板图承担（指令模式：决策与实现分离）。
// 决策的 actions.action_list 按 execution_mode 组织任务序列（Sequence 按序 / Parallel 并行）。
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { T, AssetList, Tag, Sel, SectionLabel, fieldStyle } from '@/components/aieditor/uikit.jsx';
import { loadUtilityAssets, saveUtilityAssets, uid } from '@/lib/ai/utility/seedassets.js';
import { countAssetRefs } from '@/lib/ai/utility/utility.js';

const CATEGORIES = ['内置', '移动', '战斗', '建造', '外交', '侦察', '动画', '导航', '测试'];

export default function UtilityActionTasks() {
  const [assets, setAssets] = useState(null);
  const [sel, setSel] = useState(null);
  const [graphs, setGraphs] = useState([]);

  const [recId, setRecId] = useState(null);
  const reload = async () => {
    const { recordId, assets: a } = await loadUtilityAssets(base44);
    setRecId(recordId);
    setAssets(a);
  };
  const persist = async (na) => { setAssets(na); await saveUtilityAssets(base44, recId, na); };
  const [loadErr, setLoadErr] = useState(null);
  useEffect(() => { reload().catch((e) => setLoadErr(String(e?.message || e))); }, []);
  useEffect(() => {
    base44.entities.GraphDef.list().then((rows) => setGraphs((rows || []).map((r) => r.name))).catch(() => {});
  }, []);

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
    await persist({ ...assets, actionTasks: assets.actionTasks.map((i) => (i.id === next.id ? next : i)) });
  };
  const add = async () => {
    const row = { id: uid('task'), name: 'task.new', category: '内置', command: '' };
    await persist({ ...assets, actionTasks: [...assets.actionTasks, row] });
    setSel(row);
  };
  const del = async (it) => {
    const n = refs.task[it.id] || 0;
    if (n && !window.confirm(`「${it.name}」被 ${n} 个决策的动作序列引用，删除后将从序列中移除。继续？`)) return;
    // 同步从所有决策的 action_list 中摘掉，保持引用完整
    const decisions = assets.decisions.map((d) => (d.actions?.action_list || []).includes(it.id)
      ? { ...d, actions: { ...d.actions, action_list: d.actions.action_list.filter((x) => x !== it.id) } } : d);
    if (sel?.id === it.id) setSel(null);
    await persist({ ...assets, decisions, actionTasks: assets.actionTasks.filter((i) => i.id !== it.id) });
  };
  const cmdBound = sel?.command && graphs.includes(sel.command);

  return (
    <div className="h-full flex" style={{ background: T.canvas, color: T.text1, fontFamily: T.font }}>
      <AssetList title="动作任务 ActionTask" items={assets.actionTasks} selId={sel?.id} onSelect={setSel} onAdd={add} onDelete={del}
        groupKey={(it) => it.category}
        renderMeta={(it) => <Tag color={T.text2} bg="rgba(255,255,255,0.06)">{it.category || '内置'}</Tag>} />
      {!sel ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 13 }}>选择或新建一个动作任务</div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, maxWidth: 560 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>{sel.name}</span>
            {(refs.task[sel.id] || 0) > 0 && <Tag color={T.text2}>被 {refs.task[sel.id]} 个决策引用</Tag>}
          </div>
          <SectionLabel>名称</SectionLabel>
          <input value={sel.name} onChange={(e) => upd({ name: e.target.value })} style={{ ...fieldStyle, width: 280 }} />
          <SectionLabel>分类</SectionLabel>
          <Sel value={CATEGORIES.includes(sel.category) ? sel.category : '内置'} onChange={(v) => upd({ category: v })}
            options={CATEGORIES} style={{ width: 200 }} />
          <SectionLabel>指令 command（选中决策时下达 · 由同名模板图实现）</SectionLabel>
          <input value={sel.command || ''} onChange={(e) => upd({ command: e.target.value })} list="utility-graph-names"
            placeholder="模板图名，如 build_farm" style={{ ...fieldStyle, width: 280, fontFamily: T.mono }} />
          <datalist id="utility-graph-names">{graphs.map((g) => <option key={g} value={g} />)}</datalist>
          <div style={{ fontSize: 11, marginTop: 6, color: cmdBound ? T.ok : T.text3 }}>
            {sel.command ? (cmdBound ? '✓ 已绑定到 GraphLab 模板图' : '⚠ 还没有同名模板图——去 GraphLab 建一个') : '未配置指令（占位动作）'}
          </div>
          <SectionLabel>参数 params（JSON，可选，随指令下发给模板图）</SectionLabel>
          <textarea value={sel.params || ''} onChange={(e) => upd({ params: e.target.value })} rows={3}
            placeholder='{"speed": 1}' style={{ ...fieldStyle, width: 360, height: 'auto', padding: 8, fontFamily: T.mono, resize: 'vertical' }} />
        </div>
      )}
    </div>
  );
}
