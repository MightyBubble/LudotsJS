// GraphVM 图实验室 —— 虚幻蓝图级图编辑器（React Flow + UE 蓝图视觉）。
// 一切 action/condition/function/macro 都是图：这里编辑的 GraphDef 实体会并入模板库，
// 与内置模板同名时覆盖之（BT/FSM/GOAP/HTN/Utility 共用同一套）。
// 画布交互完全对齐 UE 蓝图：
//   左键拖空白 = 框选（部分覆盖即选中） · 右键/中键拖 = 平移 · 右键点按 = 联想节点菜单
//   端口拖线甩到空白 = 兼容节点联想菜单（选中后自动接线） · Shift+点 = 加选
//   Ctrl+C/V 成组复制粘贴（含内部连线） · Ctrl+D 复刻 · Delete 删除 · Ctrl+S 保存
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, Handle, Position, SelectionMode,
  useNodesState, useEdgesState, useStore,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/components/aieditor/rf-dark.css';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Play, Plus, Save, Trash2, Workflow, Circle, Loader2, ChevronRight, LayoutGrid, Undo2, Redo2 } from 'lucide-react';
import { NODE_TYPES, compileGraph, obtainRun, releaseRun, startRun, tickRun } from '@/lib/ai/graph/graphvm.js';
import { autoLayoutGraph } from '@/lib/ai/graph/layout.js';
import '@/lib/ai/graph/nodes.js';
import '@/lib/ai/world4x/nodes4x.js';
import { createKnowledge } from '@/lib/ai/core/knowledge.js';
import { createTemplateLibrary, createCommandBus, BUILTIN_TEMPLATES } from '@/lib/ai/templates/library.js';
import { TEMPLATES_4X } from '@/lib/ai/world4x/templates4x.js';
import { WS_BITS } from '@/lib/ai/world4x/content.js';
import { UE, pinColor, ueEdgeStyle, ueNodeBox, ueHeader, EXEC_TRI, bandColor, UE_RF_COMMON, UE_MINIMAP } from '@/components/aieditor/theme.js';
import { ensureBuiltinGraphDefs } from '@/lib/ai/templates/seedBuiltins.js';
import { useHelperLines, HelperLines } from '@/components/aieditor/helperlines.jsx';
import { useUndoRedo } from '@/components/aieditor/usehistory.js';

const NW = 184, HH = 26, ROW = 16;
const KIND_LABEL = { action: '动作模板', condition: '条件模板', function: '函数', macro: '宏', script: '自由图' };
// 图库分类：按命名前缀归类（唯一列表，无"内置/自定义"之分——全部都是库中实体）
const GRAPH_CATS = [
  ['stance.behavior.', '姿态 · 行为图'],
  ['cond.stance.', '姿态 · 条件图'],
  ['cond.', '条件'],
  ['cmd.', '指令（4X 沙盘）'],
  ['act.', '动作'],
  ['fn.', '函数'],
];
const graphCatOf = (name = '') => GRAPH_CATS.find(([p]) => name.startsWith(p))?.[1] || '其他';
const genId = () => `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function portsOf(type) {
  const def = NODE_TYPES[type];
  if (!def) return { execIn: true, execOut: ['then'], dataIn: [], dataOut: [] };
  return { execIn: def.execIn !== false, execOut: def.execOut || [], dataIn: def.dataIn || [], dataOut: def.dataOut || [] };
}

// ── 蓝图节点：彩色标题带 + 深体 + exec 白三角 + 数据彩钉 ──
// LOD：视口缩到 0.55 以下隐藏引脚文字标签（手柄保留、连线不断）——缩远读结构骨架
function AiNode({ data, selected }) {
  const p = data.ports;
  const showLabels = useStore((s) => s.transform[2] >= 0.55);
  const execRows = Math.max(1, p.execOut.length);
  const dataZone = HH + 6 + execRows * ROW;
  const h = dataZone + Math.max(p.dataIn.length, p.dataOut.length) * ROW + 6;
  return (
    <div className="relative" style={{ width: NW, height: h, ...ueNodeBox(selected) }}>
      <div style={{ ...ueHeader(data.band), height: HH }}>
        <span className="text-[11px] font-bold truncate" style={{ color: UE.nodeTitle }}>{data.label}</span>
        {data.latent && <span className="text-[9px] shrink-0 ml-auto" style={{ color: '#C7C7CC' }}>⏱ 异步</span>}
      </div>
      {p.execIn && (
        <Handle type="target" position={Position.Left} id="exec"
          style={{ ...EXEC_TRI, top: HH + 6 + ROW / 2, left: -1 }} />
      )}
      {p.execOut.map((k, i) => (
        <div key={k}>
          {showLabels && p.execOut.length > 1 && (
            <span className="absolute text-[9px]" style={{ color: UE.dim, top: HH + 6 + i * ROW + 3, right: 14 }}>{k}</span>
          )}
          <Handle type="source" position={Position.Right} id={k}
            style={{ ...EXEC_TRI, top: HH + 6 + i * ROW + ROW / 2, right: -1 }} />
        </div>
      ))}
      {p.dataIn.map((d, i) => (
        <div key={d.key}>
          <Handle type="target" position={Position.Left} id={d.key}
            style={{ top: dataZone + i * ROW + ROW / 2, width: 9, height: 9, background: pinColor(d.type), border: '1px solid #101012' }} />
          {showLabels && <span className="absolute text-[9px]" style={{ color: UE.dim, top: dataZone + i * ROW + 3, left: 12 }}>{d.key}</span>}
        </div>
      ))}
      {p.dataOut.map((d, i) => (
        <div key={d.key}>
          <Handle type="source" position={Position.Right} id={d.key}
            style={{ top: dataZone + i * ROW + ROW / 2, width: 9, height: 9, background: pinColor(d.type), border: '1px solid #101012' }} />
          {showLabels && <span className="absolute text-[9px]" style={{ color: UE.dim, top: dataZone + i * ROW + 3, right: 12 }}>{d.key}</span>}
        </div>
      ))}
    </div>
  );
}
const nodeTypes = { aiNode: AiNode };

const toRfNode = (n) => {
  const def = NODE_TYPES[n.type];
  return {
    id: n.id, type: 'aiNode', position: { x: n.x || 0, y: n.y || 0 },
    data: { label: n.props?.label || def?.label || n.type, band: bandColor(def), latent: def?.latent, ports: portsOf(n.type) },
  };
};
const toRfEdge = (l, i, nodes) => {
  const isExec = l.to[1] === 'exec';
  let color = UE.exec;
  if (!isExec) {
    const src = nodes.find((n) => n.id === l.from[0]);
    const out = src ? portsOf(src.type).dataOut.find((d) => d.key === l.from[1]) : null;
    color = pinColor(out?.type);
  }
  return {
    id: `e${i}`, source: l.from[0], sourceHandle: l.from[1], target: l.to[0], targetHandle: l.to[1],
    ...ueEdgeStyle(color, isExec ? 2.5 : 1.75),
  };
};

const emptyGraph = (kind) => ({
  name: 'graph.new', kind, inputs: [], outputs: [],
  nodes: [{ id: 'start', type: 'flow.start', x: 40, y: 160 }, { id: 'exit', type: 'flow.exit', x: 460, y: 160 }],
  links: [{ from: ['start', 'then'], to: ['exit', 'exec'] }],
});

const inputCls = 'h-7 text-xs bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc] placeholder:text-[#5c5c66]';

// ── UE 联想节点菜单（右键点按 / 拖线甩空白弹出）：搜索 + 键盘导航 + 分类色点 ──
function NodeMenu({ x, y, items, active, setActive, onPick, query, setQuery, onClose, hint }) {
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current?.children[active];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [active, items.length]);
  return (
    <>
      <div className="absolute inset-0 z-20" onMouseDown={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div className="absolute z-30 w-64 rounded-md shadow-2xl overflow-hidden"
        style={{ left: x, top: y, background: UE.panel, border: `1px solid ${UE.border}` }}>
        <div className="p-1.5" style={{ borderBottom: `1px solid ${UE.border}` }}>
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); if (items[active]) onPick(items[active]); }
              else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            }}
            placeholder="搜索节点…（↑↓ 选择，Enter 确认）"
            className="w-full h-7 px-2 text-xs rounded outline-none"
            style={{ background: UE.panelDeep, color: UE.text, border: `1px solid ${UE.border}` }}
          />
        </div>
        {hint && <div className="px-2 py-1 text-[10px]" style={{ color: UE.faint, borderBottom: `1px solid ${UE.border}` }}>{hint}</div>}
        <div ref={listRef} className="max-h-64 overflow-y-auto py-1">
          {items.map((it, i) => (
            <button key={it.type}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); onPick(it); }}
              className="w-full flex items-center gap-2 px-2 py-1 text-left text-[11px] transition-colors"
              style={{ background: i === active ? 'rgba(255,255,255,0.10)' : 'transparent', color: UE.text }}>
              <Circle className="w-2 h-2 shrink-0" style={{ color: bandColor(it.def) }} fill={bandColor(it.def)} />
              <span className="truncate">{it.def.label}</span>
              {it.def.latent && <span className="text-[9px] shrink-0" style={{ color: '#AEAEB2' }}>异步</span>}
              <span className="ml-auto text-[9px] shrink-0" style={{ color: UE.faint }}>{it.def.category || ''}</span>
            </button>
          ))}
          {!items.length && <div className="px-3 py-2 text-[11px]" style={{ color: UE.faint }}>无匹配节点</div>}
        </div>
      </div>
    </>
  );
}

export default function GraphLab() {
  const [searchParams] = useSearchParams();
  const [defs, setDefs] = useState([]);
  const [graph, setGraph] = useState(null);
  const [entityId, setEntityId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const hl = useHelperLines(rfNodes, setRfNodes, () => rfRef.current?.getViewport().zoom ?? 1);
  // UE 联想菜单：{ mx, my（wrapper 相对）, flowX, flowY（图坐标）, connect: null | {nodeId, handleId, kind, dataType} }
  const [menu, setMenu] = useState(null);
  const [menuQuery, setMenuQuery] = useState('');
  const [menuActive, setMenuActive] = useState(0);
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const wrapRef = useRef(null);
  const rfRef = useRef(null);
  const rDown = useRef(null);
  const connectStartRef = useRef(null);
  const selectedIdsRef = useRef([]);
  const deepLinked = useRef(false); // 深链 ?graph= 只消费一次（保存/删除后的 load 不重复打开）

  const load = async () => {
    try {
      let rows = await base44.entities.GraphDef.list('-created_date');
      // 全部统一：代码标准库固化落库（幂等），此后图库只有一种图 = 实体
      rows = await ensureBuiltinGraphDefs(base44, rows || []);
      setDefs(rows || []);
      // 深链：?graph=图名（FSM 编辑器「在 GraphLab 打开」）——实体优先，内置模板兜底
      if (!deepLinked.current) {
        const want = searchParams.get('graph');
        if (want) {
          const row = (rows || []).find((d) => d.name === want);
          if (row) { deepLinked.current = true; openGraph(row.data, row.id); }
          else {
            const bt = BUILTIN_TEMPLATES.find((t) => t.id === want || t.graph?.name === want);
            const g = bt?.graph || TEMPLATES_4X.find((t) => t.name === want);
            if (g) { deepLinked.current = true; openGraph(g, null); }
          }
        }
      }
    } catch (e) { setDefs([]); }
  };
  useEffect(() => { load(); }, []);

  // 实体 data 字段兼容：base44 object 可能返回 JSON 字符串
  const parseData = (d) => {
    if (!d) return null;
    if (typeof d === 'string') { try { return JSON.parse(d); } catch { return null; } }
    return d;
  };

  // 模板库：实体图 + 内置（同名实体覆盖内置，正是"用户自定义模板"语义）
  const library = useMemo(() => {
    const lib = createTemplateLibrary(defs.map((d) => ({ id: d.id, name: d.name, data: parseData(d.data) })).filter((d) => d.data), BUILTIN_TEMPLATES);
    for (const g of TEMPLATES_4X) if (!lib.templates[g.name]) lib.register(g, g.kind);
    return lib;
  }, [defs]);

  // 图库分组：唯一列表按类别分组（类别顺序 = GRAPH_CATS 声明序，其他垫底）
  const groupedDefs = useMemo(() => {
    const by = {};
    for (const d of defs) (by[graphCatOf(d.name)] ||= []).push(d);
    for (const k of Object.keys(by)) by[k].sort((a, b) => a.name.localeCompare(b.name));
    const order = [...GRAPH_CATS.map(([, l]) => l), '其他'];
    return order.filter((l) => by[l]?.length).map((l) => [l, by[l]]);
  }, [defs]);

  const resolveGraph = useCallback((id) => {
    const row = defs.find((d) => d.name === id);
    if (row) return parseData(row.data);
    const t = library.templates[id];
    return t?.graph || null;
  }, [defs, library]);

  // 撤销/重做（快照=整张图；切图/新建时清历史——见 openGraph）
  const ur = useUndoRedo(
    useCallback(() => (graph ? JSON.stringify(graph) : null), [graph]),
    useCallback((s) => {
      setGraph(JSON.parse(s));
      setSelected(null);
      setDirty(true);
    }, []),
    [graph]);

  const openGraph = (g, id = null) => {
    const parsed = parseData(g);
    if (!parsed) return;
    // 无坐标的模板图（内置/老数据）自动排版；已有排版原样保留
    setGraph(autoLayoutGraph(JSON.parse(JSON.stringify(parsed))));
    setEntityId(id);
    setSelected(null); setDirty(false); setRunResult(null); setMenu(null);
    selectedIdsRef.current = [];
    ur.clear();
  };

  // graph → RF 画布状态（graph 是唯一事实源；位置在拖放结束时回写）
  useEffect(() => {
    if (!graph) { setRfNodes([]); setRfEdges([]); return; }
    setRfNodes(graph.nodes.map(toRfNode));
    setRfEdges(graph.links.map((l, i) => toRfEdge(l, i, graph.nodes)));
  }, [graph, setRfNodes, setRfEdges]);

  const save = async () => {
    if (!graph) return;
    const payload = { name: graph.name, kind: graph.kind, data: graph };
    if (entityId) await base44.entities.GraphDef.update(entityId, payload);
    else {
      const row = await base44.entities.GraphDef.create(payload);
      setEntityId(row.id);
    }
    setDirty(false);
    load();
  };
  const saveRef = useRef(save);
  saveRef.current = save;

  const remove = async () => {
    if (entityId) await base44.entities.GraphDef.delete(entityId);
    setGraph(null); setEntityId(null);
    load();
  };

  const mutate = (fn) => { setGraph((g) => { const c = JSON.parse(JSON.stringify(g)); fn(c); return c; }); setDirty(true); };

  const deleteSelected = () => {
    if (!selected) return;
    const node = graphRef.current?.nodes.find((n) => n.id === selected);
    if (!node || node.type === 'flow.start') return;
    mutate((g) => {
      g.nodes = g.nodes.filter((n) => n.id !== selected);
      g.links = g.links.filter((l) => l.from[0] !== selected && l.to[0] !== selected);
    });
    setSelected(null);
  };

  // ── UE 联想菜单：打开 / 过滤 / 建节点并自动接线 ──
  const allNodeItems = useMemo(() => Object.entries(NODE_TYPES).map(([type, def]) => ({ type, def })), []);

  const openMenu = (clientX, clientY, connect) => {
    const wrap = wrapRef.current; const rf = rfRef.current;
    if (!wrap || !rf || !graphRef.current) return;
    const bounds = wrap.getBoundingClientRect();
    const flow = rf.screenToFlowPosition({ x: clientX, y: clientY });
    const mx = Math.max(4, Math.min(clientX - bounds.left, bounds.width - 264));
    const my = Math.max(4, Math.min(clientY - bounds.top, bounds.height - 330));
    setMenu({ mx, my, flowX: flow.x, flowY: flow.y, connect });
    setMenuQuery(''); setMenuActive(0);
  };

  // 菜单条目：拖线联想时只列兼容节点；flow.start 唯一；子串模糊过滤
  const menuItems = useMemo(() => {
    if (!menu) return [];
    let items = allNodeItems;
    if (graphRef.current?.nodes.some((n) => n.type === 'flow.start')) {
      items = items.filter((i) => i.type !== 'flow.start');
    }
    const c = menu.connect;
    if (c?.kind === 'exec') {
      items = items.filter((i) => portsOf(i.type).execIn);
    } else if (c?.kind === 'data') {
      items = items.filter((i) => portsOf(i.type).dataIn.some((d) => d.type === c.dataType || d.type === 'any' || c.dataType === 'any'));
    }
    const q = menuQuery.trim().toLowerCase();
    if (q) items = items.filter((i) => `${i.def.label} ${i.type} ${i.def.category || ''}`.toLowerCase().includes(q));
    return items.slice(0, 80);
  }, [menu, menuQuery, allNodeItems]);

  const menuHint = menu?.connect
    ? (menu.connect.kind === 'exec' ? '从 exec 引脚拖出 —— 仅显示可执行节点，选中自动接线' : `从 ${menu.connect.handleId}（${menu.connect.dataType}）拖出 —— 仅显示兼容输入，选中自动接线`)
    : null;

  const pickNode = (it) => {
    const m = menu;
    setMenu(null);
    if (!m) return;
    mutate((g) => {
      const id = `${it.type.split('.').pop()}_${genId()}`;
      g.nodes.push({
        id, type: it.type,
        x: Math.round((m.flowX - NW / 2) / 20) * 20,
        y: Math.round((m.flowY - 20) / 20) * 20,
        props: {},
      });
      if (m.connect) {
        if (m.connect.kind === 'exec' && portsOf(it.type).execIn) {
          g.links.push({ from: [m.connect.nodeId, m.connect.handleId], to: [id, 'exec'] });
        } else if (m.connect.kind === 'data') {
          const key = portsOf(it.type).dataIn.find((d) => d.type === m.connect.dataType || d.type === 'any' || m.connect.dataType === 'any')?.key;
          if (key) g.links.push({ from: [m.connect.nodeId, m.connect.handleId], to: [id, key] });
        }
      }
    });
  };

  // 右键点按（位移 <6px）弹菜单：capture 阶段记录按下点，抬起时判定；
  // 右键拖动则交给 RF 平移（panOnDrag=[1,2]），onPaneContextMenu 仅拦截浏览器原生菜单。
  const onWrapPointerDownCapture = (e) => {
    if (e.button === 2) rDown.current = { x: e.clientX, y: e.clientY };
  };
  const onWrapPointerUpCapture = (e) => {
    if (e.button !== 2 || !rDown.current) return;
    const d = Math.hypot(e.clientX - rDown.current.x, e.clientY - rDown.current.y);
    rDown.current = null;
    if (d < 6 && !e.target.closest?.('.react-flow__node') && e.target.closest?.('.react-flow__pane')) {
      openMenu(e.clientX, e.clientY, null);
    }
  };

  // 拖线甩空白：连接未完成（未落在手柄/节点上）→ 弹兼容节点联想菜单
  const onConnectStart = useCallback((_, p) => { connectStartRef.current = p; }, []);
  const onConnectEnd = useCallback((e) => {
    const p = connectStartRef.current;
    connectStartRef.current = null;
    if (!p) return;
    const t = e.target;
    if (t.closest?.('.react-flow__handle') || t.closest?.('.react-flow__node')) return;
    const g = graphRef.current;
    const src = g?.nodes.find((n) => n.id === p.nodeId);
    const sp = src ? portsOf(src.type) : null;
    if (!sp) return;
    let connect = null;
    if (sp.execOut.includes(p.handleId)) {
      connect = { nodeId: p.nodeId, handleId: p.handleId, kind: 'exec' };
    } else {
      const out = sp.dataOut.find((d) => d.key === p.handleId);
      connect = { nodeId: p.nodeId, handleId: p.handleId, kind: 'data', dataType: out?.type || 'any' };
    }
    openMenu(e.clientX, e.clientY, connect);
  }, []);

  // 恰好选中 1 个节点 → 属性面板；多选/空选 → 隐藏
  const onSelectionChange = useCallback(({ nodes: sel }) => {
    selectedIdsRef.current = (sel || []).map((n) => n.id);
    setSelected((sel || []).length === 1 ? sel[0].id : null);
  }, []);

  // ── React Flow 交互回写 ──
  const isValidConnection = useCallback((conn) => {
    const g = graphRef.current;
    if (!g || conn.source === conn.target) return false;
    const src = g.nodes.find((n) => n.id === conn.source);
    if (!src) return false;
    const sp = portsOf(src.type);
    const srcExec = sp.execOut.includes(conn.sourceHandle);
    const dstExec = conn.targetHandle === 'exec';
    return srcExec === dstExec; // exec↔exec，data↔data
  }, []);

  const onConnect = useCallback((conn) => {
    mutate((g) => {
      // exec / data 均单入：先移除同一目标端口的旧线
      g.links = g.links.filter((l) => !(l.to[0] === conn.target && l.to[1] === conn.targetHandle));
      g.links.push({ from: [conn.source, conn.sourceHandle], to: [conn.target, conn.targetHandle] });
    });
  }, []);

  const onNodeDragStop = useCallback(() => {
    hl.clear();
    setRfNodes((ns) => {
      const pos = Object.fromEntries(ns.map((n) => [n.id, n.position]));
      setGraph((g) => {
        if (!g) return g;
        const c = JSON.parse(JSON.stringify(g));
        for (const n of c.nodes) if (pos[n.id]) { n.x = pos[n.id].x; n.y = pos[n.id].y; }
        return c;
      });
      setDirty(true);
      return ns;
    });
  }, [setRfNodes, hl]);

  const onNodesDelete = useCallback((deleted) => {
    const ids = new Set(deleted.filter((d) => d.id !== 'start').map((d) => d.id));
    if (!ids.size) return;
    mutate((g) => {
      g.nodes = g.nodes.filter((n) => !ids.has(n.id));
      g.links = g.links.filter((l) => !ids.has(l.from[0]) && !ids.has(l.to[0]));
    });
    setSelected(null);
  }, []);

  const onEdgesDelete = useCallback((deleted) => {
    const keys = new Set(deleted.map((d) => `${d.source}|${d.sourceHandle}|${d.target}|${d.targetHandle}`));
    mutate((g) => {
      g.links = g.links.filter((l) => !keys.has(`${l.from[0]}|${l.from[1]}|${l.to[0]}|${l.to[1]}`));
    });
  }, []);

  // 拖线头重插：把旧线改到新目标端口（先校验类型，再执行单入替换）
  const onReconnect = useCallback((oldEdge, conn) => {
    const g = graphRef.current;
    if (!g || conn.source === conn.target) return;
    const src = g.nodes.find((n) => n.id === conn.source);
    if (!src) return;
    const srcExec = portsOf(src.type).execOut.includes(conn.sourceHandle);
    if (srcExec !== (conn.targetHandle === 'exec')) return;
    mutate((gg) => {
      gg.links = gg.links.filter((l) =>
        !(l.from[0] === oldEdge.source && l.from[1] === oldEdge.sourceHandle && l.to[0] === oldEdge.target && l.to[1] === oldEdge.targetHandle)
        && !(l.to[0] === conn.target && l.to[1] === conn.targetHandle));
      gg.links.push({ from: [conn.source, conn.sourceHandle], to: [conn.target, conn.targetHandle] });
    });
  }, []);

  // ── UE 蓝图快捷键：Ctrl+S 保存 / Ctrl+C·V 成组复制粘贴 / Ctrl+D 复刻 ──
  const clipboard = useRef(null);
  const copySelection = () => {
    const g = graphRef.current;
    if (!g) return false;
    const ids = new Set(selectedIdsRef.current.filter((id) => {
      const n = g.nodes.find((x) => x.id === id);
      return n && n.type !== 'flow.start';
    }));
    if (!ids.size) return false;
    clipboard.current = {
      nodes: g.nodes.filter((n) => ids.has(n.id)).map((n) => JSON.parse(JSON.stringify(n))),
      links: g.links.filter((l) => ids.has(l.from[0]) && ids.has(l.to[0])).map((l) => JSON.parse(JSON.stringify(l))),
    };
    return true;
  };
  const pasteClipboard = () => {
    const cb = clipboard.current;
    if (!cb || !cb.nodes.length) return;
    mutate((g) => {
      const idMap = {};
      for (const n of cb.nodes) idMap[n.id] = `${n.type.split('.').pop()}_${genId()}`;
      for (const n of cb.nodes) {
        g.nodes.push({ ...JSON.parse(JSON.stringify(n)), id: idMap[n.id], x: (n.x || 0) + 40, y: (n.y || 0) + 40 });
      }
      for (const l of cb.links) {
        g.links.push({ from: [idMap[l.from[0]], l.from[1]], to: [idMap[l.to[0]], l.to[1]] });
      }
    });
  };
  useEffect(() => {
    const onKey = (e) => {
      const g = graphRef.current;
      if (!g) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === 's') { e.preventDefault(); saveRef.current(); }
      else if (key === 'c') { copySelection(); }
      else if (key === 'v') { pasteClipboard(); }
      else if (key === 'd') { e.preventDefault(); if (copySelection()) pasteClipboard(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const runGraph = () => {
    if (!graph) return;
    setRunning(true); setRunResult(null);
    try {
      const kb = createKnowledge({ bits: WS_BITS });
      const bus = createCommandBus(library);
      const logs = [];
      const ctx = {
        time: 0, dt: 0.1, rng: Math.random,
        bb: kb.bb, mem: kb.mem, ws: kb.ws, commands: bus,
        beliefs: { get: () => 0 },
        log: (m) => logs.push(typeof m === 'string' ? m : JSON.stringify(m)),
      };
      const compiled = compileGraph(graph, resolveGraph);
      const run = obtainRun(compiled);
      run.trace = [];
      startRun(run, {});
      let st = 'running', ticks = 0;
      while (st === 'running' && ticks < 200) { ctx.time += 0.1; st = tickRun(run, ctx, 0.1); ticks++; }
      const out = run.outSlots;
      const trace = run.trace ? [...run.trace] : [];
      releaseRun(run);
      setRunResult({ st, ticks, out, logs, trace });
    } catch (err) {
      setRunResult({ st: 'error', error: err.message });
    }
    setRunning(false);
  };

  const listBtn = (active) =>
    `w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors ${active ? 'bg-[rgba(255,255,255,0.10)] text-white' : 'text-[#b8b8c0] hover:bg-[rgba(255,255,255,0.05)]'}`;

  return (
    <div className="h-full flex" style={{ background: UE.canvas, color: UE.text }}>
      {/* 左栏：图库（用户图 + 内置模板）。节点通过右键/拖线联想菜单添加，无常驻面板。 */}
      <div className="w-64 shrink-0 flex flex-col" style={{ background: UE.panel, borderRight: `1px solid ${UE.border}` }}>
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">图库（GraphDef）</span>
            <Select onValueChange={(k) => openGraph(emptyGraph(k))}>
              <SelectTrigger className={`w-20 ${inputCls}`}><SelectValue placeholder="+ 新建" /></SelectTrigger>
              <SelectContent>
                {Object.entries(KIND_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            {groupedDefs.map(([cat, items]) => (
              <div key={cat}>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: UE.faint }}>{cat}（{items.length}）</div>
                <div className="space-y-0.5">
                  {items.map((d) => (
                    <button key={d.id} onClick={() => openGraph(d.data, d.id)} className={listBtn(graph?.name === d.name)}>
                      <Workflow className="w-3 h-3 shrink-0" />
                      <span className="truncate">{d.name}</span>
                      <span className="ml-auto text-[10px]" style={{ color: UE.faint }}>{KIND_LABEL[d.kind] || d.kind}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!defs.length && <div className="text-[11px] px-1" style={{ color: UE.faint }}>图库为空，正在固化标准库…</div>}
          </div>
        </div>
        <div className="p-3 text-[10px] leading-4" style={{ borderTop: `1px solid ${UE.border}`, color: UE.faint }}>
          画布内添加节点：<span style={{ color: UE.dim }}>右键点按</span> 或 <span style={{ color: UE.dim }}>从端口拖线甩到空白</span>，弹出联想菜单。
        </div>
      </div>

      {/* 中央：React Flow 蓝图画布 */}
      <div className="flex-1 relative overflow-hidden">
        {!graph ? (
          <div className="h-full flex items-center justify-center text-sm" style={{ color: UE.faint }}>
            选择或新建一个图。动作/条件模板会被 BT、FSM、GOAP、HTN、Utility 共同复用。
          </div>
        ) : (
          <>
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2" style={{ background: `${UE.toolbar}ee`, borderBottom: `1px solid ${UE.border}` }}>
              <Input value={graph.name} onChange={(e) => mutate((g) => { g.name = e.target.value; })} className={`w-48 ${inputCls}`} />
              <Select value={graph.kind} onValueChange={(k) => mutate((g) => { g.kind = k; })}>
                <SelectTrigger className={`w-28 ${inputCls}`}><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(KIND_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
              {(graph.kind === 'action') && (
                <Input value={graph.command || ''} placeholder="指令名 command" onChange={(e) => mutate((g) => { g.command = e.target.value || undefined; })}
                  className={`w-36 ${inputCls}`} />
              )}
              <div className="flex-1" />
              <Button size="sm" variant="ghost" onClick={ur.undo} disabled={!ur.canUndo} title="撤销 (Ctrl+Z)" className="h-7 w-7 p-0" style={{ color: UE.dim }}><Undo2 className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={ur.redo} disabled={!ur.canRedo} title="重做 (Ctrl+Y)" className="h-7 w-7 p-0" style={{ color: UE.dim }}><Redo2 className="w-3.5 h-3.5" /></Button>
              <span className="text-[10px] hidden lg:block" style={{ color: UE.faint }}>左键框选 · 右键平移/点按出菜单 · 拖线甩空白联想 · Ctrl+C/V/D/S</span>
              <Button size="sm" variant="ghost" onClick={() => mutate((g) => { for (const n of g.nodes) { delete n.x; delete n.y; } autoLayoutGraph(g, true); })} className="h-7 text-xs" style={{ color: UE.dim }}>
                <LayoutGrid className="w-3.5 h-3.5" /> 整理
              </Button>
              <Button size="sm" variant="ghost" onClick={runGraph} disabled={running} className="h-7 text-xs" style={{ color: UE.ok }}>
                {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} 运行
              </Button>
              <Button size="sm" variant="ghost" onClick={save} disabled={!dirty} className="h-7 text-xs" style={{ color: UE.warn }}><Save className="w-3.5 h-3.5" /> 保存{dirty ? '*' : ''}</Button>
              <Button size="sm" variant="ghost" onClick={remove} className="h-7 text-xs" style={{ color: UE.err }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
            <div
              ref={wrapRef}
              className="absolute inset-0 top-10"
              onPointerDownCapture={onWrapPointerDownCapture}
              onPointerUpCapture={onWrapPointerUpCapture}
            >
              <ReactFlow
                key={graph.name + (entityId || 'new')}
                nodes={rfNodes}
                edges={rfEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onInit={(i) => { rfRef.current = i; }}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onReconnect={onReconnect}
                isValidConnection={isValidConnection}
                onNodeDrag={hl.onDrag}
                onNodeDragStop={onNodeDragStop}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                onSelectionChange={onSelectionChange}
                onPaneContextMenu={(e) => e.preventDefault()}
                selectionMode={SelectionMode.Partial}
                nodeTypes={nodeTypes}
                fitView
                {...UE_RF_COMMON}
              >
                <Background variant={BackgroundVariant.Dots} color={UE.grid} gap={20} size={1.2} />
                <Controls showInteractive={false} />
                <MiniMap nodeColor={(n) => n.data?.band || '#3c3c46'} {...UE_MINIMAP} />
                <HelperLines x={hl.helper.x} y={hl.helper.y} />
              </ReactFlow>
              {menu && (
                <NodeMenu
                  x={menu.mx} y={menu.my}
                  items={menuItems}
                  active={menuActive} setActive={setMenuActive}
                  query={menuQuery} setQuery={setMenuQuery}
                  onPick={pickNode}
                  onClose={() => setMenu(null)}
                  hint={menuHint}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* 右栏：属性 + 图输入输出 + 运行结果 */}
      <div className="w-72 shrink-0 overflow-y-auto" style={{ background: UE.panel, borderLeft: `1px solid ${UE.border}` }}>
        {graph && selected && (() => {
          const node = graph.nodes.find((n) => n.id === selected);
          if (!node) return null;
          const def = NODE_TYPES[node.type];
          const schema = def?.propsSchema || {};
          return (
            <div className="p-3" style={{ borderBottom: `1px solid ${UE.border}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold">{def?.label}</span>
                {node.type !== 'flow.start' && (
                  <Button size="sm" variant="ghost" onClick={deleteSelected} className="h-6 text-[11px] px-2" style={{ color: UE.err }}><Trash2 className="w-3 h-3" /></Button>
                )}
              </div>
              <div className="text-[10px] mb-2" style={{ color: UE.faint }}>{node.type}</div>
              {Object.entries(schema).map(([key, s]) => (
                <div key={key} className="mb-2">
                  <Label className="text-[11px]" style={{ color: UE.dim }}>{key}</Label>
                  {s.type === 'select' ? (
                    <Select value={String(node.props?.[key] ?? s.default ?? '')} onValueChange={(v) => mutate((g) => { const nd = g.nodes.find((x) => x.id === selected); nd.props = { ...(nd.props || {}), [key]: v }; })}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent>{s.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : s.type === 'bool' ? (
                    <Select value={String(node.props?.[key] ?? s.default ?? false)} onValueChange={(v) => mutate((g) => { const nd = g.nodes.find((x) => x.id === selected); nd.props = { ...(nd.props || {}), [key]: v === 'true' }; })}>
                      <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="true">true</SelectItem><SelectItem value="false">false</SelectItem></SelectContent>
                    </Select>
                  ) : s.type === 'graphRef' ? (
                    <Select value={node.props?.[key] || ''} onValueChange={(v) => mutate((g) => { const nd = g.nodes.find((x) => x.id === selected); nd.props = { ...(nd.props || {}), [key]: v }; })}>
                      <SelectTrigger className={inputCls}><SelectValue placeholder="选择图" /></SelectTrigger>
                      <SelectContent>
                        {defs.map((d) => ({ name: d.name, kind: d.kind }))
                          .filter((d) => d.name !== graph.name && (s.kind ? d.kind === s.kind : true))
                          .map((d) => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={typeof node.props?.[key] === 'object' ? JSON.stringify(node.props[key]) : String(node.props?.[key] ?? s.default ?? '')}
                      onChange={(e) => mutate((g) => {
                        const nd = g.nodes.find((x) => x.id === selected);
                        let v = e.target.value;
                        if (s.type === 'number' || s.type === 'int') v = Number(v) || 0;
                        else if (s.type === 'any') { try { v = JSON.parse(v); } catch {} }
                        nd.props = { ...(nd.props || {}), [key]: v };
                      })}
                      className={inputCls} />
                  )}
                </div>
              ))}
              {!Object.keys(schema).length && <div className="text-[11px]" style={{ color: UE.faint }}>该节点无可编辑属性，端口取值可用 props 同名键兜底。</div>}
            </div>
          );
        })()}
        {graph && (
          <div className="p-3">
            <div className="text-xs font-semibold mb-2">图输入/输出</div>
            {(graph.inputs || []).map((inp, i) => (
              <div key={i} className="flex gap-1 mb-1">
                <Input value={inp.key} onChange={(e) => mutate((g) => { g.inputs[i].key = e.target.value; })} className={`h-6 text-[11px] ${inputCls}`} />
                <Button size="sm" variant="ghost" className="h-6 px-1" style={{ color: UE.err }} onClick={() => mutate((g) => { g.inputs.splice(i, 1); })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
            <Button size="sm" variant="ghost" className="h-6 text-[11px] px-1" style={{ color: UE.dim }} onClick={() => mutate((g) => { g.inputs = [...(g.inputs || []), { key: 'param' + (g.inputs?.length || 0), type: 'any', default: 0 }]; })}><Plus className="w-3 h-3" /> 输入</Button>
            {(graph.kind === 'function' || graph.kind === 'script') && (
              <>
                {(graph.outputs || []).map((o, i) => (
                  <div key={i} className="flex gap-1 mb-1 mt-2">
                    <Input value={o.key} onChange={(e) => mutate((g) => { g.outputs[i].key = e.target.value; })} className={`h-6 text-[11px] ${inputCls}`} />
                    <Button size="sm" variant="ghost" className="h-6 px-1" style={{ color: UE.err }} onClick={() => mutate((g) => { g.outputs.splice(i, 1); })}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" className="h-6 text-[11px] px-1" style={{ color: UE.dim }} onClick={() => mutate((g) => { g.outputs = [...(g.outputs || []), { key: 'out' + (g.outputs?.length || 0), type: 'any' }]; })}><Plus className="w-3 h-3" /> 输出</Button>
              </>
            )}
          </div>
        )}
        {runResult && (
          <div className="p-3" style={{ borderTop: `1px solid ${UE.border}` }}>
            <div className="text-xs font-semibold mb-1">运行结果</div>
            {runResult.error ? (
              <div className="text-[11px] whitespace-pre-wrap" style={{ color: UE.err }}>{runResult.error}</div>
            ) : (
              <>
                <div className="text-[11px] mb-1" style={{ color: runResult.st === 'success' ? UE.ok : UE.warn }}>
                  状态 {runResult.st} · {runResult.ticks} tick
                </div>
                {runResult.out && <pre className="text-[10px] rounded p-2 mb-1 overflow-x-auto" style={{ background: UE.panelDeep }}>{JSON.stringify(runResult.out, null, 1)}</pre>}
                {runResult.logs?.length > 0 && <div className="text-[10px] mb-1" style={{ color: UE.dim }}>日志：{runResult.logs.join(' | ')}</div>}
                {runResult.trace?.length > 0 && (
                  <div className="max-h-40 overflow-y-auto">
                    <div className="text-[10px] mb-0.5" style={{ color: UE.faint }}>节点 trace（每个指令可追溯到具体节点）：</div>
                    {runResult.trace.slice(0, 60).map((t, i) => (
                      <div key={i} className="text-[10px] flex items-center gap-1" style={{ color: UE.faint }}><ChevronRight className="w-2.5 h-2.5" />{t.node} <span style={{ color: '#3c3c46' }}>{t.type}</span></div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}