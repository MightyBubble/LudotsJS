// HTN 编辑器 —— 任务分解脑图（对齐 Fluid HTN 领域模型，XMind 逻辑图布局）。
// 画布：域根在最左，分支向右生长，子节点竖向排列、父节点垂直居中于子树带：
//   HTN 域 → GOAL（橙）→ 根复合任务（蓝）→ 方法（灰，前置条件芯片）→ 子任务递归；
// 原语（绿）带 command + 前置条件 + 后效芯片。连线 = XMind 式圆角括号肘线（右缘出 → 竖轨 → 左缘入）。
// 复合/方法节点可折叠（+N 徽标），默认折叠到第二层方法。
// 点击节点右栏编辑：goal 的 pre/achieved/priority、method 的条件与子任务序、
// 原语的前置/执行条件与后效（plan / plan_execute / permanent）。
import { useEffect, useMemo, useState, useCallback } from 'react';
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, Handle, Position,
  useNodesState, useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/components/aieditor/rf-dark.css';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Minus, Save, Trash2, Play, Network, ChevronRight, Crosshair, ListTree, Zap, ArrowLeft, ArrowRight,
  FoldVertical, UnfoldVertical, Brain, Undo2, Redo2,
} from 'lucide-react';
import { htnPlanGoal } from '@/lib/ai/htn/htn.js';
import { HTN_GRAND, WS_BITS } from '@/lib/ai/world4x/content.js';
import { createBitRegistry, createWorldState } from '@/lib/ai/core/knowledge.js';
import { UE, ueNodeBox, ueHeader, UE_MINIMAP } from '@/components/aieditor/theme.js';
import { MiniChips, BitChipsEditor, EFFECT_TYPES } from '@/components/aieditor/bitchips.jsx';
import { useContextMenu, ContextMenu } from '@/components/aieditor/ctxmenu.jsx';
import { useUndoRedo } from '@/components/aieditor/usehistory.js';

const inputCls = 'h-7 text-xs bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]';
const selCls = 'h-7 text-[11px] rounded px-1.5 bg-[#0E0F12] border border-[rgba(255,255,255,0.08)] text-[#d6d6dc]';
const genId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const KIND = {
  domain: { color: '#48484D', band: 'HTN 域' },
  goal: { color: '#D1D1D6', band: 'GOAL' },
  compound: { color: '#C7C7CC', band: '复合任务' },
  method: { color: '#7C7C80', band: '方法' },
  primitive: { color: '#98989D', band: '原语' },
  cycle: { color: '#55555A', band: '循环引用' },
  missing: { color: '#D96A75', band: '缺失任务' },
};

const W = { domain: 180, goal: 250, compound: 230, method: 230, primitive: 250, leaf: 190 };
// 定高节点（内容严格单行芯片，高度即排版输入，零估算误差）
const ROWH = { domain: 56, goal: 92, compound: 60, method: 68, primitive: 84, cycle: 44, missing: 44 };
const XLEVEL = 290, VGAP = 16; // 脑图：x=层级向右，y=子树带竖向分配

// XMind 式圆角括号肘线：父右缘 → 短横 → 竖轨（带圆角）→ 短横 → 子左缘
function MindEdge({ id, sourceX, sourceY, targetX, targetY, style }) {
  const r = 8;
  const mx = sourceX + 22;
  let d;
  if (Math.abs(targetY - sourceY) < 2) d = `M ${sourceX} ${sourceY} H ${targetX}`;
  else {
    const dy = targetY > sourceY ? 1 : -1;
    d = `M ${sourceX} ${sourceY} H ${mx - r} Q ${mx} ${sourceY} ${mx} ${sourceY + r * dy} V ${targetY - r * dy} Q ${mx} ${targetY} ${mx + r} ${targetY} H ${targetX}`;
  }
  return <path id={id} className="react-flow__edge-path" d={d} style={style} fill="none" />;
}
const edgeTypes = { mind: MindEdge };

// ── 脑图节点：定高 + 折叠开关 + 前置/后效芯片 + 分解路径高亮（lit/fail/dim） ──
function HtnNode({ data, selected }) {
  const k = data.kind;
  const cfg = KIND[k] || KIND.compound;
  const width = W[k] || 220;
  const hasChildren = k === 'domain' || k === 'goal' || ((k === 'compound' || k === 'method') && !data.collapsed);
  const box = data.fail
    ? { ...ueNodeBox(false), boxShadow: '0 0 0 1.5px #e05252aa', opacity: 0.55 }
    : data.lit
      ? { ...ueNodeBox(false), boxShadow: '0 0 0 1.5px #E8E8EDdd, 0 4px 14px #00000077' }
      : data.dim
        ? { ...ueNodeBox(selected), opacity: 0.25 }
        : ueNodeBox(selected);
  return (
    <div className="relative" style={{ width, height: ROWH[k] || 60, transition: 'opacity .3s, box-shadow .3s', ...box }}>
      {k !== 'domain' && (
        <Handle type="target" position={Position.Left} id="in"
          style={{ width: 8, height: 8, background: UE.exec, border: `2px solid ${UE.nodeBody}`, left: -4 }} />
      )}
      <div style={{ ...ueHeader(cfg.color), height: 22 }}>
        {k === 'domain' ? <Brain className="w-3.5 h-3.5" style={{ color: UE.nodeTitle }} />
          : k === 'goal' ? <Crosshair className="w-3.5 h-3.5" style={{ color: UE.nodeTitle }} />
          : k === 'primitive' ? <Zap className="w-3.5 h-3.5" style={{ color: UE.nodeTitle }} />
          : <ListTree className="w-3.5 h-3.5" style={{ color: UE.nodeTitle }} />}
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: UE.nodeTitle }}>{cfg.band}</span>
        {k === 'goal' && <span className="ml-auto text-[9px] px-1 rounded" style={{ background: '#00000044', color: UE.nodeTitle }}>P {data.goal.priority ?? 1}</span>}
        {k === 'compound' && <span className="ml-auto text-[9px] px-1 rounded" style={{ background: '#00000044', color: UE.nodeTitle }}>{(data.t.methods || []).length} 法</span>}
      </div>
      <div className="px-2.5 py-1 overflow-hidden">
        {k === 'domain' && (
          <>
            <div className="text-xs font-bold truncate" style={{ color: UE.text }}>{data.name}</div>
            <div className="text-[9px]" style={{ color: UE.faint }}>{data.count} 个 GOAL 分支</div>
          </>
        )}
        {k === 'goal' && (
          <>
            <div className="text-xs font-bold truncate" style={{ color: UE.text }}>{data.goal.name}</div>
            <div className="text-[9px] font-mono truncate" style={{ color: UE.faint }}>{data.goal.id} → {data.goal.task}</div>
            <MiniChips items={data.goal.pre} prefix="激:" color="rgba(255,255,255,0.10)" />
            <MiniChips items={data.goal.achieved} prefix="成:" color="rgba(255,255,255,0.08)" />
          </>
        )}
        {k === 'compound' && (
          <>
            <div className="text-xs font-semibold font-mono truncate" style={{ color: UE.text }}>{data.taskId}</div>
            {data.collapsed
              ? <div className="text-[9px] mt-1" style={{ color: UE.warn }}>⊕ {data.hidden} 个节点已折叠</div>
              : <MiniChips items={data.t.conditions} color="rgba(255,255,255,0.10)" />}
          </>
        )}
        {k === 'method' && (
          <>
            <div className="text-[11px] font-semibold truncate" style={{ color: UE.text }}>{data.m.name}</div>
            {data.collapsed
              ? <div className="text-[9px] mt-0.5" style={{ color: UE.warn }}>⊕ {data.hidden} 个节点已折叠</div>
              : <>
                  <MiniChips items={data.m.conditions} color="rgba(255,255,255,0.10)" />
                  <div className="text-[8px] mt-0.5" style={{ color: UE.faint }}>{(data.m.subtasks || []).length} 子任务按序展开</div>
                </>}
          </>
        )}
        {k === 'primitive' && (
          <>
            <div className="text-xs font-semibold font-mono truncate" style={{ color: UE.text }}>{data.taskId}</div>
            <div className="text-[9px] font-mono truncate" style={{ color: '#C7C7CC' }}>▸ {data.t.command}{data.t.params ? ` ${JSON.stringify(data.t.params)}` : ''}</div>
            <MiniChips items={data.t.conditions} color="rgba(255,255,255,0.10)" />
            <MiniChips items={data.t.effects} prefix="→" color="rgba(255,255,255,0.08)" />
          </>
        )}
        {(k === 'cycle' || k === 'missing') && (
          <div className="text-xs font-mono truncate" style={{ color: k === 'cycle' ? UE.dim : '#e08a8a' }}>{k === 'cycle' ? '↩ ' : '⚠ '}{data.label}</div>
        )}
      </div>
      {data.canCollapse && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); data.onToggle(); }}
          className="absolute -top-2 -right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: UE.panel, border: `1px solid ${UE.border}`, color: data.collapsed ? UE.warn : UE.dim }}
          title={data.collapsed ? '展开' : '折叠'}>
          {data.collapsed ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        </button>
      )}
      {hasChildren && (
        <Handle type="source" position={Position.Right} id="out"
          style={{ width: 8, height: 8, background: UE.exec, border: `2px solid ${UE.nodeBody}`, right: -4 }} />
      )}
    </div>
  );
}
const nodeTypes = { htnNode: HtnNode };

function countUnderTask(domain, taskId, seen = new Set()) {
  if (seen.has(taskId)) return 0;
  seen.add(taskId);
  const t = domain.tasks[taskId];
  if (!t || t.type !== 'compound') return 1;
  let n = 1;
  for (const m of t.methods || []) {
    n += 1;
    for (const s of m.subtasks || []) n += countUnderTask(domain, s, new Set(seen));
  }
  return n;
}

// XMind 脑图布局：两遍扫描（量子树高 → 定位），父节点垂直居中于子树带，层级向右
function layoutDomain(domain, collapsed, toggle) {
  const nodes = [], edges = [];
  const HH = (kind) => (ROWH[kind] || 60) + VGAP;
  const mkEdge = (a, b) => edges.push({
    id: `${a}|${b}`, type: 'mind', source: a, sourceHandle: 'out', target: b, targetHandle: 'in',
    style: { stroke: '#6a6a72', strokeWidth: 1.5 },
  });

  // key 链累积方法分支（g:x>task#m0>sub…）保证同域内全局唯一——
  // 否则同一 compound 的多个 method 引用同一子任务时，两个实例节点 id 相同必然重叠；
  // path 只存纯 taskId，专供循环引用检测。
  function measureTask(taskId, path, keyPrefix) {
    const t = domain.tasks[taskId];
    const key = `${keyPrefix}>${taskId}`;
    if (!t) return { kind: 'missing', key, h: HH('missing'), data: { kind: 'missing', label: taskId }, children: [] };
    if (t.type !== 'compound') return { kind: 'primitive', key, h: HH('primitive'), data: { kind: 'primitive', taskId, t, ref: { kind: 'task', taskId } }, children: [] };
    if (path.includes(taskId) || path.length >= 9) return { kind: 'cycle', key: `${key}@c`, h: HH('cycle'), data: { kind: 'cycle', label: taskId }, children: [] };
    const isCol = collapsed.has(key);
    const data = {
      kind: 'compound', taskId, t, ref: { kind: 'task', taskId },
      canCollapse: true, collapsed: isCol, hidden: isCol ? countUnderTask(domain, taskId) - 1 : 0,
      onToggle: () => toggle(key),
    };
    if (isCol) return { kind: 'compound', key, h: HH('compound'), data, children: [] };
    const kids = (t.methods || []).map((m, mi) => measureMethod(taskId, m, mi, key, path));
    return { kind: 'compound', key, h: Math.max(HH('compound'), kids.reduce((s, c) => s + c.h, 0)), data, children: kids };
  }
  function measureMethod(taskId, m, mi, parentKey, path) {
    const key = `${parentKey}#m${mi}`;
    const isCol = collapsed.has(key);
    const data = {
      kind: 'method', taskId, m, mi, ref: { kind: 'method', taskId, mi },
      canCollapse: true, collapsed: isCol, hidden: isCol ? (m.subtasks || []).reduce((s, st) => s + countUnderTask(domain, st), 0) : 0,
      onToggle: () => toggle(key),
    };
    if (isCol) return { kind: 'method', key, h: HH('method'), data, children: [] };
    const kids = (m.subtasks || []).map((s) => measureTask(s, [...path, taskId], key));
    return { kind: 'method', key, h: Math.max(HH('method'), kids.reduce((s, c) => s + c.h, 0)), data, children: kids };
  }

  function place(n, depth, yTop) {
    nodes.push({
      id: n.key, type: 'htnNode',
      position: { x: depth * XLEVEL, y: yTop + n.h / 2 - (ROWH[n.kind] || 60) / 2 },
      data: n.data,
    });
    let cy = yTop;
    for (const c of n.children) { place(c, depth + 1, cy); cy += c.h; mkEdge(n.key, c.key); }
  }

  const goalNodes = (domain.goals || []).map((g) => {
    const t = measureTask(g.task, [], `g:${g.id}`);
    return {
      kind: 'goal', key: `g:${g.id}`, h: Math.max(HH('goal'), t.h),
      data: { kind: 'goal', goal: g, ref: { kind: 'goal', goalId: g.id } },
      children: [t],
    };
  });
  const root = {
    kind: 'domain', key: 'domain',
    h: Math.max(HH('domain'), goalNodes.reduce((s, c) => s + c.h, 0)),
    data: { kind: 'domain', name: domain.name || 'grand', count: goalNodes.length },
    children: goalNodes,
  };
  place(root, 0, 0);
  return { nodes, edges };
}

// 默认折叠：第二层方法起（goal → 根任务 → 方法可见，再深一层的方法默认收起，逐层 + 展开）
// key 链规则与 layoutDomain 完全一致（g:x>task#m0>sub…），否则折叠状态对不上
function defaultCollapsed(domain) {
  const set = new Set();
  function walk(taskId, path, keyPrefix, depth) {
    const t = domain.tasks[taskId];
    if (!t || t.type !== 'compound' || path.includes(taskId) || depth >= 9) return;
    const key = `${keyPrefix}>${taskId}`;
    (t.methods || []).forEach((m, mi) => {
      const mkey = `${key}#m${mi}`;
      if (depth + 1 >= 4) set.add(mkey);
      (m.subtasks || []).forEach((s) => walk(s, [...path, taskId], mkey, depth + 2));
    });
  }
  for (const g of domain.goals || []) walk(g.task, [], `g:${g.id}`, 1);
  return set;
}

// 分解 trace → 脑图 key 链：把 htnPlanGoal 的线性 trace 重建为路径节点集合。
// steps = 按 trace 顺序的回放帧；okKeys = 成功路径；failKeys = 被回退（fallback/条件失败）的分支。
// key 链规则与 layoutDomain 一致（g:x>task#m0>sub…），深度用 trace 的 depth 栈维护父子关系。
function buildPath(trace, goalId) {
  const steps = [], okKeys = new Set(), failKeys = new Set();
  const stack = []; // {d, key}：当前嵌套路径（d = trace depth）
  const parentOf = (d) => {
    for (let i = stack.length - 1; i >= 0; i--) if (stack[i].d < d) return stack[i].key;
    return `g:${goalId}`;
  };
  const mark = (key, kind, ok = true) => {
    steps.push({ key, kind });
    (ok ? okKeys : failKeys).add(key);
  };
  if (goalId) { mark(`g:${goalId}`, 'goal'); stack.push({ d: 0, key: `g:${goalId}` }); }
  for (const e of trace || []) {
    if (e.kind === 'goal') continue;
    if (e.kind === 'method') {
      const tk = `${parentOf(e.depth)}>${e.task}`;
      if (!okKeys.has(tk) && !failKeys.has(tk)) mark(tk, 'task');
      stack.push({ d: e.depth, key: tk });
      const mk = `${tk}#m${e.index}`;
      mark(mk, 'method');
      stack.push({ d: e.depth, key: mk });
    } else if (e.kind === 'primitive') {
      const pk = `${parentOf(e.depth)}>${e.task}`;
      mark(pk, 'primitive');
      stack.push({ d: e.depth, key: pk });
    } else if (e.kind === 'cond_fail') {
      mark(`${parentOf(e.depth)}>${e.task}`, 'cond_fail', false);
    } else if (e.kind === 'fallback') {
      // 该 compound（depth d）内已展开的全部内容 + 刚失败的 method 都标记为回退分支
      while (stack.length && stack[stack.length - 1].d > e.depth) {
        const f = stack.pop();
        if (okKeys.has(f.key)) { okKeys.delete(f.key); failKeys.add(f.key); }
      }
      if (stack.length && stack[stack.length - 1].d === e.depth && stack[stack.length - 1].key.includes('#m')) {
        const f = stack.pop();
        if (okKeys.has(f.key)) { okKeys.delete(f.key); failKeys.add(f.key); }
      }
    }
  }
  return { steps, okKeys, failKeys };
}

export default function HtnEditor() {
  const [row, setRow] = useState(null);
  const [domains, setDomains] = useState([]);
  const [domain, setDomain] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [sel, setSel] = useState(null); // {kind:'goal'|'task'|'method', goalId?|taskId, mi?}
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [testGoal, setTestGoal] = useState('');
  const [initBits, setInitBits] = useState({ has_city: true });
  const [result, setResult] = useState(null);
  const [pathInfo, setPathInfo] = useState(null); // 分解路径 {steps, okKeys, failKeys}
  const [pathStep, setPathStep] = useState(0);    // 回放进度
  const [pathSettled, setPathSettled] = useState(false); // 回放完毕 → 成败分支定色
  const { menu, open: openMenu, close: closeMenu } = useContextMenu();
  const registry = useMemo(() => createBitRegistry(WS_BITS), []);
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);

  // 撤销/重做（快照=当前域；切换域时清历史——见 loadRow）
  const ur = useUndoRedo(
    useCallback(() => (domain ? JSON.stringify(domain) : null), [domain]),
    useCallback((s) => {
      const d = JSON.parse(s);
      setDomain(d);
      setCollapsed(defaultCollapsed(d));
      setSel(null); setResult(null); setPathInfo(null);
      setDirty(true);
    }, []),
    [domain]);

  useEffect(() => {
    (async () => {
      let list = await base44.entities.HtnDomain.list();
      if (!list.length) {
        await base44.entities.HtnDomain.create({ name: 'grand', data: HTN_GRAND });
        list = await base44.entities.HtnDomain.list();
      }
      setDomains(list);
      loadRow(list[0]);
    })();
  }, []);

  // 载入一个域行（含旧格式迁移）；重置画布相关状态
  const loadRow = async (r0) => {
    if (!r0) return;
    let data = typeof r0.data === 'string' ? JSON.parse(r0.data) : r0.data;
    if (!data?.goals) {
      data = JSON.parse(JSON.stringify(HTN_GRAND));
      await base44.entities.HtnDomain.update(r0.id, { data });
    }
    setRow(r0);
    setDomain(JSON.parse(JSON.stringify(data)));
    setCollapsed(defaultCollapsed(data));
    setSel(null);
    setResult(null);
    setDirty(false);
    ur.clear();
  };

  const switchDomain = (i) => {
    if (row?.id === domains[i]?.id) return;
    if (dirty && !window.confirm('当前域有未保存修改，切换将丢弃，继续？')) return;
    loadRow(domains[i]);
  };

  const addDomain = async () => {
    const data = { name: `新域 ${domains.length + 1}`, goals: [], tasks: {} };
    await base44.entities.HtnDomain.create({ name: data.name, data });
    const list = await base44.entities.HtnDomain.list();
    setDomains(list);
    loadRow(list[list.length - 1]);
  };

  const removeDomain = async () => {
    if (domains.length <= 1) return;
    if (!window.confirm(`删除域「${row.name}」？此操作不可恢复。`)) return;
    await base44.entities.HtnDomain.delete(row.id);
    const list = await base44.entities.HtnDomain.list();
    setDomains(list);
    loadRow(list[0]);
  };

  const renameDomain = (name) => {
    setRow((r) => ({ ...r, name }));
    mutate((d) => { d.name = name; });
  };

  const toggle = useCallback((key) => {
    setCollapsed((prev) => { const n = new Set(prev); if (n.has(key)) n.delete(key); else n.add(key); return n; });
  }, []);

  const mutate = (fn) => { setDomain((d) => { const c = JSON.parse(JSON.stringify(d)); fn(c); return c; }); setDirty(true); };
  const save = async () => {
    await base44.entities.HtnDomain.update(row.id, { name: row.name, data: domain });
    setDomains((ds) => ds.map((r) => (r.id === row.id ? { ...r, name: row.name } : r)));
    setDirty(false);
  };

  // 树布局（domain / 折叠态变化即时重排）；分解路径高亮注入 lit/fail/dim
  useEffect(() => {
    if (!domain) { setRfNodes([]); setRfEdges([]); return; }
    const { nodes, edges } = layoutDomain(domain, collapsed, toggle);
    if (pathInfo) {
      const litNow = new Set(pathInfo.steps.slice(0, pathStep).map((s) => s.key));
      for (const n of nodes) {
        if (pathSettled) {
          if (pathInfo.okKeys.has(n.id)) n.data = { ...n.data, lit: true };
          else if (pathInfo.failKeys.has(n.id)) n.data = { ...n.data, fail: true };
          else n.data = { ...n.data, dim: true };
        } else if (litNow.has(n.id)) {
          n.data = { ...n.data, lit: true };
        }
      }
    }
    setRfNodes(nodes); setRfEdges(edges);
  }, [domain, collapsed, toggle, pathInfo, pathStep, pathSettled, setRfNodes, setRfEdges]);

  // 路径回放动效：按 trace 顺序逐节点点亮，走完停顿后成败分支定色
  useEffect(() => {
    if (!pathInfo) { setPathStep(0); setPathSettled(false); return; }
    setPathStep(0); setPathSettled(false);
    let settle = null;
    const tm = setInterval(() => setPathStep((s) => {
      if (s >= pathInfo.steps.length) {
        clearInterval(tm);
        settle = setTimeout(() => setPathSettled(true), 400);
        return s;
      }
      return s + 1;
    }), 230);
    return () => { clearInterval(tm); if (settle) clearTimeout(settle); };
  }, [pathInfo]);

  const onNodeClick = useCallback((_, n) => setSel(n.data.ref || null), []);

  const decompose = () => {
    const ws = createWorldState(registry);
    Object.entries(initBits).forEach(([k, v]) => ws.set(k, !!v));
    try {
      const r = htnPlanGoal(domain, ws, testGoal ? { goalId: testGoal } : {});
      setResult(r);
      if (r?.trace) {
        setCollapsed(new Set()); // 展开全部，保证路径节点都在画布上
        setPathInfo(buildPath(r.trace, r.goal?.id));
      } else {
        setPathInfo(null);
      }
    } catch (e) { setResult({ error: e.message }); setPathInfo(null); }
  };

  if (!domain) return <div className="h-full flex items-center justify-center text-sm" style={{ background: UE.canvas, color: UE.faint }}>加载中…</div>;
  const taskIds = Object.keys(domain.tasks);
  const compoundIds = taskIds.filter((id) => domain.tasks[id].type === 'compound');
  const selGoal = sel?.kind === 'goal' ? (domain.goals || []).find((g) => g.id === sel.goalId) : null;
  const selTask = sel?.kind === 'task' || sel?.kind === 'method' ? domain.tasks[sel.taskId] : null;
  const selMethod = sel?.kind === 'method' ? selTask?.methods?.[sel.mi] : null;

  const renameTask = (oldId, newId) => {
    if (!newId || newId === oldId || domain.tasks[newId]) return;
    mutate((d) => {
      d.tasks[newId] = d.tasks[oldId]; delete d.tasks[oldId];
      for (const g of d.goals || []) if (g.task === oldId) g.task = newId;
      for (const t of Object.values(d.tasks)) for (const m of t.methods || []) m.subtasks = (m.subtasks || []).map((s) => (s === oldId ? newId : s));
    });
    setSel({ kind: 'task', taskId: newId });
  };
  const deleteTask = (id) => {
    mutate((d) => {
      delete d.tasks[id];
      for (const t of Object.values(d.tasks)) for (const m of t.methods || []) m.subtasks = (m.subtasks || []).filter((s) => s !== id);
    });
    setSel(null);
  };
  const deleteGoal = (goalId) => {
    mutate((d) => { d.goals = (d.goals || []).filter((g) => g.id !== goalId); });
    setSel(null);
  };
  const deleteMethod = (taskId, mi) => {
    mutate((d) => { d.tasks[taskId]?.methods?.splice(mi, 1); });
    setSel(null);
  };
  const addGoal = () => {
    const id = `goal_${genId('g')}`;
    mutate((d) => {
      const firstCompound = Object.keys(d.tasks).find((k) => d.tasks[k].type === 'compound') || '';
      d.goals = [...(d.goals || []), { id, name: '新目标', task: firstCompound, priority: 1, pre: [], achieved: [] }];
    });
    setSel({ kind: 'goal', goalId: id });
  };
  const addCompound = () => {
    const id = `task_${genId('c')}`;
    mutate((d) => { d.tasks[id] = { type: 'compound', conditions: [], methods: [{ name: '默认方法', conditions: [], subtasks: [] }] }; });
    setSel({ kind: 'task', taskId: id });
  };
  const addPrimitive = () => {
    const id = `p_${genId('a')}`;
    mutate((d) => { d.tasks[id] = { type: 'primitive', command: 'wait', conditions: [], effects: [] }; });
    setSel({ kind: 'task', taskId: id });
  };

  // 右键联想菜单：空白 = 可添加内容；节点 = 该节点操作（与全部编辑器统一）
  const onPaneContextMenu = (e) => {
    openMenu(e, [
      { icon: Crosshair, color: KIND.goal.color, label: '添加 GOAL', onClick: addGoal },
      { icon: ListTree, color: KIND.compound.color, label: '添加复合任务', onClick: addCompound },
      { icon: Zap, color: KIND.primitive.color, label: '添加原语', onClick: addPrimitive },
    ]);
  };
  const onNodeContextMenu = (e, n) => {
    const ref = n.data?.ref;
    if (!ref) return;
    const items = [];
    const collapseItem = n.data.canCollapse
      ? { icon: n.data.collapsed ? UnfoldVertical : FoldVertical, label: n.data.collapsed ? '展开分支' : '折叠分支', onClick: () => n.data.onToggle() }
      : null;
    if (ref.kind === 'goal') {
      items.push({ icon: Crosshair, color: KIND.goal.color, label: '编辑 GOAL', onClick: () => setSel(ref) });
      items.push({ icon: Trash2, color: UE.err, label: '删除 GOAL', hint: 'Del', onClick: () => deleteGoal(ref.goalId) });
    } else if (ref.kind === 'task') {
      items.push({ icon: ListTree, label: '编辑任务', onClick: () => setSel(ref) });
      if (collapseItem) items.push(collapseItem);
      items.push({ icon: Trash2, color: UE.err, label: '删除任务（同步清理引用）', hint: 'Del', onClick: () => deleteTask(ref.taskId) });
    } else if (ref.kind === 'method') {
      items.push({ icon: ListTree, label: '编辑方法', onClick: () => setSel(ref) });
      if (collapseItem) items.push(collapseItem);
      items.push({ icon: Trash2, color: UE.err, label: '删除方法', hint: 'Del', onClick: () => deleteMethod(ref.taskId, ref.mi) });
    }
    openMenu(e, items);
  };
  const onNodesDelete = (deleted) => {
    for (const n of deleted) {
      const ref = n.data?.ref;
      if (!ref) continue;
      if (ref.kind === 'goal') deleteGoal(ref.goalId);
      else if (ref.kind === 'task') deleteTask(ref.taskId);
      else if (ref.kind === 'method') deleteMethod(ref.taskId, ref.mi);
    }
  };

  const sectionLabel = (t) => <Label className="text-[10px]" style={{ color: UE.dim }}>{t}</Label>;

  return (
    <div className="h-full flex" style={{ background: UE.canvas, color: UE.text }}>
      {/* 左：GOAL / 任务索引 */}
      <div className="w-60 shrink-0 flex flex-col overflow-y-auto" style={{ background: UE.panel, borderRight: `1px solid ${UE.border}` }}>
        <div className="p-3" style={{ borderBottom: `1px solid ${UE.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-semibold flex items-center gap-1.5"><Network className="w-4 h-4" />HTN 域</span>
            <Button size="sm" onClick={save} disabled={!dirty} className="h-7 text-xs text-black" style={{ background: UE.warn }}><Save className="w-3.5 h-3.5" /></Button>
          </div>
          <div className="text-[10px]" style={{ color: UE.faint }}>Fluid HTN 模型：goal → compound（methods）→ primitive（command）</div>
        </div>
        {/* 域管理：一个域一张脑图，多域并存 */}
        <div className="p-2 space-y-1" style={{ borderBottom: `1px solid ${UE.border}` }}>
          {sectionLabel('域（每个域一张脑图 · 切换前记得保存）')}
          {domains.map((r, i) => (
            <button key={r.id} onClick={() => switchDomain(i)}
              className={`w-full text-left px-2 py-1.5 rounded transition-colors ${row?.id === r.id ? 'bg-[rgba(255,255,255,0.10)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}>
              <div className="text-xs font-medium truncate" style={{ color: row?.id === r.id ? '#F5F5F7' : UE.text }}>
                <Brain className="w-3 h-3 inline mr-1" />{r.name}{r.id === row?.id && dirty ? ' *' : ''}
              </div>
            </button>
          ))}
          <div className="flex gap-1 pt-1">
            <Input value={row?.name || ''} onChange={(e) => renameDomain(e.target.value)} title="当前域重命名" className={`${inputCls} flex-1`} />
            <Button size="sm" variant="outline" title="新建域" className="h-7 text-xs border-[#2e2e36]" style={{ color: UE.text }} onClick={addDomain}><Plus className="w-3.5 h-3.5" /></Button>
            <Button size="sm" variant="outline" title="删除当前域" className="h-7 text-xs border-[#2e2e36]" style={{ color: UE.err }} disabled={domains.length <= 1} onClick={removeDomain}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: UE.faint }}>GOAL（{(domain.goals || []).length}）</span>
            <button className="text-[10px] underline" style={{ color: UE.dim }} onClick={addGoal}>+GOAL</button>
          </div>
          {(domain.goals || []).map((g) => (
            <button key={g.id} onClick={() => setSel({ kind: 'goal', goalId: g.id })}
              className={`w-full text-left px-2 py-1.5 rounded text-xs mb-0.5 flex items-center gap-2 transition-colors ${sel?.kind === 'goal' && sel.goalId === g.id ? 'bg-[rgba(255,255,255,0.10)] text-white' : 'text-[#b8b8c0] hover:bg-[rgba(255,255,255,0.05)]'}`}>
              <Crosshair className="w-3 h-3 shrink-0" style={{ color: KIND.goal.color }} />
              <span className="truncate">{g.name}</span>
              <span className="ml-auto text-[9px] font-mono" style={{ color: UE.faint }}>{g.id}</span>
            </button>
          ))}
          <div className="flex items-center justify-between mt-3 mb-1">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: UE.faint }}>任务（{taskIds.length}）</span>
            <span>
              <button className="text-[10px] underline mr-2" style={{ color: KIND.compound.color }} onClick={addCompound}>+复合</button>
              <button className="text-[10px] underline" style={{ color: KIND.primitive.color }} onClick={addPrimitive}>+原语</button>
            </span>
          </div>
          <div className="max-h-[46vh] overflow-y-auto">
            {taskIds.map((id) => {
              const t = domain.tasks[id];
              const c = t.type === 'primitive' ? KIND.primitive.color : KIND.compound.color;
              return (
                <button key={id} onClick={() => setSel({ kind: 'task', taskId: id })}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] mb-0.5 flex items-center gap-2 transition-colors ${sel?.taskId === id && sel?.kind !== 'goal' ? 'bg-[rgba(255,255,255,0.10)] text-white' : 'text-[#b8b8c0] hover:bg-[rgba(255,255,255,0.05)]'}`}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                  <span className="truncate font-mono">{id}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 中：脑图画布 */}
      <div className="flex-1 relative min-w-0">
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2" style={{ background: `${UE.toolbar}ee`, borderBottom: `1px solid ${UE.border}` }}>
          <span className="text-xs font-semibold">分解脑图（XMind 式 · 根在左，分支向右）</span>
          <span className="text-[10px] hidden lg:block" style={{ color: UE.faint }}>
            <span style={{ color: KIND.goal.color }}>■</span> GOAL&nbsp;
            <span style={{ color: KIND.compound.color }}>■</span> 复合&nbsp;
            <span style={{ color: KIND.method.color }}>■</span> 方法&nbsp;
            <span style={{ color: KIND.primitive.color }}>■</span> 原语 · ± 折叠/展开 · 右键联想菜单 · Del 删除
          </span>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={ur.undo} disabled={!ur.canUndo} title="撤销 (Ctrl+Z)" className="h-7 w-7 p-0" style={{ color: UE.dim }}><Undo2 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" onClick={ur.redo} disabled={!ur.canRedo} title="重做 (Ctrl+Y)" className="h-7 w-7 p-0" style={{ color: UE.dim }}><Redo2 className="w-3.5 h-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" style={{ color: UE.dim }}
            onClick={() => setCollapsed(new Set())}>
            <UnfoldVertical className="w-3.5 h-3.5" /> 全部展开
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" style={{ color: UE.dim }}
            onClick={() => setCollapsed(new Set((domain.goals || []).map((g) => `g:${g.id}>${g.task}`)))}>
            <FoldVertical className="w-3.5 h-3.5" /> 折叠到 GOAL
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" style={{ color: UE.dim }}
            onClick={() => setCollapsed(defaultCollapsed(domain))}>
            默认层级
          </Button>
          <Button size="sm" variant="ghost" onClick={save} disabled={!dirty} className="h-7 text-xs" style={{ color: UE.warn }}><Save className="w-3.5 h-3.5" /> 保存{dirty ? '*' : ''}</Button>
        </div>
        <div className="absolute inset-0 top-9">
          <ReactFlow
            nodes={rfNodes}
            edges={rfEdges}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={onNodeContextMenu}
            onNodesDelete={onNodesDelete}
            nodeTypes={nodeTypes}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            selectionOnDrag
            panOnDrag={[1, 2]}
            deleteKeyCode={['Delete']}
            zoomOnScroll
            minZoom={0.1}
            maxZoom={1.6}
            fitView
            fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} color={UE.grid} gap={20} size={1.2} />
            <Controls showInteractive={false} />
            <MiniMap nodeColor={(n) => KIND[n.data?.kind]?.color || '#3c3c46'} {...UE_MINIMAP} />
          </ReactFlow>
          <ContextMenu menu={menu} onClose={closeMenu} />
        </div>
      </div>

      {/* 右：属性编辑 + 分解测试 */}
      <div className="w-80 shrink-0 overflow-y-auto" style={{ background: UE.panel, borderLeft: `1px solid ${UE.border}` }}>
        {/* GOAL 编辑 */}
        {selGoal && (
          <div className="p-3" style={{ borderBottom: `1px solid ${UE.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: KIND.goal.color }}>GOAL</span>
              <Button size="sm" variant="ghost" className="h-6 px-1" style={{ color: UE.err }} onClick={() => deleteGoal(sel.goalId)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            {sectionLabel('名称 / id')}
            <div className="flex gap-1 mb-2">
              <Input value={selGoal.name} onChange={(e) => mutate((d) => { d.goals.find((g) => g.id === sel.goalId).name = e.target.value; })} className={`${inputCls} w-32`} />
              <Input value={selGoal.id} disabled className={`${inputCls} w-28 opacity-60`} />
            </div>
            {sectionLabel('根复合任务')}
            <select className={`${selCls} w-full mb-2`} value={selGoal.task} onChange={(e) => mutate((d) => { d.goals.find((g) => g.id === sel.goalId).task = e.target.value; })}>
              {compoundIds.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
            {sectionLabel('优先级（utility 加分在此基础上切换 GOAL）')}
            <Input type="number" step="0.1" value={selGoal.priority ?? 1} onChange={(e) => mutate((d) => { d.goals.find((g) => g.id === sel.goalId).priority = Number(e.target.value) || 0; })} className={`${inputCls} w-24 mb-2`} />
            {sectionLabel('激活条件 pre（全部满足才可被选）')}
            <BitChipsEditor items={selGoal.pre || []} bits={registry.list} addLabel="+位" onChange={(v) => mutate((d) => { d.goals.find((g) => g.id === sel.goalId).pre = v; })} />
            {sectionLabel('达成判定 achieved（满足则 GOAL 完成）')}
            <BitChipsEditor items={selGoal.achieved || []} bits={registry.list} addLabel="+位" onChange={(v) => mutate((d) => { d.goals.find((g) => g.id === sel.goalId).achieved = v; })} />
          </div>
        )}

        {/* 任务编辑（复合/原语） */}
        {selTask && sel?.kind === 'task' && (
          <div className="p-3" style={{ borderBottom: `1px solid ${UE.border}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: selTask.type === 'primitive' ? KIND.primitive.color : KIND.compound.color }}>
                {selTask.type === 'primitive' ? '原语' : '复合任务'}
              </span>
              <Button size="sm" variant="ghost" className="h-6 px-1" style={{ color: UE.err }} onClick={() => deleteTask(sel.taskId)}><Trash2 className="w-3 h-3" /></Button>
            </div>
            {sectionLabel('任务 id（重命名自动同步引用）')}
            <Input defaultValue={sel.taskId} key={sel.taskId} onBlur={(e) => renameTask(sel.taskId, e.target.value.trim())} className={`${inputCls} w-48 mb-2 font-mono`} />
            {selTask.type === 'primitive' ? (
              <>
                {sectionLabel('指令名 command（实现由模板图承担）')}
                <Input value={selTask.command || ''} onChange={(e) => mutate((d) => { d.tasks[sel.taskId].command = e.target.value; })} className={`${inputCls} w-48 mb-2 font-mono`} />
                {sectionLabel('参数 JSON')}
                <Input defaultValue={JSON.stringify(selTask.params || {})} key={`p${sel.taskId}`} onBlur={(e) => { try { const v = JSON.parse(e.target.value); mutate((d) => { d.tasks[sel.taskId].params = v; }); } catch {} }} className={`${inputCls} w-48 mb-2 font-mono`} />
                {sectionLabel('前置条件 conditions（规划期对模拟位校验）')}
                <BitChipsEditor items={selTask.conditions || []} bits={registry.list} addLabel="+前件位" onChange={(v) => mutate((d) => { d.tasks[sel.taskId].conditions = v; })} />
                {sectionLabel('执行条件 execConditions（执行中每 tick 校验）')}
                <BitChipsEditor items={selTask.execConditions || []} bits={registry.list} addLabel="+执行条件位" onChange={(v) => mutate((d) => { d.tasks[sel.taskId].execConditions = v; })} />
                {sectionLabel('后效 effects（规划期作用于模拟位）')}
                <BitChipsEditor effect items={selTask.effects || []} bits={registry.list} addLabel="+效果位" onChange={(v) => mutate((d) => { d.tasks[sel.taskId].effects = v; })} />
              </>
            ) : (
              <>
                {sectionLabel('任务级条件 conditions（先于 method 校验）')}
                <BitChipsEditor items={selTask.conditions || []} bits={registry.list} addLabel="+条件位" onChange={(v) => mutate((d) => { d.tasks[sel.taskId].conditions = v; })} />
                {sectionLabel(`方法（${(selTask.methods || []).length}，按序回退；点击画布方法节点编辑）`)}
                {(selTask.methods || []).map((m, mi) => (
                  <div key={mi} className="flex items-center gap-1 mb-1">
                    <button className="flex-1 text-left px-2 py-1 rounded text-[11px] hover:bg-[rgba(255,255,255,0.05)] truncate" style={{ color: UE.text }}
                      onClick={() => setSel({ kind: 'method', taskId: sel.taskId, mi })}>
                      <ChevronRight className="w-3 h-3 inline mr-1" style={{ color: UE.faint }} />{m.name}
                    </button>
                    <button style={{ color: UE.err }} onClick={() => mutate((d) => { d.tasks[sel.taskId].methods.splice(mi, 1); })}><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
                <Button size="sm" variant="outline" className="mt-1 text-xs border-[#2e2e36]" style={{ color: UE.text }}
                  onClick={() => mutate((d) => { d.tasks[sel.taskId].methods = [...(d.tasks[sel.taskId].methods || []), { name: '新方法', conditions: [], subtasks: [] }]; })}>
                  <Plus className="w-3.5 h-3.5 mr-1" />方法
                </Button>
              </>
            )}
          </div>
        )}

        {/* 方法编辑 */}
        {selMethod && (
          <div className="p-3" style={{ borderBottom: `1px solid ${UE.border}` }}>
            <div className="text-xs font-semibold mb-2" style={{ color: KIND.method.color }}>方法 · {sel.taskId}</div>
            {sectionLabel('方法名')}
            <Input value={selMethod.name} onChange={(e) => mutate((d) => { d.tasks[sel.taskId].methods[sel.mi].name = e.target.value; })} className={`${inputCls} w-48 mb-2`} />
            {sectionLabel('前置条件（全部满足才可选；对模拟位）')}
            <BitChipsEditor items={selMethod.conditions || []} bits={registry.list} addLabel="+前件位" onChange={(v) => mutate((d) => { d.tasks[sel.taskId].methods[sel.mi].conditions = v; })} />
            {sectionLabel('子任务（按序展开，全部成功才算成功）')}
            <div className="space-y-0.5 my-1">
              {(selMethod.subtasks || []).map((s, si) => (
                <div key={si} className="flex items-center gap-1">
                  <span className="text-[9px] w-3" style={{ color: UE.faint }}>{si + 1}</span>
                  <button className="flex-1 text-left px-1.5 py-0.5 rounded text-[10px] font-mono hover:bg-[rgba(255,255,255,0.05)] truncate"
                    style={{ background: 'rgba(255,255,255,0.10)', color: '#E5E5EA' }} onClick={() => domain.tasks[s] && setSel({ kind: 'task', taskId: s })}>{s}</button>
                  <button style={{ color: UE.faint }} disabled={si === 0} onClick={() => mutate((d) => { const st = d.tasks[sel.taskId].methods[sel.mi].subtasks;[st[si - 1], st[si]] = [st[si], st[si - 1]]; })}><ArrowLeft className="w-3 h-3" /></button>
                  <button style={{ color: UE.faint }} disabled={si === selMethod.subtasks.length - 1} onClick={() => mutate((d) => { const st = d.tasks[sel.taskId].methods[sel.mi].subtasks;[st[si + 1], st[si]] = [st[si], st[si + 1]]; })}><ArrowRight className="w-3 h-3" /></button>
                  <button style={{ color: UE.err }} onClick={() => mutate((d) => { d.tasks[sel.taskId].methods[sel.mi].subtasks.splice(si, 1); })}>×</button>
                </div>
              ))}
              <select className={selCls} value="" onChange={(e) => { if (e.target.value) mutate((d) => { d.tasks[sel.taskId].methods[sel.mi].subtasks = [...(d.tasks[sel.taskId].methods[sel.mi].subtasks || []), e.target.value]; }); }}>
                <option value="">+子任务</option>
                {taskIds.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Button size="sm" variant="ghost" className="mt-1 text-[11px] h-6 px-1" style={{ color: UE.err }}
              onClick={() => { mutate((d) => { d.tasks[sel.taskId].methods.splice(sel.mi, 1); }); setSel({ kind: 'task', taskId: sel.taskId }); }}>
              <Trash2 className="w-3 h-3 mr-1" />删除方法
            </Button>
          </div>
        )}
        {!sel && <div className="p-3 text-[11px]" style={{ color: UE.faint, borderBottom: `1px solid ${UE.border}` }}>点击画布节点或左栏条目编辑。GOAL=战略意图（utility 可切换）；方法=一种分解路径（前置条件+有序子任务）；原语=最小一步（前置/执行条件+后效→指令）。</div>}

        {/* 分解测试器 */}
        <div className="p-3">
          <div className="text-sm font-semibold mb-2">分解测试器</div>
          {sectionLabel('GOAL（空 = 按 priority 自动选）')}
          <select className={`${selCls} w-full mb-2`} value={testGoal} onChange={(e) => setTestGoal(e.target.value)}>
            <option value="">自动（priority + utility）</option>
            {(domain.goals || []).map((g) => <option key={g.id} value={g.id}>{g.name}（{g.id}）</option>)}
          </select>
          {sectionLabel('WorldState 初始位')}
          <div className="flex flex-wrap gap-1 my-2">
            {WS_BITS.map((b) => (
              <button key={b} onClick={() => setInitBits({ ...initBits, [b]: !initBits[b] })}
                className="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                style={initBits[b] ? { background: '#d43a52', color: '#fff' } : { background: '#26262c', color: UE.dim }}>{b}</button>
            ))}
          </div>
          <Button onClick={decompose} className="w-full h-8 text-xs text-black mb-3" style={{ background: UE.ok }}><Play className="w-3.5 h-3.5 mr-1" />分解</Button>
          {result && (
            result.error ? <div className="text-xs rounded p-3" style={{ color: '#e08a8a', background: '#3a2a2e' }}>{result.error}</div>
            : !result ? <div className="text-xs rounded p-3" style={{ color: '#e08a8a', background: '#3a2a2e' }}>分解失败：无可用 GOAL 或根任务所有方法前件均不满足。</div>
            : (
              <>
                <div className="text-[11px] mb-1" style={{ color: UE.ok }}>GOAL：{result.goal?.name}（{result.goal?.id}）· MTR [{result.mtr.map((m) => m.index).join(',')}]</div>
                <div className="text-[10px] rounded px-2 py-1 mb-2" style={{ background: '#1a2a1f', color: UE.ok }}>
                  画布正在回放分解路径：逐节点点亮 → 定色后 <b>绿框=成功路径</b> · <b>红框=回退分支</b> · 灰=未涉及
                </div>
                {sectionLabel(`原语指令队列（${result.commands.length}）`)}
                <div className="my-2 space-y-1">
                  {result.commands.map((c, i) => (
                    <div key={i} className="rounded px-2 py-1 text-[11px]" style={{ background: UE.panelDeep }}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] w-4" style={{ color: UE.faint }}>{i + 1}</span>
                        <span className="font-medium" style={{ color: UE.text }}>{c.name}</span>
                        <span className="text-[9px] font-mono" style={{ color: UE.faint }}>{c.taskId}</span>
                      </div>
                      {(c.effects?.length || c.execConditions?.length) && (
                        <div className="ml-6 text-[9px]" style={{ color: UE.faint }}>
                          {c.execConditions?.length > 0 && <span className="mr-2">执行条件: {c.execConditions.map((e) => `${e.val === false ? '¬' : ''}${e.bit}`).join(' ')}</span>}
                          {c.effects?.length > 0 && <span style={{ color: '#C7C7CC' }}>后效: {c.effects.map((e) => `→${e.val === false ? '¬' : ''}${e.bit}(${EFFECT_TYPES[e.type || 'plan']})`).join(' ')}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {sectionLabel('分解 trace（缩进=深度）')}
                <div className="mt-1 max-h-64 overflow-y-auto">
                  {result.trace.map((t, i) => (
                    <div key={i} className="text-[10px] py-0 flex items-center gap-1"
                      style={{ paddingLeft: (t.depth || 0) * 10, color: t.kind === 'primitive' ? UE.ok : t.kind === 'fallback' || t.kind === 'cond_fail' ? '#e08a8a' : t.kind === 'goal' ? KIND.goal.color : UE.dim }}>
                      <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                      {t.kind === 'goal' ? `GOAL ${t.name}`
                        : t.kind === 'primitive' ? `原语 ${t.task} → ${t.command}`
                        : t.kind === 'fallback' ? `回退 ${t.task}.${t.method}`
                        : t.kind === 'cond_fail' ? `前件不满足 ${t.task}`
                        : `${t.task} ▸ 方法「${t.method}」`}
                    </div>
                  ))}
                </div>
                {sectionLabel('模拟终态位（效果预测）')}
                <div className="flex flex-wrap gap-1 mt-1">
                  {registry.list.filter((b, i2) => (result.finalBits & (1 << i2)) !== 0).map((b) => (
                    <span key={b} className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.08)', color: '#D1D1D6' }}>{b}</span>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
