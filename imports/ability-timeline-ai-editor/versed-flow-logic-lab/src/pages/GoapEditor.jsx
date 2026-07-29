// GOAP 编辑器 —— 一个规划器一张画布。
// 画布 = 动作池并列（自适应行高网格）+ 目标列 + 当前 WorldState 节点；
// 每个规划器持有自己的位定义(bits)/初始状态(initWs)/目标列/深度上限——WorldState 按规划器 CRUD；
// 模拟器设 Goal 与 WS 位开关总览，规划结果以动效从池里把动作链逐段连起来。
// 交互规范（与全部编辑器统一）：空白右键=联想添加 · 节点右键=操作菜单 · Delete=删除
// 左键拖空白=框选 · 右键/中键拖=平移 · Shift=多选 · 20px 吸附 · 缩远只显示标题（LOD）。
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import ReactFlow, { Background, BackgroundVariant, Controls, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import '@/components/aieditor/rf-dark.css';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Save, Trash2, Play, Zap, Flag, Crosshair, GitBranch, Pencil, X, Check, LocateFixed, Undo2, Redo2 } from 'lucide-react';
import { goapPlan } from '@/lib/ai/goap/goap.js';
import { GOAP_ACTIONS, WS_BITS } from '@/lib/ai/world4x/content.js';
import { createBitRegistry, createWorldState } from '@/lib/ai/core/knowledge.js';
import { UE, ueNodeBox, ueHeader, UE_RF_COMMON, UE_MINIMAP } from '@/components/aieditor/theme.js';
import { BitChipsEditor, BitChipsView } from '@/components/aieditor/bitchips.jsx';
import { NodeShell } from '@/components/aieditor/nodeshell.jsx';
import { useContextMenu, ContextMenu } from '@/components/aieditor/ctxmenu.jsx';
import { useHelperLines, HelperLines } from '@/components/aieditor/helperlines.jsx';
import { useUndoRedo } from '@/components/aieditor/usehistory.js';

const inputCls = 'h-7 text-xs bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]';
const GREEN = '#98989D';
const GREEN_LIT = '#E5E5EA';
const PURPLE = '#AEAEB2';
const COLS = 3, AW = 280, VGAP = 18; // 动作池网格列数与列宽

const bitOn = (registry, bits, name) => {
  const i = registry.index.get(name);
  return i !== undefined && (bits & (1 << i)) !== 0;
};

/* ---------- 自适应排版：按芯片内容估算节点高度 ---------- */
const chipW = (it) => Math.min(210, (it.val === false ? 8 : 0) + String(it.bit).length * 6.2 + 20);
const chipsH = (items) => {
  if (!items?.length) return 0;
  let w = 0, rows = 1;
  for (const it of items) {
    const cw = chipW(it) + 4;
    if (w + cw > 214) { rows++; w = 0; }
    w += cw;
  }
  return 12 + rows * 18; // 小标签行 + 芯片行
};
const actionH = (a) => 26 + 14 + chipsH(a.pre) + chipsH(a.eff) + 16;
const goalH = (g) => 26 + (g.desc ? 12 : 0) + chipsH(g.bits) + 14;

/* ---------- 默认内容：一组合理设计、且经验证可达的目标 ---------- */
const DEFAULT_GOALS = [
  { id: 'g_dev', name: '立足发展', desc: '三城 + 农田，站稳经济基本盘', bits: [{ bit: 'has_3cities' }, { bit: 'farm_built' }] },
  { id: 'g_eco', name: '经济繁荣', desc: '市场 → 商队 → 开通贸易线', bits: [{ bit: 'trade_route_active' }] },
  { id: 'g_def', name: '固若金汤', desc: '城墙 + 卫戍，保首都安全', bits: [{ bit: 'walls_built' }, { bit: 'capital_safe' }] },
  { id: 'g_intel', name: '情报网络', desc: '侦察北方 + 间谍潜入就位', bits: [{ bit: 'enemy_city_known' }, { bit: 'spy_in_position' }] },
  { id: 'g_diplo', name: '远交近攻', desc: '结盟远邦，同时对近敌宣战', bits: [{ bit: 'allied_qi' }, { bit: 'at_war' }] },
  { id: 'g_conq', name: '征服北方', desc: '全链路：军备→侦察→渗透→宣战→围攻（9 步）', bits: [{ bit: 'north_conquered' }] },
];

const newPlanner = (name) => ({
  id: 'p' + Math.random().toString(36).slice(2, 8), name,
  bits: [...WS_BITS], initWs: ['has_city'], actions: [], goals: [], maxDepth: 10,
});
const defaultPlanner = () => ({
  ...newPlanner('文明演进规划器'),
  actions: JSON.parse(JSON.stringify(GOAP_ACTIONS)),
  goals: JSON.parse(JSON.stringify(DEFAULT_GOALS)),
});
// 旧数据迁移：补 bits/initWs/maxDepth
const migrate = (p) => ({
  bits: [...WS_BITS], initWs: ['has_city'], maxDepth: 10, goals: [], actions: [], ...p,
});

/* ---------- 画布节点（统一节点壳） ---------- */

function WsNode({ data }) {
  return (
    <NodeShell color="#4a4a52" icon={Flag} typeLabel="WorldState" title="当前 WorldState" width={224} lit={data.lit} leftIn={false}>
      {data.onBits.length
        ? <BitChipsView items={data.onBits.map((bit) => ({ bit }))} bg="rgba(255,255,255,0.08)" fg="#D1D1D6" />
        : <span className="text-[9px]" style={{ color: UE.faint }}>（全部位关闭）</span>}
    </NodeShell>
  );
}

function ActionNode({ data }) {
  const { a, lit, dim, sel } = data;
  return (
    <NodeShell color={GREEN} litColor={GREEN_LIT} icon={Zap} title={a.name} width={234}
      selected={sel} lit={lit} dim={dim}
      badge={<span className="ml-auto text-[9px] px-1 rounded shrink-0" style={{ background: '#00000044', color: UE.nodeTitle }}>代价 {a.cost ?? 1}</span>}>
      <div className="text-[9px] font-mono truncate" style={{ color: '#C7C7CC' }}>▸ {a.impl || a.name}</div>
      {(a.pre || []).length > 0 && (
        <div className="mt-1">
          <div className="text-[8px] uppercase tracking-wider" style={{ color: UE.faint }}>前件 pre</div>
          <BitChipsView items={a.pre} />
        </div>
      )}
      {(a.eff || []).length > 0 && (
        <div className="mt-1">
          <div className="text-[8px] uppercase tracking-wider" style={{ color: UE.faint }}>效果 eff</div>
          <BitChipsView items={a.eff} prefix="→" bg="rgba(255,255,255,0.08)" fg="#D1D1D6" />
        </div>
      )}
    </NodeShell>
  );
}

function GoalNode({ data }) {
  const { g, lit, sel } = data;
  return (
    <NodeShell color={PURPLE} litColor="#F5F5F7" icon={Crosshair} title={g.name} width={214}
      selected={sel} lit={lit} rightOut={false}>
      {g.desc && <div className="text-[8px] leading-snug mb-0.5" style={{ color: UE.faint }}>{g.desc}</div>}
      <BitChipsView items={g.bits || []} bg="#4a3a68" fg="#d8c8f0" />
    </NodeShell>
  );
}

const nodeTypes = { ws: WsNode, action: ActionNode, goal: GoalNode };

/* ---------- 主组件 ---------- */

export default function GoapEditor() {
  const [row, setRow] = useState(null);
  const [planners, setPlanners] = useState(null);
  const [selP, setSelP] = useState(0);
  const [selA, setSelA] = useState(null);
  const [tab, setTab] = useState('sim'); // sim | edit
  const [dirty, setDirty] = useState(false);
  const [selG, setSelG] = useState(0);
  const [plan, setPlan] = useState(undefined);
  const [reveal, setReveal] = useState(0);
  const [openGoal, setOpenGoal] = useState(null); // 左栏展开的 goal 下标
  const [editBit, setEditBit] = useState(null);   // 正在改名的位名
  const [newBit, setNewBit] = useState('');
  const posRef = useRef({});
  const rfRef = useRef(null);
  const { menu, open: openMenu, close: closeMenu } = useContextMenu();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const hl = useHelperLines(nodes, setNodes, () => rfRef.current?.getViewport().zoom ?? 1);

  useEffect(() => {
    (async () => {
      let list = await base44.entities.GoapLibrary.list();
      if (!list.length) {
        await base44.entities.GoapLibrary.create({ name: 'main', data: { planners: [defaultPlanner()] } });
        list = await base44.entities.GoapLibrary.list();
      }
      setRow(list[0]);
      const data = typeof list[0].data === 'string' ? JSON.parse(list[0].data) : list[0].data;
      setPlanners((data.planners || [{ actions: data.actions || [] }]).map(migrate));
    })();
  }, []);

  const P = planners?.[selP] ?? null;
  const registry = useMemo(() => createBitRegistry(P?.bits || WS_BITS), [P]);

  const mutate = (fn) => { setPlanners((ps) => { const c = JSON.parse(JSON.stringify(ps)); fn(c); return c; }); setDirty(true); };
  const mutateP = (fn) => mutate((c) => fn(c[selP]));
  const save = async () => { await base44.entities.GoapLibrary.update(row.id, { data: { planners } }); setDirty(false); };

  // 撤销/重做（快照=全部规划器；库内切换规划器属于同一文档导航，不清历史）
  const ur = useUndoRedo(
    useCallback(() => (planners ? JSON.stringify(planners) : null), [planners]),
    useCallback((s) => {
      const ps = JSON.parse(s);
      setPlanners(ps);
      setSelP((i) => Math.min(i, ps.length - 1));
      setSelA(null); setSelG(0); setOpenGoal(null); setPlan(undefined);
      setDirty(true);
    }, []),
    [planners]);

  // 动作/目标增删后，池内下标移位——对应前缀的拖动位置缓存全部失效，清掉重排
  const clearPos = (prefix) => { for (const k of Object.keys(posRef.current)) if (k.startsWith(prefix)) delete posRef.current[k]; };

  const addActionAt = (flowPos) => {
    const idx = P.actions.length;
    mutateP((p) => { p.actions.push({ name: 'new_action', pre: [], eff: [], cost: 1, impl: 'wait' }); });
    if (flowPos) posRef.current[`a${idx}`] = flowPos;
    setSelA(idx); setTab('edit'); setPlan(undefined);
  };
  const deleteActions = (idxs) => {
    mutateP((p) => { [...idxs].sort((a, b) => b - a).forEach((i) => p.actions.splice(i, 1)); });
    clearPos('a'); setSelA(null); setPlan(undefined);
  };
  const addGoal = () => {
    mutateP((p) => { p.goals.push({ id: 'g' + Date.now(), name: `目标 ${p.goals.length + 1}`, desc: '', bits: [] }); });
    setOpenGoal(P.goals.length); setSelG(P.goals.length);
  };
  const deleteGoals = (idxs) => {
    mutateP((p) => { [...idxs].sort((a, b) => b - a).forEach((i) => p.goals.splice(i, 1)); });
    clearPos('g'); setSelG(0); setOpenGoal(null); setPlan(undefined);
  };

  /* ---------- WorldState 位 CRUD（按规划器） ---------- */
  const addBit = () => {
    const name = newBit.trim().toLowerCase().replace(/\s+/g, '_');
    if (!name || P.bits.includes(name)) return;
    mutateP((p) => { p.bits.push(name); });
    setNewBit('');
  };
  const renameBit = (oldName, name) => {
    name = (name || '').trim().toLowerCase().replace(/\s+/g, '_');
    setEditBit(null);
    if (!name || name === oldName || P.bits.includes(name)) return;
    mutateP((p) => {
      p.bits = p.bits.map((b) => (b === oldName ? name : b));
      p.initWs = (p.initWs || []).map((b) => (b === oldName ? name : b));
      const fix = (items) => items?.forEach((it) => { if (it.bit === oldName) it.bit = name; });
      p.actions.forEach((a) => { fix(a.pre); fix(a.eff); });
      p.goals.forEach((g) => fix(g.bits));
    });
  };
  const deleteBit = (name) => {
    mutateP((p) => {
      p.bits = p.bits.filter((b) => b !== name);
      p.initWs = (p.initWs || []).filter((b) => b !== name);
    });
    if (editBit === name) setEditBit(null);
  };
  const toggleBit = (name) => mutateP((p) => {
    p.initWs = (p.initWs || []).includes(name) ? p.initWs.filter((b) => b !== name) : [...(p.initWs || []), name];
  });

  /* ---------- 规划 ---------- */
  const plan_ = () => {
    const goal = P?.goals?.[selG];
    if (!goal) return;
    const ws = createWorldState(registry);
    ws.bits = 0;
    for (const n of P.initWs || []) ws.set(n, true);
    const result = goapPlan({ actions: P.actions, ws, goal: goal.bits, maxDepth: P.maxDepth ?? 10 });
    if (!result) { setPlan({ fail: true }); return; }
    if (result.length === 0) { setPlan({ empty: true }); return; }
    let bits = ws.bits, cum = 0;
    const steps = result.map((a) => {
      const idx = P.actions.indexOf(a);
      const okMap = {};
      for (const p of a.pre || []) okMap[p.bit] = bitOn(registry, bits, p.bit) === (p.val !== false);
      cum += a.cost ?? 1;
      const after = ws.applyEffects(a.eff || [], bits);
      const s = { a, idx, okMap, cum, after };
      bits = after;
      return s;
    });
    const { mask, expect } = ws.goalMask(goal.bits);
    setPlan({ steps, total: cum, final: bits, goalOk: (bits & mask) === expect });
  };

  /* ---------- 链动效：边逐段出现 ---------- */
  const chainEdges = useMemo(() => {
    if (!plan?.steps?.length) return [];
    const seq = ['ws', ...plan.steps.map((s) => `a${s.idx}`), `g${selG}`];
    return seq.slice(1).map((t, k) => ({
      id: `c${k}`, source: seq[k], target: t, sourceHandle: 'out', targetHandle: 'in',
      animated: true, deletable: false,
      style: { stroke: GREEN_LIT, strokeWidth: 2.5 },
    }));
  }, [plan, selG]);

  useEffect(() => {
    if (!plan?.steps?.length) { setReveal(0); return; }
    setReveal(0);
    const total = plan.steps.length + 1;
    const tm = setInterval(() => setReveal((r) => { if (r >= total) { clearInterval(tm); return r; } return r + 1; }), 420);
    return () => clearInterval(tm);
  }, [plan]);

  useEffect(() => { setEdges(chainEdges.slice(0, reveal)); }, [chainEdges, reveal, setEdges]);

  const planAll = useMemo(() => new Set(plan?.steps?.map((s) => s.idx) || []), [plan]);
  const litSet = useMemo(() => new Set((plan?.steps || []).slice(0, reveal).map((s) => s.idx)), [plan, reveal]);

  /* ---------- 画布节点构造（自适应行高） ---------- */
  useEffect(() => {
    if (!P) return;
    const pos = (id, def) => posRef.current[id] || def;
    // 动作池：行高 = 该行最高卡，逐行累加——内容再多的卡也不会压到下一行
    const rowHs = [];
    P.actions.forEach((a, i) => { const r = Math.floor(i / COLS); rowHs[r] = Math.max(rowHs[r] || 0, actionH(a)); });
    const rowY = []; let y = 150;
    rowHs.forEach((h) => { rowY.push(y); y += h + VGAP; });
    const ns = [{
      id: 'ws', type: 'ws', position: pos('ws', { x: 0, y: 0 }), deletable: false,
      data: { onBits: P.initWs || [], lit: reveal >= 1 },
    }];
    P.actions.forEach((a, i) => {
      ns.push({
        id: `a${i}`, type: 'action',
        position: pos(`a${i}`, { x: (i % COLS) * AW, y: rowY[Math.floor(i / COLS)] ?? 150 }),
        data: { a, lit: litSet.has(i), dim: !!plan?.steps && !planAll.has(i), sel: selA === i },
      });
    });
    let gy = 150;
    P.goals.forEach((g, i) => {
      ns.push({
        id: `g${i}`, type: 'goal', position: pos(`g${i}`, { x: COLS * AW + 90, y: gy }),
        data: { g, lit: i === selG && !!plan?.steps && reveal >= plan.steps.length + 1, sel: i === selG },
      });
      gy += goalH(g) + 14;
    });
    setNodes(ns);
  }, [P, litSet, planAll, reveal, selA, selG, plan, setNodes]);

  /* ---------- 画布交互：右键联想 / Delete 删除 ---------- */
  const onPaneContextMenu = (e) => {
    const fp = rfRef.current?.project({ x: e.clientX, y: e.clientY });
    openMenu(e, [
      { icon: Zap, color: GREEN, label: '添加动作', hint: '落在此位置', onClick: () => addActionAt(fp) },
      { icon: Crosshair, color: PURPLE, label: '添加目标', hint: '目标列', onClick: () => addGoal() },
    ]);
  };
  const onNodeContextMenu = (e, n) => {
    if (n.id.startsWith('a')) {
      const i = +n.id.slice(1);
      openMenu(e, [
        { icon: Pencil, label: '编辑动作', onClick: () => { setSelA(i); setTab('edit'); } },
        { icon: Trash2, color: UE.err, label: '删除动作', hint: 'Del', onClick: () => deleteActions([i]) },
      ]);
    } else if (n.id.startsWith('g')) {
      const i = +n.id.slice(1);
      openMenu(e, [
        { icon: LocateFixed, label: '设为模拟目标', onClick: () => { setSelG(i); setTab('sim'); } },
        { icon: Pencil, label: '编辑目标位', onClick: () => { setSelG(i); setOpenGoal(i); } },
        { icon: Trash2, color: UE.err, label: '删除目标', hint: 'Del', onClick: () => deleteGoals([i]) },
      ]);
    }
  };
  const onNodesDelete = (deleted) => {
    const ai = [], gi = [];
    for (const n of deleted) {
      if (n.id.startsWith('a')) ai.push(+n.id.slice(1));
      else if (n.id.startsWith('g')) gi.push(+n.id.slice(1));
    }
    if (ai.length) deleteActions(ai);
    if (gi.length) deleteGoals(gi);
  };

  if (!planners || !P) return <div className="h-full flex items-center justify-center text-sm" style={{ background: UE.canvas, color: UE.faint }}>加载中…</div>;

  const selAction = selA !== null ? P.actions[selA] : null;
  const sectionLabel = (t) => <Label className="text-[10px]" style={{ color: UE.dim }}>{t}</Label>;

  return (
    <div className="h-full flex" style={{ background: UE.canvas, color: UE.text }}>
      {/* 左：规划器与目标管理 */}
      <div className="w-56 shrink-0 flex flex-col" style={{ background: UE.panel, borderRight: `1px solid ${UE.border}` }}>
        <div className="p-3" style={{ borderBottom: `1px solid ${UE.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold flex items-center gap-1.5"><GitBranch className="w-4 h-4" />GOAP 规划器</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={ur.undo} disabled={!ur.canUndo} title="撤销 (Ctrl+Z)" className="h-7 w-7 p-0 hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.text }}><Undo2 className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={ur.redo} disabled={!ur.canRedo} title="重做 (Ctrl+Y)" className="h-7 w-7 p-0 hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.text }}><Redo2 className="w-3.5 h-3.5" /></Button>
              <Button size="sm" onClick={save} disabled={!dirty} className="h-7 text-xs text-black" style={{ background: UE.warn }}><Save className="w-3.5 h-3.5" /></Button>
            </div>
          </div>
          <div className="text-[10px]" style={{ color: UE.faint }}>一个规划器一张画布：各自的位定义 / 初始WS / 动作池 / 目标列</div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* 规划器列表 */}
          <div>
            {sectionLabel('规划器')}
            {planners.map((p, i) => (
              <button key={p.id} onClick={() => { setSelP(i); setSelA(null); setSelG(0); setPlan(undefined); setEditBit(null); }}
                className={`w-full text-left px-2 py-1.5 rounded mb-0.5 transition-colors ${selP === i ? 'bg-[rgba(255,255,255,0.10)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}>
                <div className="text-xs font-medium truncate" style={{ color: selP === i ? '#F5F5F7' : UE.text }}>{p.name}</div>
                <div className="text-[9px]" style={{ color: UE.faint }}>{p.actions.length} 动作 · {p.goals.length} 目标 · {p.bits.length} 位 · 深度≤{p.maxDepth ?? 10}</div>
              </button>
            ))}
            <Button size="sm" variant="outline" className="w-full text-xs border-[#2e2e36] mt-1" style={{ color: UE.text }}
              onClick={() => { mutate((c) => { c.push(newPlanner(`规划器 ${c.length + 1}`)); }); setSelP(planners.length); setSelA(null); setPlan(undefined); }}>
              <Plus className="w-3.5 h-3.5 mr-1" />规划器
            </Button>
          </div>
          {/* 当前规划器设置 */}
          <div className="rounded p-2 space-y-2" style={{ background: '#1a1a1f', border: `1px solid ${UE.border}` }}>
            {sectionLabel('当前规划器')}
            <Input value={P.name} onChange={(e) => mutateP((p) => { p.name = e.target.value; })} className={`${inputCls} w-full`} />
            <div>
              {sectionLabel(`最大规划深度 ${P.maxDepth ?? 10}`)}
              <input type="range" min={2} max={14} value={P.maxDepth ?? 10} onChange={(e) => mutateP((p) => { p.maxDepth = +e.target.value; })} className="w-full accent-[#E8E8ED]" />
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1 text-xs border-[#2e2e36]" style={{ color: UE.text }}
                onClick={() => addActionAt(null)}>
                <Plus className="w-3.5 h-3.5 mr-1" />动作
              </Button>
              <Button size="sm" variant="outline" className="text-xs border-[#2e2e36]" style={{ color: UE.err }} disabled={planners.length <= 1}
                onClick={() => { mutate((c) => { c.splice(selP, 1); }); setSelP(0); setSelA(null); setPlan(undefined); }}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          {/* 目标列表 */}
          <div>
            {sectionLabel('目标列（点目标名编辑）')}
            {P.goals.map((g, i) => (
              <div key={g.id || i} className="rounded mb-1" style={{ background: '#1a1a1f', border: `1px solid ${openGoal === i ? PURPLE : UE.border}` }}>
                <div className="flex items-center gap-1 px-1.5 py-1">
                  <button className="flex-1 text-left" onClick={() => { setOpenGoal(openGoal === i ? null : i); setSelG(i); }}>
                    <div className="text-xs font-medium truncate" style={{ color: selG === i ? '#c8aee8' : UE.text }}><Crosshair className="w-3 h-3 inline mr-1" />{g.name}</div>
                    {g.desc && <div className="text-[9px] truncate" style={{ color: UE.faint }}>{g.desc}</div>}
                  </button>
                  <button onClick={() => deleteGoals([i])}
                    className="p-0.5 rounded hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.faint }}><Trash2 className="w-3 h-3" /></button>
                </div>
                {openGoal === i && (
                  <div className="px-1.5 pb-1.5 space-y-1">
                    <Input value={g.name} onChange={(e) => mutateP((p) => { p.goals[i].name = e.target.value; })} className={`${inputCls} w-full`} />
                    <Input value={g.desc || ''} placeholder="一句话描述" onChange={(e) => mutateP((p) => { p.goals[i].desc = e.target.value; })} className={`${inputCls} w-full`} />
                    <BitChipsEditor items={g.bits || []} bits={registry.list} addLabel="+目标位" onChange={(v) => mutateP((p) => { p.goals[i].bits = v; })} />
                  </div>
                )}
              </div>
            ))}
            <Button size="sm" variant="outline" className="w-full text-xs border-[#2e2e36]" style={{ color: UE.text }} onClick={addGoal}>
              <Plus className="w-3.5 h-3.5 mr-1" />目标
            </Button>
          </div>
        </div>
      </div>

      {/* 中：画布 */}
      <div className="flex-1 relative min-w-0">
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onInit={(inst) => { rfRef.current = inst; }}
          onNodeDrag={hl.onDrag}
          onNodeDragStop={(_, n) => { hl.clear(); posRef.current[n.id] = n.position; }}
          onNodeClick={(_, n) => {
            if (n.id.startsWith('a')) { setSelA(+n.id.slice(1)); setTab('edit'); }
            else if (n.id.startsWith('g')) { setSelG(+n.id.slice(1)); setTab('sim'); }
          }}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onNodesDelete={onNodesDelete}
          nodesConnectable={false}
          {...UE_RF_COMMON}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} color={UE.grid} gap={20} size={1.2} />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={(n) => (n.id === 'ws' ? '#4a4a52' : n.id.startsWith('g') ? PURPLE : GREEN)} {...UE_MINIMAP} />
          <HelperLines x={hl.helper.x} y={hl.helper.y} />
        </ReactFlow>
        <div className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded pointer-events-none" style={{ background: '#1a1a1fcc', color: UE.faint }}>
          {P.name} · 动作池 {P.actions.length} · 目标 {P.goals.length} · 右键联想菜单 · Del 删除 · 缩远只显标题
        </div>
        <ContextMenu menu={menu} onClose={closeMenu} />
      </div>

      {/* 右：模拟器 / 动作编辑 */}
      <div className="w-[21rem] shrink-0 flex flex-col" style={{ background: UE.panel, borderLeft: `1px solid ${UE.border}` }}>
        <div className="flex" style={{ borderBottom: `1px solid ${UE.border}` }}>
          {[['sim', '模拟器'], ['edit', '动作编辑']].map(([k, t]) => (
            <button key={k} onClick={() => setTab(k)}
              className="flex-1 py-2 text-xs font-medium transition-colors"
              style={{ color: tab === k ? '#F5F5F7' : UE.faint, borderBottom: tab === k ? '2px solid #E8E8ED' : '2px solid transparent' }}>{t}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {tab === 'sim' ? (
            <div>
              {sectionLabel('模拟目标（点击画布目标节点也可切换）')}
              {P.goals.length === 0 ? (
                <div className="text-xs rounded p-2 mb-3" style={{ color: UE.warn, background: '#2e2a1a' }}>当前规划器还没有目标——先在左栏「+目标」。</div>
              ) : (
                <div className="space-y-0.5 mb-3">
                  {P.goals.map((g, i) => (
                    <button key={g.id || i} onClick={() => setSelG(i)}
                      className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${selG === i ? 'bg-[rgba(255,255,255,0.10)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}
                      style={{ color: selG === i ? '#c8aee8' : UE.text }}>
                      <Crosshair className="w-3 h-3 inline mr-1" />{g.name}
                      <span className="ml-1 text-[9px]" style={{ color: UE.faint }}>{(g.bits || []).map((b) => (b.val === false ? '¬' : '') + b.bit).join(' ')}</span>
                    </button>
                  ))}
                </div>
              )}

              {sectionLabel('当前 WorldState（本规划器的位 · 开关即初始状态）')}
              <div className="rounded p-1 mb-1 max-h-60 overflow-y-auto" style={{ background: '#1a1a1f', border: `1px solid ${UE.border}` }}>
                {P.bits.map((b) => {
                  const on = (P.initWs || []).includes(b);
                  if (editBit === b) {
                    return (
                      <div key={b} className="flex items-center gap-1 px-1 py-0.5">
                        <Input defaultValue={b} autoFocus key={`eb${b}`}
                          onKeyDown={(e) => { if (e.key === 'Enter') renameBit(b, e.target.value); if (e.key === 'Escape') setEditBit(null); }}
                          onBlur={(e) => renameBit(b, e.target.value)}
                          className={`${inputCls} flex-1 h-6 font-mono`} />
                        <Check className="w-3 h-3 shrink-0" style={{ color: UE.ok }} />
                      </div>
                    );
                  }
                  return (
                    <div key={b} className="group flex items-center rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                      <button onClick={() => toggleBit(b)} className="flex-1 flex items-center gap-2 px-1.5 py-1 text-left">
                        <span className="w-6 h-3.5 rounded-full relative shrink-0 transition-colors" style={{ background: on ? UE.ok : '#3a3a42' }}>
                          <span className="absolute w-2.5 h-2.5 rounded-full bg-white transition-all" style={{ top: 2, left: on ? 12 : 2 }} />
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: on ? UE.text : UE.faint }}>{b}</span>
                      </button>
                      <button onClick={() => setEditBit(b)} title="改名（同步替换所有引用）"
                        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#3a3a42] transition-opacity" style={{ color: UE.faint }}>
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={() => deleteBit(b)} title="从本规划器删除该位"
                        className="p-1 mr-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#3a3a42] transition-opacity" style={{ color: UE.err }}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1 mb-3">
                <Input value={newBit} placeholder="新位名，如 has_navy" onChange={(e) => setNewBit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addBit(); }} className={`${inputCls} flex-1 font-mono`} />
                <Button size="sm" variant="outline" onClick={addBit} className="h-7 text-xs border-[#2e2e36]" style={{ color: UE.text }}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button onClick={plan_} disabled={!P.goals.length} className="w-full h-8 text-xs text-black mb-3" style={{ background: UE.ok }}>
                <Play className="w-3.5 h-3.5 mr-1" />规划（A* 纯位状态）
              </Button>

              {plan !== undefined && (
                plan.fail ? (
                  <div className="text-xs rounded p-3" style={{ color: '#e08a8a', background: '#3a2a2e' }}>无规划：目标在当前动作池+深度内不可达。</div>
                ) : plan.empty ? (
                  <div className="text-xs rounded p-3" style={{ color: UE.ok, background: '#24382c' }}>目标已满足，无需动作。</div>
                ) : (
                  <div className="text-xs space-y-1.5">
                    <div style={{ color: UE.dim }}>
                      计划 {plan.steps.length} 步 · 总代价 {plan.total} · {plan.goalOk ? <span style={{ color: UE.ok }}>目标达成 ✓</span> : <span style={{ color: UE.warn }}>目标未完全覆盖</span>}
                    </div>
                    {plan.steps.map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded transition-opacity" style={{ background: '#1a1a1f', border: `1px solid ${UE.border}`, opacity: i < reveal ? 1 : 0.35 }}>
                        <Zap className="w-3 h-3 shrink-0" style={{ color: GREEN_LIT }} />
                        <span className="text-[10px] font-medium truncate" style={{ color: UE.text }}>#{i + 1} {s.a.name}</span>
                        <span className="ml-auto text-[9px] shrink-0" style={{ color: UE.faint }}>Σ {s.cum}</span>
                      </div>
                    ))}
                    <div className="text-[9px] leading-relaxed pt-1" style={{ color: UE.faint }}>
                      规划器只说"做什么"。执行时每条 impl 指令由指令总线下达，绑定同名模板图运行——改图（实现）不影响规划。
                    </div>
                  </div>
                )
              )}
            </div>
          ) : !selAction ? (
            <div className="h-full flex items-center justify-center text-xs text-center px-4" style={{ color: UE.faint }}>
              在画布上点击一个动作节点进行编辑（或空白处右键 → 添加动作）。动作卡 = 前件 + 效果 + 代价 + 实现指令，与 HTN 原语同一套语义。
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="relative" style={ueNodeBox(true)}>
                <div style={{ ...ueHeader(GREEN) }}>
                  <Zap className="w-3.5 h-3.5" style={{ color: UE.nodeTitle }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: UE.nodeTitle }}>动作 ACTION</span>
                  <span className="ml-auto text-[9px] px-1 rounded" style={{ background: '#00000044', color: UE.nodeTitle }}>#{selA + 1}</span>
                </div>
                <div className="p-3 space-y-2.5">
                  <div>
                    {sectionLabel('动作名')}
                    <Input value={selAction.name} onChange={(e) => mutateP((p) => { p.actions[selA].name = e.target.value; })} className={`${inputCls} w-full font-mono`} />
                  </div>
                  <div>
                    {sectionLabel('实现指令 impl（→ Graph 实验室同名模板图）')}
                    <Input value={selAction.impl || selAction.name} onChange={(e) => mutateP((p) => { p.actions[selA].impl = e.target.value; })} className={`${inputCls} w-full font-mono`} />
                    <div className="text-[9px] mt-0.5" style={{ color: UE.faint }}>cmd.{selAction.impl || selAction.name} · 执行时由指令总线下达并绑定模板图运行</div>
                  </div>
                  <div className="flex gap-3">
                    <div>
                      {sectionLabel('代价 cost')}
                      <Input type="number" value={selAction.cost ?? 1} onChange={(e) => mutateP((p) => { p.actions[selA].cost = +e.target.value; })} className={`${inputCls} w-20`} />
                    </div>
                    <div className="flex-1">
                      {sectionLabel('参数 JSON')}
                      <Input defaultValue={JSON.stringify(selAction.params || {})} key={`gp${selP}-${selA}`}
                        onBlur={(e) => { try { const v = JSON.parse(e.target.value); mutateP((p) => { p.actions[selA].params = v; }); } catch { /* 忽略非法 JSON */ } }}
                        className={`${inputCls} w-full font-mono`} />
                    </div>
                  </div>
                  <div>
                    {sectionLabel('前置条件 pre（全部满足才可进入规划展开）')}
                    <BitChipsEditor items={selAction.pre || []} bits={registry.list} addLabel="+前件位" onChange={(v) => mutateP((p) => { p.actions[selA].pre = v; })} />
                  </div>
                  <div>
                    {sectionLabel('效果 eff（规划期位模拟：预测执行后的世界）')}
                    <BitChipsEditor items={selAction.eff || []} bits={registry.list} addLabel="+效果位" onChange={(v) => mutateP((p) => { p.actions[selA].eff = v; })} />
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs border-[#2e2e36]" style={{ color: UE.err }}
                    onClick={() => deleteActions([selA])}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" />删除动作
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
