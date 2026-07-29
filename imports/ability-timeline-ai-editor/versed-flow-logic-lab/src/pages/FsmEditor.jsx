// FSM 编辑器 —— 全产品唯一的状态机编辑器（React Flow 画布 + 层级钻取）。
//
// 一台编辑器编辑一切 StateMachine 资产，姿态机只是其中一份内容数据（name='StanceMachine'，
// 实验室载入）——姿态不再是独立编辑器，而是状态上的数据块（autocast/chase/leash）。
//
// 原生方言 = HFSM map 方言（hfsm.js / fsm.js / 姿态引擎同一消费核）：
//   data: { initial, states: { key: { label, color, x, y,
//             action?,                       —— 行为图（GraphDef/模板名显式引用；姿态叶状态缺省
//                                                = 命名约定资产 stance.behavior.<路径>，可一键生成）
//             autocast?, chase?, leash?,     —— 姿态内容块（候选集/追击/缰绳；可继承）
//             transitions?: [{on,to}],       —— 状态级事件转移（damaged）
//             states?, initial? },           —— 复合态：子状态 + 初始子状态
//           transitions: [{ from, to, condition?|conditions?|event?, within? }] }
//   旧数组方言（states:[…], condition_ids）载入时自动转换（legacyToHfsm），保存即迁移。
//
// 语义：状态可嵌套（钻取编辑）；转移冒泡继承（from=复合态 ⇒ 全部后代命中）；
// 行为 = 图（GraphVM），条件 = 图，一切实现可追溯到图节点。
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// 渲染错误边界：画布运行错误显式呈现（不再白屏），便于定位
class EditorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, color: '#f66', background: '#0E0F12', height: '100%', overflow: 'auto' }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>FSM 编辑器渲染错误（请把本页发回）</div>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#ccc' }}>{String(this.state.err?.stack || this.state.err)}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap,
  useNodesState, useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/components/aieditor/rf-dark.css';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Workflow, CircleDot, ArrowRight, Pencil, Undo2, Redo2, Network, ChevronRight, Shield, CornerDownRight, ExternalLink, RefreshCw } from 'lucide-react';
import { UE, ueEdgeStyle, UE_RF_COMMON, UE_MINIMAP } from '@/components/aieditor/theme.js';
import { NodeShell } from '@/components/aieditor/nodeshell.jsx';
import { useContextMenu, ContextMenu } from '@/components/aieditor/ctxmenu.jsx';
import { useHelperLines, HelperLines } from '@/components/aieditor/helperlines.jsx';
import { useUndoRedo } from '@/components/aieditor/usehistory.js';
import { legacyToHfsm, normalizeHfsm } from '@/lib/ai/fsm/hfsm.js';
import { STANCE_MACHINE_PRESET, PALADIN_EXAMPLE } from '@/lib/lab/stancePresets.js';
import { stanceBehaviorName, buildStanceBehaviorDef } from '@/lib/lab/stanceBehaviorDefs.js';
import { ABILITY_DEFS } from '@/lib/commandLab';

const NW = 200;
const TRIGGER_LABEL = { seen: '视野接战', damaged: '受击还击' };

// ── 路径工具 ──
const getAt = (data, path) => { let d = data; for (const k of path) d = d?.states?.[k]; return d; };
const childrenOf = (data, path) => (path.length ? getAt(data, path)?.states : data?.states) || {};
const pathJoin = (path, key) => [...path, key].join('.');
const parentOfPath = (p) => p.includes('.') ? p.slice(0, p.lastIndexOf('.')) : '';
const tailOf = (p) => (p.includes('.') ? p.slice(p.lastIndexOf('.') + 1) : p);
const isUnder = (p, prefix) => p === prefix || p.startsWith(`${prefix}.`);

// ── 状态节点：统一节点壳（初始/复合/姿态徽章；行为图名；左入右出） ──
function FsmStateNode({ data, selected }) {
  return (
    <NodeShell color={data.color || '#98989D'} icon={data.isComposite ? Network : CircleDot} title={data.name} width={NW}
      selected={selected}
      badge={(
        <span className="ml-auto flex items-center gap-1 shrink-0">
          {data.isComposite && <span className="text-[9px] px-1" style={{ background: '#00000044', color: UE.nodeTitle }}>▣ {data.nKids}</span>}
          {data.isInitial && <span className="text-[9px] px-1" style={{ background: '#00000044', color: UE.nodeTitle }}>▶ 初始</span>}
        </span>
      )}>
      <div className="text-[10px] truncate" style={{ color: UE.dim }}>
        {data.action ? `⚙ ${data.action}` : data.isStanceLeaf ? '⚠ 缺行为图资产' : '（无行为）'}
      </div>
      {data.stanceInfo && <div className="text-[9px] truncate" style={{ color: UE.faint }}>{data.stanceInfo}</div>}
    </NodeShell>
  );
}
const nodeTypes = { fsmState: FsmStateNode };

export default function FsmEditor() {
  return (
    <EditorBoundary>
      <FsmEditorInner />
    </EditorBoundary>
  );
}

function FsmEditorInner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [fsmList, setFsmList] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [fsm, setFsm] = useState(null);
  const [graphNames, setGraphNames] = useState([]);
  const [graphDefRows, setGraphDefRows] = useState([]); // GraphDef 行（行为资产存在性判断）
  const [taskNodeMap, setTaskNodeMap] = useState({});
  const [lvl, setLvl] = useState([]); // 当前钻取层级（key 路径）
  const [selectedPath, setSelectedPath] = useState(null);
  const [selectedEdgeIdx, setSelectedEdgeIdx] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef(null);
  const rfRef = useRef(null);
  const { menu, open: openMenu, close: closeMenu } = useContextMenu();
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const hl = useHelperLines(rfNodes, setRfNodes, () => rfRef.current?.getViewport().zoom ?? 1);

  const loadLists = async () => {
    const [fsms, gdefs, tns] = await Promise.all([
      base44.entities.StateMachine.list('-created_date'),
      base44.entities.GraphDef.list().catch(() => []),
      base44.entities.TaskNode.list().catch(() => []),
    ]);
    setFsmList(fsms || []);
    setGraphNames((gdefs || []).map((g) => g.name).filter(Boolean).sort());
    setGraphDefRows(gdefs || []);
    const m = {};
    (tns || []).forEach((n) => (m[n.id] = n));
    setTaskNodeMap(m);
    // 深链：?asset=机名（姿态面板/旧 /stances 入口）
    const want = searchParams.get('asset');
    const hit = want && (fsms || []).find((f) => f.name === want);
    if (hit) setCurrentId(hit.id);
    else if ((fsms || []).length && !currentId) setCurrentId(fsms[0].id);
  };
  useEffect(() => { loadLists(); }, []);

  useEffect(() => {
    if (!currentId) return;
    (async () => {
      const f = await base44.entities.StateMachine.get(currentId);
      let data = f?.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
      if (!data?.states) data = { initial: null, states: {}, transitions: [] };
      if (Array.isArray(data.states)) { data = legacyToHfsm(data, (id) => taskNodeMap[id]?.name || null); setDirty(true); }
      // 缺 transitions 数组会导致每次渲染生成新引用 → 画布无限重置、节点永远量不到尺寸（不可见）
      if (!Array.isArray(data.transitions)) data = { ...data, transitions: [] };
      setFsm({ ...f, data });
      setLvl([]); setSelectedPath(null); setSelectedEdgeIdx(null);
      setSaved(true);
      ur.clear();
    })();
  }, [currentId, taskNodeMap]);

  // 防抖自动保存
  useEffect(() => {
    if (!fsm || !dirty) return;
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await base44.entities.StateMachine.update(fsm.id, { name: fsm.name, data: fsm.data });
      setDirty(false);
      setSaved(true);
    }, 800);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [fsm, dirty]);

  const updateFsm = useCallback((updater) => {
    setFsm((prev) => {
      if (!prev) return prev;
      const data = JSON.parse(JSON.stringify(prev.data));
      data.states ||= {};
      data.transitions ||= [];
      updater(data);
      return { ...prev, data };
    });
    setDirty(true);
  }, []);

  const ur = useUndoRedo(
    useCallback(() => (fsm ? JSON.stringify({ name: fsm.name, data: fsm.data, lvl }) : null), [fsm, lvl]),
    useCallback((s) => {
      const p = JSON.parse(s);
      setFsm((prev) => (prev ? { ...prev, name: p.name, data: p.data } : prev));
      setLvl(p.lvl || []); setSelectedPath(null); setSelectedEdgeIdx(null);
      setDirty(true);
    }, []),
    [fsm, lvl]);

  const data = fsm?.data;
  const lvlStates = data ? childrenOf(data, lvl) : {};
  const lvlPathStr = lvl.join('.');
  const transitions = data?.transitions || [];
  // 本层可见的转移：from 属于当前层级（冒泡语义下 from=本层任意态）
  const lvlTransitions = useMemo(
    () => transitions.map((t, idx) => ({ ...t, idx })).filter((t) => parentOfPath(t.from) === lvlPathStr),
    [transitions, lvlPathStr]);
  const isStanceAsset = fsm?.name === 'StanceMachine' || data?.flavor === 'stance';
  const graphDefNameSet = useMemo(() => new Set(graphNames), [graphNames]);

  // data → RF
  useEffect(() => {
    if (!data) return;
    const containerInitial = lvl.length ? getAt(data, lvl)?.initial : data.initial;
    setRfNodes(Object.entries(lvlStates).map(([key, st], i) => {
      const kids = st.states ? Object.keys(st.states).length : 0;
      const cands = (st.autocast || []).length;
      const pathId = pathJoin(lvl, key);
      const isStanceLeaf = isStanceAsset && kids === 0;
      // 行为名解析：显式引用 → 命名约定资产（stance.behavior.<路径>，引擎按约定实执行）
      const convName = isStanceLeaf ? stanceBehaviorName(pathId) : null;
      const behaviorName = st.action || st.behavior
        || (convName && graphDefNameSet.has(convName) ? convName : null);
      return {
        id: pathId, type: 'fsmState',
        // 无坐标（旧姿态机资产）→ 网格兜底排布；拖动落点后持久化
        position: { x: st.x ?? 90 + (i % 4) * 230, y: st.y ?? 90 + Math.floor(i / 4) * 140 },
        data: {
          name: st.label || key, color: st.color,
          isInitial: containerInitial === key,
          isComposite: kids > 0, nKids: kids,
          action: behaviorName,
          isStanceLeaf,
          stanceInfo: cands ? `姿态候选 ×${cands}${st.chase === false ? ' · 不追击' : st.leash ? ` · 缰绳${st.leash}` : ''}` : null,
        },
      };
    }));
    setRfEdges(lvlTransitions.map((t) => {
      const label = t.event ? `⚡ ${t.event}` : t.condition ? t.condition : t.conditions ? t.conditions.join(' ∧ ') : '动作完成后';
      const sel = selectedEdgeIdx === t.idx;
      return {
        id: `e${t.idx}`, source: t.from, target: t.to,
        ...ueEdgeStyle(sel ? UE.selected : UE.dim, sel ? 2.5 : 1.5),
        label, labelStyle: { fill: UE.text, fontSize: 9 },
        labelBgStyle: { fill: UE.panelDeep, fillOpacity: 0.9 }, labelBgPadding: [5, 3], labelBgBorderRadius: 4,
      };
    }));
  }, [data, lvl, lvlStates, lvlTransitions, selectedEdgeIdx, isStanceAsset, graphDefNameSet, setRfNodes, setRfEdges]);

  const selectedEdge = selectedEdgeIdx != null ? transitions[selectedEdgeIdx] : null;

  // ── 状态操作 ──
  const addState = (pos) => {
    const kids = childrenOf(data, lvl);
    let i = 1; while (kids[`State${i}`]) i++;
    const key = `State${i}`;
    updateFsm((d) => {
      const ks = childrenOf(d, lvl);
      ks[key] = { label: `状态${i}`, color: '#8e8e93', x: pos?.x ?? 160 + Object.keys(ks).length * 60, y: pos?.y ?? 160 + Object.keys(ks).length * 40 };
      if (lvl.length) { const p = getAt(d, lvl); p.initial ||= key; } else d.initial ||= key;
    });
    setSelectedPath(pathJoin(lvl, key));
    setSelectedEdgeIdx(null);
  };

  const deleteState = (path) => {
    updateFsm((d) => {
      const pp = parentOfPath(path), key = tailOf(path);
      const kids = pp ? getAt(d, pp.split('.'))?.states : d.states;
      if (kids) delete kids[key];
      // 父级 initial 修复
      if (pp) { const p = getAt(d, pp.split('.')); if (p?.initial === key) p.initial = Object.keys(p.states || {})[0]; }
      else if (d.initial === key) d.initial = Object.keys(d.states)[0];
      // 连带清理转移（含子树）
      d.transitions = d.transitions.filter((t) => !isUnder(t.from, path) && !isUnder(t.to, path));
    });
    setSelectedPath(null);
  };

  const setInitialAtLevel = (key) => updateFsm((d) => {
    if (lvl.length) getAt(d, lvl).initial = key;
    else d.initial = key;
  });

  const onNodeDragStop = useCallback(() => {
    hl.clear();
    setRfNodes((ns) => {
      const pos = Object.fromEntries(ns.map((n) => [n.id, n.position]));
      updateFsm((d) => {
        for (const [p, xy] of Object.entries(pos)) {
          const st = getAt(d, p.split('.'));
          if (st) { st.x = xy.x; st.y = xy.y; }
        }
      });
      return ns;
    });
  }, [setRfNodes, updateFsm, hl]);

  const onConnect = useCallback((conn) => {
    if (!conn.source || !conn.target || conn.source === conn.target) return;
    updateFsm((d) => { d.transitions.push({ from: conn.source, to: conn.target }); });
    setSelectedEdgeIdx((data?.transitions || []).length);
    setSelectedPath(null);
  }, [updateFsm, data]);

  const onReconnect = useCallback((oldEdge, conn) => {
    if (!conn.source || !conn.target || conn.source === conn.target) return;
    const idx = parseInt(oldEdge.id.slice(1), 10);
    updateFsm((d) => {
      const t = d.transitions[idx];
      if (t) { t.from = conn.source; t.to = conn.target; }
    });
  }, [updateFsm]);

  const onNodesDelete = useCallback((deleted) => { for (const n of deleted) deleteState(n.id); }, [data, lvl]);
  const onEdgesDelete = useCallback((deleted) => {
    const idxs = new Set(deleted.map((e) => parseInt(e.id.slice(1), 10)));
    updateFsm((d) => { d.transitions = d.transitions.filter((_, i) => !idxs.has(i)); });
    setSelectedEdgeIdx(null);
  }, [updateFsm]);

  // 右键联想菜单
  const onPaneContextMenu = (e) => {
    const fp = rfRef.current?.project({ x: e.clientX, y: e.clientY });
    openMenu(e, [{ icon: Plus, color: '#C7C7CC', label: '添加状态', hint: '落在此位置', onClick: () => addState(fp) }]);
  };
  const onNodeContextMenu = (e, n) => {
    const st = getAt(data, n.id.split('.'));
    openMenu(e, [
      { icon: Pencil, label: '编辑状态', onClick: () => { setSelectedPath(n.id); setSelectedEdgeIdx(null); } },
      { icon: CircleDot, color: '#98989D', label: '设为本层初始', onClick: () => setInitialAtLevel(tailOf(n.id)) },
      ...(st?.states && Object.keys(st.states).length
        ? [{ icon: CornerDownRight, color: '#C7C7CC', label: '进入子机（钻取）', onClick: () => setLvl(n.id.split('.')) }]
        : [{ icon: Network, color: '#C7C7CC', label: '添加子状态（转复合态）', onClick: () => addChild(n.id.split('.')) }]),
      { icon: Trash2, color: UE.err, label: '删除状态（连带子树与转移）', hint: 'Del', onClick: () => deleteState(n.id) },
    ]);
  };
  const onEdgeContextMenu = (e, edge) => {
    e.preventDefault();
    const idx = parseInt(edge.id.slice(1), 10);
    openMenu(e, [
      { icon: Pencil, label: '编辑转移', onClick: () => { setSelectedEdgeIdx(idx); setSelectedPath(null); } },
      { icon: Trash2, color: UE.err, label: '删除转移', hint: 'Del', onClick: () => onEdgesDelete([edge]) },
    ]);
  };

  const addChild = (path) => updateFsm((d) => {
    const st = getAt(d, path);
    st.states ||= {};
    let i = 1; while (st.states[`Sub${i}`]) i++;
    st.states[`Sub${i}`] = { label: `子状态${i}`, color: '#8e8e93', autocast: [], transitions: [] };
    st.initial ||= `Sub${i}`;
  });

  // ── 状态机操作 ──
  const createNew = async () => {
    const f = await base44.entities.StateMachine.create({ name: '新状态机', description: '', data: { initial: null, states: {}, transitions: [] } });
    setFsmList((prev) => [f, ...prev]);
    setCurrentId(f.id);
  };
  const createStanceMachine = async () => {
    const f = await base44.entities.StateMachine.create({ name: 'StanceMachine', description: '姿态机：autocast 仲裁的顶层 HFSM（施法实验室载入）', data: JSON.parse(JSON.stringify(STANCE_MACHINE_PRESET)) });
    setFsmList((prev) => [f, ...prev]);
    setCurrentId(f.id);
  };
  const deleteFsm = async (id) => {
    await base44.entities.StateMachine.delete(id);
    setFsmList((prev) => prev.filter((f) => f.id !== id));
    if (currentId === id) setCurrentId(null);
  };

  const selSt = selectedPath ? getAt(data, selectedPath.split('.')) : null;
  const selKids = selSt?.states ? Object.keys(selSt.states) : [];
  const hasStanceBlock = selSt && (selSt.autocast !== undefined || selSt.chase !== undefined || selSt.leash !== undefined);

  // 姿态行为图资产化：选中态的规整叶（有效配置含祖先继承）；打开 / 生成行为图资产。
  // 落库后图即真相源（引擎按命名约定实执行），autocast/chase/leash 退为初次生成模板
  // + order 管道执行语义（退战/归位）。
  const selNormLeaf = useMemo(() => {
    if (!isStanceAsset || !selectedPath || !data?.states) return null;
    return normalizeHfsm(data).states[selectedPath] || null;
  }, [isStanceAsset, selectedPath, data]);
  const openBehaviorGraph = (name) => { if (name) navigate(`/graph?graph=${encodeURIComponent(name)}`); };
  const generateBehaviorGraph = async (path, regenerate = false) => {
    if (!fsm?.data) return;
    const def = buildStanceBehaviorDef(fsm.data, path);
    if (!def) return;
    // 生成以当前编辑配置（含未落盘修改）为准：先落盘机器，防跳转丢自动保存
    if (dirty) {
      await base44.entities.StateMachine.update(fsm.id, { name: fsm.name, data: fsm.data }).catch(() => {});
      setDirty(false); setSaved(true);
    }
    const rows = await base44.entities.GraphDef.list().catch(() => []);
    const existing = (rows || []).find((g) => g.name === def.name);
    if (existing) {
      if (!regenerate) { openBehaviorGraph(def.name); return; }
      await base44.entities.GraphDef.update(existing.id, { name: def.name, kind: 'action', data: def.data });
    } else {
      await base44.entities.GraphDef.create({ name: def.name, kind: 'action', data: def.data });
    }
    await loadLists();
    openBehaviorGraph(def.name);
  };

  return (
    <div className="flex h-full" style={{ background: UE.canvas, color: UE.text }}>
      {/* 左：状态机列表 */}
      <div className="w-56 flex flex-col shrink-0" style={{ background: UE.panel, borderRight: `1px solid ${UE.border}` }}>
        <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${UE.border}` }}>
          <Button onClick={createNew} className="w-full gap-2" size="sm"><Plus className="w-4 h-4" />新建状态机</Button>
          {!fsmList.some((f) => f.name === 'StanceMachine') && (
            <Button onClick={createStanceMachine} variant="outline" className="w-full gap-2 border-[#2e2e36]" size="sm" style={{ color: UE.text }}>
              <Shield className="w-4 h-4" />创建默认姿态机
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {fsmList.map((f) => (
            <div key={f.id}
              className={`group flex items-center gap-2 px-2.5 py-2 cursor-pointer transition-colors ${currentId === f.id ? 'bg-[rgba(255,255,255,0.10)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}
              onClick={() => setCurrentId(f.id)}>
              {f.name === 'StanceMachine' ? <Shield className="w-3.5 h-3.5 shrink-0" style={{ color: '#D1D1D6' }} /> : <Workflow className="w-3.5 h-3.5 shrink-0" style={{ color: '#D1D1D6' }} />}
              <span className="text-sm flex-1 truncate" style={{ color: UE.text }}>{f.name}</span>
              {f.name === 'StanceMachine' && <span className="text-[9px] px-1 border border-[#3a3a42]" style={{ color: UE.faint }}>实验室</span>}
              <button onClick={(e) => { e.stopPropagation(); deleteFsm(f.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity" style={{ color: UE.err }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {fsmList.length === 0 && <div className="text-xs text-center py-4" style={{ color: UE.faint }}>暂无状态机</div>}
        </div>
      </div>

      {/* 中：画布 */}
      <div className="flex-1 flex flex-col min-w-0">
        {fsm ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: UE.toolbar, borderBottom: `1px solid ${UE.border}` }}>
              <Input value={fsm.name} onChange={(e) => { setFsm((prev) => ({ ...prev, name: e.target.value })); setDirty(true); }}
                className="h-8 w-44 text-sm font-medium bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]" />
              {/* 面包屑：层级钻取 */}
              <div className="flex items-center gap-0.5 text-xs" style={{ color: UE.dim }}>
                <button className={`hover:underline ${lvl.length === 0 ? 'font-bold' : ''}`} style={{ color: lvl.length === 0 ? UE.text : UE.dim }} onClick={() => { setLvl([]); setSelectedPath(null); }}>根级</button>
                {lvl.map((k, i) => (
                  <span key={i} className="flex items-center gap-0.5">
                    <ChevronRight className="w-3 h-3" style={{ color: UE.faint }} />
                    <button className={`hover:underline ${i === lvl.length - 1 ? 'font-bold' : ''}`} style={{ color: i === lvl.length - 1 ? UE.text : UE.dim }}
                      onClick={() => { setLvl(lvl.slice(0, i + 1)); setSelectedPath(null); }}>
                      {getAt(data, lvl.slice(0, i + 1))?.label || k}
                    </button>
                  </span>
                ))}
              </div>
              <Button onClick={() => addState()} variant="outline" size="sm" className="gap-1.5 border-[#2e2e36]" style={{ color: UE.text }}>
                <Plus className="w-3.5 h-3.5" />添加状态
              </Button>
              {isStanceAsset && !data.states.Paladin && (
                <Button variant="outline" size="sm" className="gap-1 border-[#2e2e36] text-[11px]" style={{ color: UE.text }}
                  onClick={() => updateFsm((d) => { d.states.Paladin = JSON.parse(JSON.stringify(PALADIN_EXAMPLE)); })}>
                  插入 Paladin 层级示例
                </Button>
              )}
              <span className="text-[10px] hidden xl:block" style={{ color: UE.faint }}>拖线 = 新转移 · 右键联想 · 双击复合态钻取 · 转移冒泡继承</span>
              <div className="flex items-center gap-1.5 text-xs ml-auto">
                <Button size="sm" variant="ghost" onClick={ur.undo} disabled={!ur.canUndo} className="h-7 w-7 p-0 hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.text }}><Undo2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={ur.redo} disabled={!ur.canRedo} className="h-7 w-7 p-0 hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.text }}><Redo2 className="w-3.5 h-3.5" /></Button>
                {saved ? <span style={{ color: UE.faint }}>已保存</span> : <span style={{ color: UE.warn }}>保存中...</span>}
              </div>
            </div>
            <div className="flex-1 relative">
              <ReactFlow
                key={`${fsm.id}:${lvlPathStr}`}
                nodes={rfNodes}
                edges={rfEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onReconnect={onReconnect}
                onInit={(inst) => { rfRef.current = inst; }}
                onNodeDrag={hl.onDrag}
                onNodeDragStop={onNodeDragStop}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                onNodeClick={(_, n) => { setSelectedPath(n.id); setSelectedEdgeIdx(null); }}
                onNodeDoubleClick={(_, n) => { const st = getAt(data, n.id.split('.')); if (st?.states && Object.keys(st.states).length) { setLvl(n.id.split('.')); setSelectedPath(null); } }}
                onEdgeClick={(_, e) => { setSelectedEdgeIdx(parseInt(e.id.slice(1), 10)); setSelectedPath(null); }}
                onPaneClick={() => { setSelectedPath(null); setSelectedEdgeIdx(null); }}
                onPaneContextMenu={onPaneContextMenu}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeContextMenu={onEdgeContextMenu}
                nodeTypes={nodeTypes}
                fitView
                {...UE_RF_COMMON}
              >
                <Background variant={BackgroundVariant.Dots} color={UE.grid} gap={20} size={1.2} />
                <Controls showInteractive={false} />
                <MiniMap nodeColor={() => '#C7C7CC'} {...UE_MINIMAP} />
                <HelperLines x={hl.helper.x} y={hl.helper.y} />
              </ReactFlow>
              <ContextMenu menu={menu} onClose={closeMenu} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: UE.faint }}>选择或创建一个状态机</div>
        )}
      </div>

      {/* 右：属性 */}
      <div className="w-80 flex flex-col shrink-0 overflow-y-auto" style={{ background: UE.panel, borderLeft: `1px solid ${UE.border}` }}>
        {selSt ? (
          <StateInspector
            data={data} path={selectedPath} st={selSt} kids={selKids}
            isStanceAsset={isStanceAsset} hasStanceBlock={hasStanceBlock}
            graphNames={graphNames} graphDefRows={graphDefRows} normLeaf={selNormLeaf} lvl={lvl}
            transitions={transitions}
            updateFsm={updateFsm}
            onSetInitial={setInitialAtLevel}
            onDrill={() => { setLvl(selectedPath.split('.')); setSelectedPath(null); }}
            onAddChild={() => addChild(selectedPath.split('.'))}
            onDelete={() => deleteState(selectedPath)}
            onSelectEdge={(idx) => { setSelectedEdgeIdx(idx); setSelectedPath(null); }}
            onOpenGraph={openBehaviorGraph}
            onGenerateGraph={generateBehaviorGraph}
          />
        ) : selectedEdge ? (
          <EdgeInspector
            data={data} edge={selectedEdge} idx={selectedEdgeIdx}
            graphNames={graphNames} graphDefRows={graphDefRows}
            onOpenGraph={openBehaviorGraph} updateFsm={updateFsm}
            onDelete={() => onEdgesDelete([{ id: `e${selectedEdgeIdx}` }])}
          />
        ) : (
          <div className="p-4 text-sm text-center mt-8" style={{ color: UE.faint }}>
            选择一个状态或转移查看属性
            <div className="mt-3 text-[10px] leading-relaxed" style={{ color: UE.faint }}>
              行为/条件 = GraphVM 图 · 状态可嵌套 · 转移冒泡继承
              {isStanceAsset && <><br />姿态机：叶状态行为 = GraphDef 图资产（命名约定 stance.behavior.〈状态〉，选中状态可一键生成/打开）</>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── 状态属性面板 ──
function StateInspector({ data, path, st, kids, isStanceAsset, hasStanceBlock, graphNames, graphDefRows, normLeaf, lvl, transitions, updateFsm, onSetInitial, onDrill, onAddChild, onDelete, onSelectEdge, onOpenGraph, onGenerateGraph }) {
  const key = tailOf(path);
  const segs = path.split('.');
  const parentInitial = segs.length > 1 ? getAt(data, segs.slice(0, -1))?.initial : data.initial;
  const isInitial = parentInitial === key;
  const outEdges = transitions.map((t, idx) => ({ ...t, idx })).filter((t) => t.from === path);
  const up = (fn) => updateFsm((d) => fn(getAt(d, segs)));
  const sel = 'h-7 rounded border border-[#2e2e36] bg-[#0E0F12] px-1.5 text-[11px] text-[#d6d6dc]';
  const isComposite = kids.length > 0;

  // 行为来源判定：显式引用 / 命名约定资产（引擎 stanceBehaviorOf 按约定实执行）/ 运行时生成（未资产化）
  const explicitRef = st.action || st.behavior || null;
  const convName = stanceBehaviorName(path);
  const rowNames = new Set(graphDefRows.map((g) => g.name));
  const stanceLeaf = isStanceAsset && normLeaf?.isLeaf;
  let behaviorSrc = null;
  if (explicitRef) {
    const exists = rowNames.has(explicitRef);
    behaviorSrc = {
      tone: exists ? UE.faint : UE.warn,
      label: exists ? '显式引用图资产（引擎实执行）' : `⚠ 同名图资产不存在（GraphLab 新建同名图即生效）`,
      openName: exists ? explicitRef : null,
    };
  } else if (stanceLeaf) {
    behaviorSrc = rowNames.has(convName)
      ? { tone: UE.faint, label: '行为 = 图资产（命名约定生效，图即真相源，可编辑）', openName: convName, canRegen: true }
      : { tone: UE.err, label: '⚠ 行为图资产缺失 —— 引擎无生成兜底，运行将显式报错；请生成图资产', canGenerate: true };
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-xs mb-1" style={{ color: UE.faint }}>选中状态</div>
        <div className="flex items-center gap-2">
          <CircleDot className="w-4 h-4" style={{ color: st.color || '#C7C7CC' }} />
          <span className="font-semibold" style={{ color: UE.text }}>{st.label || key}</span>
          <span className="text-[10px] font-mono" style={{ color: UE.faint }}>{path}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_64px] gap-2">
        <div className="space-y-1.5">
          <Label className="text-xs" style={{ color: UE.dim }}>显示名</Label>
          <Input value={st.label || ''} onChange={(e) => up((s) => { s.label = e.target.value; })}
            className="h-8 text-sm bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs" style={{ color: UE.dim }}>颜色</Label>
          <input type="color" value={st.color || '#8e8e93'} onChange={(e) => up((s) => { s.color = e.target.value; })}
            className="h-8 w-full bg-[#0E0F12] border border-[rgba(255,255,255,0.08)] rounded cursor-pointer" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox checked={isInitial} onCheckedChange={() => onSetInitial(key)} />
        <Label className="text-sm cursor-pointer" style={{ color: UE.text }} onClick={() => onSetInitial(key)}>设为本层初始状态</Label>
      </div>

      {/* 行为图（GraphVM）：统一 FSM 与姿态机共享挂载点；姿态叶状态 = 命名约定图资产 */}
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: UE.dim }}>行为图（GraphDef / 模板名显式引用）</Label>
        <div className="flex items-center gap-1.5">
          <Input value={st.action || st.behavior || ''} list="fsm-graph-names" placeholder={isStanceAsset ? '（缺省 = 命名约定资产）' : '（无行为）'}
            onChange={(e) => up((s) => { const v = e.target.value.trim(); delete s.behavior; if (v) s.action = v; else delete s.action; })}
            className="h-8 text-xs font-mono bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]" />
          {(st.action || st.behavior) && (
            <button onClick={() => up((s) => { delete s.action; delete s.behavior; })} className="p-1" style={{ color: UE.err }} title="清除行为图"><Trash2 className="w-3.5 h-3.5" /></button>
          )}
        </div>
        <datalist id="fsm-graph-names">{graphNames.map((n) => <option key={n} value={n} />)}</datalist>
        {behaviorSrc && (
          <div className="border border-[#2e2e36] px-2 py-1.5 space-y-1.5">
            <div className="text-[10px] leading-relaxed" style={{ color: behaviorSrc.tone }}>
              {behaviorSrc.label}
              {behaviorSrc.openName && <span className="font-mono block truncate" style={{ color: UE.text }}>{behaviorSrc.openName}</span>}
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {behaviorSrc.openName && (
                <button onClick={() => onOpenGraph(behaviorSrc.openName)} className="text-[10px] flex items-center gap-0.5 hover:underline" style={{ color: UE.text }}>
                  <ExternalLink className="w-3 h-3" />在 GraphLab 打开
                </button>
              )}
              {behaviorSrc.canGenerate && (
                <button onClick={() => onGenerateGraph(path, false)} className="text-[10px] flex items-center gap-0.5 hover:underline" style={{ color: UE.text }}>
                  <Workflow className="w-3 h-3" />生成可编辑图资产
                </button>
              )}
              {behaviorSrc.canRegen && (
                <button onClick={() => onGenerateGraph(path, true)} title="以当前有效配置（含继承）重新推导并覆盖该图资产" className="text-[10px] flex items-center gap-0.5 hover:underline" style={{ color: UE.dim }}>
                  <RefreshCw className="w-3 h-3" />从配置重新生成
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 姿态内容块（数据，非代码）：autocast 候选 × chase × leash —— 可在复合态声明，后代继承 */}
      {hasStanceBlock ? (
        <div className="space-y-1.5 border border-[#2e2e36] p-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs" style={{ color: UE.dim }}>姿态内容（autocast × chase × leash）</Label>
            <button onClick={() => up((s) => { delete s.autocast; delete s.chase; delete s.leash; })} className="text-[9px]" style={{ color: UE.faint }} title="移除内容块（恢复继承/无姿态行为）">移除</button>
          </div>
          {(st.autocast || []).map((a, i) => (
            <div key={i} className="flex items-center gap-1">
              <select className={sel} value={a.ability} onChange={(e) => up((s) => { s.autocast[i].ability = e.target.value; })}>
                {Object.entries(ABILITY_DEFS).map(([k, d]) => <option key={k} value={k}>{d.label}</option>)}
              </select>
              <select className={sel} value={a.trigger || 'seen'} onChange={(e) => up((s) => { s.autocast[i].trigger = e.target.value; })}>
                {Object.entries(TRIGGER_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <button onClick={() => up((s) => { s.autocast.splice(i, 1); })} className="p-0.5" style={{ color: UE.err }}><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => up((s) => { (s.autocast ||= []).push({ ability: 'atk', trigger: 'seen' }); })}
              className="text-[10px] flex items-center gap-0.5" style={{ color: UE.dim }}><Plus className="w-3 h-3" />候选</button>
            <label className="flex items-center gap-1 text-[11px]" style={{ color: UE.text }}>
              <Checkbox checked={st.chase !== false} onCheckedChange={(on) => up((s) => { s.chase = !!on; })} />追击
            </label>
            {st.chase !== false && (
              <label className="flex items-center gap-1 text-[11px]" style={{ color: UE.text }}>
                缰绳
                <input type="number" min="1" step="0.5" className={`${sel} w-14`} placeholder="∞" value={st.leash ?? ''}
                  onChange={(e) => up((s) => { const v = parseFloat(e.target.value); if (v > 0) s.leash = v; else delete s.leash; })} />
              </label>
            )}
          </div>
          <div className="text-[9px] leading-relaxed pt-1" style={{ color: UE.faint, borderTop: `1px solid ${UE.border}` }}>
            行为以图资产为准（可在 GraphLab 编辑）；此处配置 = 初次生成模板，chase/leash 同时保留引擎退战/归位执行语义。
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="w-full gap-1.5 border-[#2e2e36] text-[11px]" style={{ color: UE.dim }}
          onClick={() => up((s) => { s.autocast = []; })}>
          <Shield className="w-3 h-3" />添加姿态内容块（autocast / chase / leash）
        </Button>
      )}

      {/* 复合态：子状态 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs" style={{ color: UE.dim }}>子状态 {isComposite ? `（${kids.length}，进入沿 initial 下沉）` : ''}</Label>
          <button onClick={onAddChild} className="text-[10px] flex items-center gap-0.5" style={{ color: UE.dim }}>
            <Plus className="w-3 h-3" />{isComposite ? '子状态' : '转为复合态'}
          </button>
        </div>
        {isComposite && (
          <>
            <div className="space-y-1">
              {kids.map((k) => (
                <div key={k} className="flex items-center gap-1.5 text-[11px] px-1.5 py-1 border border-[#2e2e36]" style={{ color: UE.text }}>
                  {st.initial === k && <span className="text-[9px] px-0.5 border border-[#3a3a42]" style={{ color: UE.faint }}>▶</span>}
                  <span className="flex-1 truncate">{st.states[k].label || k}</span>
                  <button className="text-[9px]" style={{ color: UE.faint }} onClick={() => up((s) => { s.initial = k; })}>设初始</button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full gap-1.5 border-[#2e2e36]" style={{ color: UE.text }} onClick={onDrill}>
              <CornerDownRight className="w-3.5 h-3.5" />进入子机（钻取编辑）
            </Button>
          </>
        )}
      </div>

      {/* 状态级事件转移（冒泡：子状态未命中上抛本层） */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs" style={{ color: UE.dim }}>事件转移（damaged ⇔ mem 'attacked'）</Label>
          <button className="text-[10px] flex items-center gap-0.5" style={{ color: UE.dim }}
            onClick={() => up((s) => { (s.transitions ||= []).push({ on: 'damaged', to: key }); })}>
            <Plus className="w-3 h-3" />转移
          </button>
        </div>
        {(st.transitions || []).map((t, i) => (
          <div key={i} className="flex items-center gap-1 text-[11px]" style={{ color: UE.text }}>
            <span style={{ color: UE.faint }}>on</span>
            <span className="font-mono">{t.on}</span><ArrowRight className="w-3 h-3" style={{ color: UE.faint }} />
            <Input value={t.to} onChange={(e) => up((s) => { s.transitions[i].to = e.target.value; })}
              className="h-6 flex-1 text-[11px] font-mono bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]" />
            <button onClick={() => up((s) => { s.transitions.splice(i, 1); })} className="p-0.5" style={{ color: UE.err }}><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>

      {/* 出边（机级转移，冒泡继承） */}
      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: UE.dim }}>出边转移（{outEdges.length}）</Label>
        {outEdges.map((t) => (
          <button key={t.idx} onClick={() => onSelectEdge(t.idx)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 border text-left transition-colors border-[#2e2e36] hover:bg-[rgba(255,255,255,0.05)]">
            <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: UE.faint }} />
            <span className="text-xs flex-1 truncate" style={{ color: UE.text }}>{t.to}</span>
            <span className="text-[10px]" style={{ color: UE.faint }}>{t.event ? `⚡${t.event}` : t.condition || (t.conditions ? `${t.conditions.length} 条件` : '自动')}</span>
          </button>
        ))}
      </div>

      <Button variant="outline" onClick={onDelete} className="w-full gap-2 border-[#2e2e36]" style={{ color: UE.err }} size="sm">
        <Trash2 className="w-3.5 h-3.5" />删除状态（连带子树与转移）
      </Button>
    </div>
  );
}

// ── 转移属性面板 ──
function EdgeInspector({ data, edge, idx, graphNames, graphDefRows, onOpenGraph, updateFsm, onDelete }) {
  const mode = edge.event ? 'event' : (edge.condition || edge.conditions) ? 'condition' : 'auto';
  const sel = 'h-7 w-full rounded border border-[#2e2e36] bg-[#0E0F12] px-1.5 text-[11px] text-[#d6d6dc]';
  // 条件候选：条件类图资产（kind=condition 或 cond.* 命名）优先，其余图资产列在其后
  const rowNames = new Set((graphDefRows || []).map((g) => g.name));
  const condNames = (graphDefRows || []).filter((g) => g.kind === 'condition' || String(g.name).startsWith('cond.')).map((g) => g.name).sort();
  const otherNames = (graphNames || []).filter((n) => !condNames.includes(n));
  const up = (fn) => updateFsm((d) => fn(d.transitions[idx]));
  const setMode = (m) => up((t) => {
    delete t.event; delete t.within; delete t.condition; delete t.conditions;
    if (m === 'event') { t.event = 'damaged'; }
    if (m === 'condition') { t.condition = 'cond.always'; }
  });
  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-xs mb-1" style={{ color: UE.faint }}>选中转移（机级 · 冒泡继承：from 的全部后代共享此出边）</div>
        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: UE.text }}>
          <span className="truncate">{edge.from}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" style={{ color: UE.faint }} />
          <span className="truncate">{edge.to}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs" style={{ color: UE.dim }}>转移方式</Label>
        <select className={sel} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="auto">无条件（状态动作完成后）</option>
          <option value="condition">条件模板（GraphVM 同步求值）</option>
          <option value="event">事件（mem 记录，如 damaged）</option>
        </select>
      </div>

      {mode === 'condition' && !edge.conditions && (
        <div className="space-y-1.5">
          <Label className="text-xs" style={{ color: UE.dim }}>条件蓝图（GraphVM 同步求值）</Label>
          <select className={sel} value={edge.condition || ''} onChange={(e) => up((t) => { t.condition = e.target.value; })}>
            {edge.condition && edge.condition !== 'cond.always' && !condNames.includes(edge.condition) && !otherNames.includes(edge.condition) && (
              <option value={edge.condition}>{edge.condition}（⚠ 资产不存在）</option>
            )}
            {!condNames.includes('cond.always') && <option value="cond.always">cond.always（恒真）</option>}
            {condNames.length > 0 && (
              <optgroup label="条件图资产">
                {condNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            )}
            {otherNames.length > 0 && (
              <optgroup label="其他图资产">
                {otherNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </optgroup>
            )}
          </select>
          {edge.condition && rowNames.has(edge.condition) && (
            <button onClick={() => onOpenGraph(edge.condition)} className="text-[10px] flex items-center gap-0.5 hover:underline" style={{ color: UE.text }}>
              <ExternalLink className="w-3 h-3" />在 GraphLab 打开条件图
            </button>
          )}
          {edge.condition && edge.condition !== 'cond.always' && !rowNames.has(edge.condition) && (
            <div className="text-[10px]" style={{ color: UE.warn }}>⚠ 该名称在图库中不存在，运行时该条件不会命中</div>
          )}
        </div>
      )}
      {edge.conditions && (
        <div className="text-[11px] space-y-1" style={{ color: UE.dim }}>
          <Label className="text-xs" style={{ color: UE.dim }}>多条件（AND，旧资产转换）</Label>
          {edge.conditions.map((c, i) => <div key={i} className="font-mono text-[10px] px-1.5 py-1 border border-[#2e2e36]" style={{ color: UE.text }}>{c}</div>)}
          <button className="text-[10px] underline" style={{ color: UE.faint }}
            onClick={() => up((t) => { t.condition = t.conditions[0]; delete t.conditions; })}>转为单条件编辑</button>
        </div>
      )}
      {mode === 'event' && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: UE.dim }}>事件类型</Label>
            <Input value={edge.event || ''} onChange={(e) => up((t) => { t.event = e.target.value.trim() || 'damaged'; })}
              className="h-8 text-xs font-mono bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs" style={{ color: UE.dim }}>窗口（秒）</Label>
            <Input type="number" step="0.1" value={edge.within ?? ''} placeholder="0.5"
              onChange={(e) => up((t) => { const v = parseFloat(e.target.value); if (v > 0) t.within = v; else delete t.within; })}
              className="h-8 text-xs font-mono bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]" />
          </div>
        </div>
      )}

      <Button variant="outline" onClick={onDelete} className="w-full gap-2 border-[#2e2e36]" style={{ color: UE.err }} size="sm">
        <Trash2 className="w-3.5 h-3.5" />删除转移
      </Button>
    </div>
  );
}