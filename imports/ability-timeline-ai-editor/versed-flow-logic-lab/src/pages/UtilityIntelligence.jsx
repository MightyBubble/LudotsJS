// Utility Intelligence 组合页（对齐参考项目 Intelligence Tab + Simulator）。
// 结构：UtilityAgent（compensation/momentum 持有者）→ DecisionMaker（makers）→ Decision（独立资产，
// 引用 Consideration / TargetFilter / ActionTask）。选中决策 = 按 execution_mode 下达整个动作序列。
// 右侧实时求值：知识层（BB/Mem/WS/Belief）作为输入源，展示每条决策的得分与将下达的动作链。
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  T, AssetList, Tag, Sel, Toggle, Num, Btn, SectionLabel, Group, RefPicker, fieldStyle, Seg,
} from '@/components/aieditor/uikit.jsx';
import { Plus, ArrowUp, ArrowDown, X, Play, SlidersHorizontal, Zap } from 'lucide-react';
import { loadUtilityAssets, saveUtilityAssets, uid } from '@/lib/ai/utility/seedassets.js';
import { bakeUtilityAssets, evaluateUtility, snapshotUtility } from '@/lib/ai/utility/utility.js';
import { bakeBeliefs, evaluateBeliefs, beliefGet } from '@/lib/ai/core/belief.js';
import { BELIEF_DEFS, WS_BITS } from '@/lib/ai/world4x/content.js';
import { createBitRegistry, createWorldState, createMem, createBlackboard } from '@/lib/ai/core/knowledge.js';

/* 有序引用列表：条列 + 上移/下移/移除 + RefPicker 追加 */
function OrderedRefs({ ids, pool, onChange, renderMeta, addLabel }) {
  const [picking, setPicking] = useState(false);
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= ids.length) return;
    const next = [...ids];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      {ids.map((id, i) => {
        const it = pool.find((x) => x.id === id);
        return (
          <div key={`${id}-${i}`} style={{
            display: 'flex', alignItems: 'center', gap: 6, height: 26, padding: '0 6px', marginBottom: 2,
            borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 12, color: T.text1,
          }}>
            <span style={{ color: T.text3, fontSize: 10, width: 12 }}>{i + 1}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it?.name || '（已删除）'}</span>
            {renderMeta?.(it)}
            <ArrowUp size={11} style={{ color: T.text3, cursor: 'pointer' }} onClick={() => move(i, -1)} />
            <ArrowDown size={11} style={{ color: T.text3, cursor: 'pointer' }} onClick={() => move(i, 1)} />
            <X size={11} style={{ color: T.text3, cursor: 'pointer' }} onClick={() => onChange(ids.filter((_, k) => k !== i))} />
          </div>
        );
      })}
      {picking ? (
        <RefPicker items={pool} exclude={ids} onPick={(it) => { onChange([...ids, it.id]); setPicking(false); }} />
      ) : (
        <Btn kind="ghost" size="sm" onClick={() => setPicking(true)} style={{ marginTop: 2 }}><Plus size={12} />{addLabel || '添加'}</Btn>
      )}
    </div>
  );
}

/* 无序引用芯片组（target_filters 用） */
function RefChips({ ids, pool, onChange }) {
  const [picking, setPicking] = useState(false);
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {ids.map((id) => {
          const it = pool.find((x) => x.id === id);
          return (
            <span key={id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, padding: '3px 8px',
              borderRadius: 9999, background: 'rgba(255,255,255,0.08)', color: T.text1,
            }}>
              {it?.name || '（已删除）'}
              <X size={10} style={{ color: T.text3, cursor: 'pointer' }} onClick={() => onChange(ids.filter((x) => x !== id))} />
            </span>
          );
        })}
        {!picking && (
          <button onClick={() => setPicking(true)} style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 9999, border: `1px dashed ${T.border2}`,
            background: 'transparent', color: T.text3, cursor: 'pointer',
          }}><Plus size={10} style={{ display: 'inline' }} /> 过滤器</button>
        )}
      </div>
      {picking && <div style={{ marginTop: 6 }}><RefPicker items={pool} exclude={ids} onPick={(it) => { onChange([...ids, it.id]); setPicking(false); }} /></div>}
    </div>
  );
}

export default function UtilityIntelligence() {
  const [assets, setAssets] = useState(null);
  const [agentId, setAgentId] = useState(null);
  const [mi, setMi] = useState(0);
  const [bbInput, setBbInput] = useState({ gold: 80, city_count: 2, army_count: 3, min_relation: -20 });
  const [wsBits, setWsBits] = useState({});
  const [targets] = useState([
    { id: 'chu', name: '楚', rel: -30, power: 25, dist: 7, team: 'chu' },
    { id: 'qi', name: '齐', rel: 20, power: 45, dist: 15, team: 'qi' },
  ]);
  const [result, setResult] = useState(null);

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
  const agent = assets.agents.find((a) => a.id === agentId) || assets.agents[0] || null;
  const maker = agent?.makers?.[Math.min(mi, (agent?.makers?.length || 1) - 1)] || null;
  const taskOf = (id) => assets.actionTasks.find((t) => t.id === id);

  /* ---------- 写穿（blob 整包持久化） ---------- */
  const patchAgent = async (patch) => {
    await persist({ ...assets, agents: assets.agents.map((x) => (x.id === agent.id ? { ...x, ...patch } : x)) });
  };
  const patchMaker = (idx, mpatch) => {
    const makers = agent.makers.map((m, i) => (i === idx ? { ...m, ...mpatch } : m));
    patchAgent({ makers });
  };
  const patchDec = async (id, patch) => {
    await persist({ ...assets, decisions: assets.decisions.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
  };

  const addAgent = async () => {
    const row = {
      id: uid('agent'), name: `agent.${assets.agents.length + 1}`, compensation_factor: true, momentum_bonus: 1.1,
      makers: [{ id: 'm1', name: '决策器', decisions: [] }],
    };
    await persist({ ...assets, agents: [...assets.agents, row] });
    setAgentId(row.id); setMi(0);
  };
  const delAgent = async (it) => {
    if (assets.agents.length <= 1) return;
    if (!window.confirm(`删除 Agent「${it.name}」？其引用的决策资产保留。`)) return;
    await persist({ ...assets, agents: assets.agents.filter((x) => x.id !== it.id) });
    setAgentId(null); setMi(0);
  };
  const addMaker = () => patchAgent({ makers: [...agent.makers, { id: 'm' + Date.now(), name: `决策器 ${agent.makers.length + 1}`, decisions: [] }] });
  const delMaker = (idx) => {
    if (agent.makers.length <= 1) return;
    patchAgent({ makers: agent.makers.filter((_, i) => i !== idx) });
    setMi(0);
  };
  const addDecision = async () => {
    const row = {
      id: uid('dec'), name: '新决策', weight: 1, has_no_target: true, enable_cache_per_target: false,
      target_filters: [], considerations: [],
      actions: { execution_mode: 'Sequence', keep_running_until_finished: false, max_repeat_count: 1, action_list: [] },
    };
    const agents = assets.agents.map((x) => (x.id === agent.id
      ? { ...x, makers: x.makers.map((m, i) => (i === mi ? { ...m, decisions: [...m.decisions, row.id] } : m)) } : x));
    await persist({ ...assets, decisions: [...assets.decisions, row], agents });
  };
  const delDecision = async (id) => {
    if (!window.confirm('彻底删除该决策实体？（所有引用它的决策器都会移除）')) return;
    const agents = assets.agents.map((a) => ({
      ...a, makers: a.makers.map((m) => ({ ...m, decisions: m.decisions.filter((x) => x !== id) })),
    }));
    await persist({ ...assets, decisions: assets.decisions.filter((d) => d.id !== id), agents });
  };
  const attachDecision = (row) => patchMaker(mi, { decisions: [...maker.decisions, row.id] });

  /* ---------- 实时求值 ---------- */
  const evaluate = () => {
    const set = bakeUtilityAssets({
      agent, decisions: assets.decisions, considerations: assets.considerations,
      inputs: assets.inputs, normalizations: assets.normalizations, filters: assets.filters, actionTasks: assets.actionTasks,
    });
    const beliefs = bakeBeliefs(BELIEF_DEFS);
    const bb = createBlackboard();
    Object.entries(bbInput).forEach(([k, v]) => bb.set(k, v));
    const ws = createWorldState(createBitRegistry(WS_BITS));
    Object.entries(wsBits).forEach(([k, v]) => v && ws.set(k, true));
    evaluateBeliefs(beliefs, { bb, mem: createMem(), ws });
    const ctx = {
      bb, mem: createMem(), ws, time: 0,
      beliefs: { get: (k) => beliefGet(beliefs, k) },
      self: { team: 'qin' }, dist: (s, t) => t?.dist ?? 10,
    };
    const store = {};
    evaluateUtility(set, ctx, targets, store);
    setResult({
      snap: snapshotUtility(set, ctx, targets),
      beliefs: beliefs.keys.map((k) => ({ key: k, value: beliefGet(beliefs, k) })),
    });
  };

  const unassigned = assets.decisions.filter((d) => !(agent?.makers || []).some((m) => m.decisions.includes(d.id)));
  return (
    <div className="h-full flex" style={{ background: T.canvas, color: T.text1, fontFamily: T.font }}>
      <AssetList title="Utility Agent" items={assets.agents} selId={agent?.id} onSelect={(it) => { setAgentId(it.id); setMi(0); }}
        onAdd={addAgent} onDelete={delAgent}
        renderMeta={(it) => <Tag color={T.text3} bg="rgba(255,255,255,0.06)">{it.makers?.length || 0} 器</Tag>} />
      {!agent ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text3, fontSize: 13 }}>新建一个 Utility Agent</div>
      ) : (
        <>
          {/* 中栏：Agent + Maker + Decision 组合 */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, minWidth: 0 }}>
            <Group title={`Agent · ${agent.name}`} right={<Tag color={T.accent} bg={T.selectedBg}>{ { none: '无补偿', factor: '补偿因子', geometric: '几何平均' }[agent.compensation_method || 'factor'] }</Tag>}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>名称</div>
                  <input value={agent.name} onChange={(e) => patchAgent({ name: e.target.value })} style={{ ...fieldStyle, width: 220 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>补偿方法 Compensation Method</div>
                  <Sel value={agent.compensation_method || 'factor'} onChange={(v) => patchAgent({ compensation_method: v })}
                    options={[
                      { value: 'none', label: 'None（无补偿）' },
                      { value: 'factor', label: 'Compensation Factor（默认 · Dave Mark）' },
                      { value: 'geometric', label: 'Geometric Mean（几何平均 · Rez Graham）' },
                    ]} style={{ width: 260 }} />
                </div>
                <div style={{ width: 200 }}>
                  <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>动量 Momentum ×{(agent.momentum_bonus ?? 1.1).toFixed(2)}（&lt;1 降权）</div>
                  <input type="range" min={0.5} max={1.5} step={0.01} value={agent.momentum_bonus ?? 1.1}
                    onChange={(e) => patchAgent({ momentum_bonus: +e.target.value })} style={{ width: '100%', accentColor: T.accent }} />
                </div>
              </div>
            </Group>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 12px' }}>
              <Seg options={agent.makers.map((m, i) => ({ value: String(i), label: `${m.name}（${m.decisions.length}）` }))}
                value={String(Math.min(mi, agent.makers.length - 1))} onChange={(v) => setMi(+v)} />
              <Btn kind="ghost" size="sm" onClick={addMaker}><Plus size={12} />决策器</Btn>
              {agent.makers.length > 1 && <Btn kind="danger" size="sm" onClick={() => delMaker(mi)}>删除当前器</Btn>}
              {maker && (
                <>
                  <span style={{ flex: 1 }} />
                  <input value={maker.name} onChange={(e) => patchMaker(mi, { name: e.target.value })}
                    style={{ ...fieldStyle, width: 160 }} />
                </>
              )}
            </div>

            {maker && maker.decisions.map((id) => {
              const d = assets.decisions.find((x) => x.id === id);
              if (!d) return null;
              const firstCmd = (d.actions?.action_list || []).map(taskOf).find((t) => t?.command)?.command;
              return (
                <Group key={id} title={d.name}
                  right={
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <Tag color={T.text2}>权重 {(d.weight ?? 1).toFixed?.(2) ?? d.weight}</Tag>
                      {d.has_no_target ? <Tag color={T.text3}>无目标</Tag> : <Tag color={T.warn}>目标 {d.target_filters?.length || 1}</Tag>}
                      <Tag color={T.exec}>{d.actions?.execution_mode || 'Sequence'} · {d.actions?.action_list?.length || 0} 动作</Tag>
                      <Btn kind="danger" size="sm" onClick={() => delDecision(id)}><X size={11} /></Btn>
                    </span>
                  }>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>名称</div>
                      <input value={d.name} onChange={(e) => patchDec(id, { name: e.target.value })} style={{ ...fieldStyle, width: 180 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>权重</div>
                      <Num value={d.weight ?? 1} step={0.05} onChange={(v) => patchDec(id, { weight: v })} style={{ width: 80 }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: T.text2, marginBottom: 4 }}>Category</div>
                      <input value={d.category || ''} onChange={(e) => patchDec(id, { category: e.target.value })} placeholder="分组" style={{ ...fieldStyle, width: 110 }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle value={!!d.has_no_target} onChange={(v) => patchDec(id, { has_no_target: v })} />
                      <span style={{ fontSize: 12, color: T.text2 }}>无目标</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle value={!!d.enable_cache_per_target} onChange={(v) => patchDec(id, { enable_cache_per_target: v })} />
                      <span style={{ fontSize: 12, color: T.text2 }}>按目标缓存</span>
                    </div>
                  </div>
                  {!d.has_no_target && (
                    <>
                      <SectionLabel style={{ marginTop: 2 }}>目标过滤（引用 TargetFilter 资产）</SectionLabel>
                      <RefChips ids={d.target_filters || []} pool={assets.filters}
                        onChange={(v) => patchDec(id, { target_filters: v })} />
                    </>
                  )}
                  <SectionLabel>考量（引用 Consideration 资产 · 乘积打分，顺序无关仅作展示）</SectionLabel>
                  <OrderedRefs ids={d.considerations || []} pool={assets.considerations} addLabel="考量"
                    onChange={(v) => patchDec(id, { considerations: v })} />

                  <SectionLabel>动作序列（选中本决策 = 按模式下达整链 · Decision↔ActionList）</SectionLabel>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                    <Seg options={['Sequence', 'Parallel', 'ParallelComplete']}
                      value={['Parallel', 'ParallelComplete'].includes(d.actions?.execution_mode) ? d.actions.execution_mode : 'Sequence'}
                      onChange={(v) => patchDec(id, { actions: { ...d.actions, execution_mode: v } })} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Toggle value={!!d.actions?.keep_running_until_finished}
                        onChange={(v) => patchDec(id, { actions: { ...d.actions, keep_running_until_finished: v } })} />
                      <span style={{ fontSize: 12, color: T.text2 }}>执行到底才换决策</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: T.text2 }}>最大重复</span>
                      <Num value={d.actions?.max_repeat_count ?? 0} min={0} max={99}
                        onChange={(v) => patchDec(id, { actions: { ...d.actions, max_repeat_count: v } })} style={{ width: 60 }} />
                      <span style={{ fontSize: 10, color: T.text3 }}>0=无限直到失败</span>
                    </div>
                    {firstCmd && <Tag color={T.ok} bg="rgba(48,209,88,0.12)">首指令 {firstCmd}</Tag>}
                  </div>
                  <OrderedRefs ids={d.actions?.action_list || []} pool={assets.actionTasks} addLabel="动作任务"
                    onChange={(v) => patchDec(id, { actions: { ...d.actions, action_list: v } })}
                    renderMeta={(t) => t?.command ? <Tag color={T.ok} bg="rgba(48,209,88,0.10)">{t.command}</Tag> : null} />
                </Group>
              );
            })}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Btn kind="secondary" onClick={addDecision}><Plus size={13} />新决策</Btn>
              {unassigned.length > 0 && (
                <div style={{ width: 240 }}>
                  <RefPicker items={unassigned} placeholder="附加已有决策到本决策器…" onPick={attachDecision} />
                </div>
              )}
            </div>
          </div>

          {/* 右栏：实时求值 */}
          <div style={{ width: 360, flexShrink: 0, overflowY: 'auto', padding: 16, background: T.panel, borderLeft: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <SlidersHorizontal size={14} style={{ color: T.text3 }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>实时求值（知识层输入）</span>
              <span style={{ flex: 1 }} />
              <Btn kind="primary" size="sm" onClick={evaluate}><Play size={12} />求值</Btn>
            </div>
            <SectionLabel style={{ marginTop: 0 }}>黑板输入</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(bbInput).map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: T.text3, marginBottom: 3 }}>bb:{k}</div>
                  <Num value={v} onChange={(nv) => setBbInput({ ...bbInput, [k]: nv })} />
                </div>
              ))}
            </div>
            <SectionLabel>WorldState 位（勾选为 true）</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {WS_BITS.slice(0, 18).map((b) => (
                <button key={b} onClick={() => setWsBits({ ...wsBits, [b]: !wsBits[b] })}
                  style={{
                    fontSize: 10, padding: '3px 7px', borderRadius: 5, border: 'none', cursor: 'pointer',
                    background: wsBits[b] ? T.err : 'rgba(255,255,255,0.07)', color: wsBits[b] ? '#fff' : T.text3,
                  }}>{b}</button>
              ))}
            </div>
            {result && (
              <>
                <SectionLabel>主观认识（Belief 曲线输出）</SectionLabel>
                {result.beliefs.map((b) => (
                  <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, width: 96, color: T.text3 }}>{b.key}</span>
                    <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ height: 4, borderRadius: 2, background: T.exec, width: `${b.value * 100}%` }} />
                    </div>
                    <span style={{ fontSize: 10, width: 28, textAlign: 'right', color: T.text2 }}>{b.value.toFixed(2)}</span>
                  </div>
                ))}
                {result.snap.map((m, i) => (
                  <div key={i} style={{ marginTop: 14 }}>
                    <SectionLabel>{m.maker} → 最优：<b style={{ color: T.text1 }}>{m.best || '无'}</b></SectionLabel>
                    {m.decisions.map((d, j) => (
                      <div key={j} style={{ borderRadius: 8, border: `1px solid ${T.border}`, padding: 8, marginBottom: 6, background: T.panelDeep }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, width: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                          <div style={{ flex: 1, height: 5, borderRadius: 2.5, background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{ height: 5, borderRadius: 2.5, background: T.accent, width: `${Math.min(100, d.final * 100)}%` }} />
                          </div>
                          <span style={{ fontSize: 10, width: 36, textAlign: 'right', color: T.text2 }}>{d.final.toFixed(3)}</span>
                        </div>
                        {d.bestTarget && <div style={{ fontSize: 10, color: T.text3, marginTop: 3 }}>目标：{d.bestTarget}</div>}
                        {d.actions?.length > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                            <Zap size={10} style={{ color: T.exec }} />
                            <span style={{ fontSize: 10, color: T.exec }}>{d.execution?.mode || 'Sequence'}:</span>
                            {d.actions.map((a, k) => (
                              <span key={k} style={{ fontSize: 10, color: T.text2 }}>
                                {k > 0 && <span style={{ color: T.text3 }}> {d.execution?.mode === 'Parallel' ? '∥' : '→'} </span>}
                                {a.command || a.name}
                              </span>
                            ))}
                            {d.execution?.keepRunning && <Tag color={T.text3}>执行到底</Tag>}
                            {d.execution?.maxRepeat > 1 && <Tag color={T.text3}>×{d.execution.maxRepeat}</Tag>}
                          </div>
                        )}
                        <div style={{ marginTop: 5 }}>
                          {d.breakdown.map((b, k) => (
                            <div key={k} style={{ display: 'flex', gap: 6, fontSize: 9, color: T.text3 }}>
                              <span style={{ width: 92, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</span>
                              <span>raw {typeof b.raw === 'number' ? b.raw.toFixed(1) : b.raw}</span>
                              <span>→ {b.normalized.toFixed(2)}</span>
                              <span style={{ color: T.warn }}>曲线 {b.score.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
