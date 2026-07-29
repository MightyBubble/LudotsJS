// 行为树编辑器 —— React Flow 画布 + 虚幻蓝图视觉。
// 数据模型：BehaviorTree.data.nodes [{id,type,x,y,children[],task_node_id?}]
// 叶节点（action/condition）引用 TaskNode 服务节点 → 最终落到 GraphVM 模板图。
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Trash2, Network, GitBranch, ArrowRightLeft,
  Play, HelpCircle, Save, Circle, ChevronRight, Pencil, Undo2, Redo2,
} from 'lucide-react';
import { UE, ueEdgeStyle, ueNodeBox, ueHeader, UE_CONTROLS_CLS, UE_RF_COMMON, UE_MINIMAP } from '@/components/aieditor/theme.js';
import { NodeShell } from '@/components/aieditor/nodeshell.jsx';
import { useContextMenu, ContextMenu } from '@/components/aieditor/ctxmenu.jsx';
import { useHelperLines, HelperLines } from '@/components/aieditor/helperlines.jsx';
import { useUndoRedo } from '@/components/aieditor/usehistory.js';

const genId = (p) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// UE 蓝图语义色板
const BT_NODE_CONFIG = {
  root: { label: 'Root', color: '#8E8E93', icon: Circle },
  sequence: { label: 'Sequence', color: '#C7C7CC', icon: ArrowRightLeft },
  selector: { label: 'Selector', color: '#D1D1D6', icon: GitBranch },
  action: { label: 'Action', color: '#98989D', icon: Play },
  condition: { label: 'Condition', color: '#AEAEB2', icon: HelpCircle },
};
const COMPOSITES = ['root', 'sequence', 'selector'];
const CHILD_TYPES = [
  { type: 'sequence', label: 'Sequence', icon: ArrowRightLeft },
  { type: 'selector', label: 'Selector', icon: GitBranch },
  { type: 'action', label: 'Action', icon: Play },
  { type: 'condition', label: 'Condition', icon: HelpCircle },
];
const NW = 200;

// ── BT 节点：统一节点壳（类型色带 + 名字 + 子数徽标；上入下出；缩远只显标题） ──
function BtNode({ data, selected }) {
  const cfg = BT_NODE_CONFIG[data.nodeType] || BT_NODE_CONFIG.action;
  const isComposite = COMPOSITES.includes(data.nodeType);
  return (
    <NodeShell color={cfg.color} icon={cfg.icon} typeLabel={cfg.label} title={data.title} width={NW}
      selected={selected} leftIn={false} rightOut={false}
      topIn={data.nodeType !== 'root'} bottomOut={isComposite}
      badge={data.childCount > 0 && (
        <span className="ml-auto text-[9px] px-1 rounded shrink-0" style={{ background: '#00000044', color: UE.nodeTitle }}>{data.childCount}</span>
      )}>
      {data.subtitle && <div className="text-[10px] truncate" style={{ color: UE.dim }}>{data.subtitle}</div>}
    </NodeShell>
  );
}
const nodeTypes = { btNode: BtNode };

export default function BehaviorTreeEditor() {
  const [trees, setTrees] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [tree, setTree] = useState(null);
  const [taskNodes, setTaskNodes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(true);
  const [picker, setPicker] = useState(null); // { parentId, nodeType }
  const { menu, open: openMenu, close: closeMenu } = useContextMenu();
  const saveTimer = useRef(null);
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState([]);
  const hl = useHelperLines(rfNodes, setRfNodes);

  const taskNodeMap = useMemo(() => {
    const m = {};
    taskNodes.forEach((n) => (m[n.id] = n));
    return m;
  }, [taskNodes]);

  const loadLists = async () => {
    const [ts, tns] = await Promise.all([
      base44.entities.BehaviorTree.list('-created_date'),
      base44.entities.TaskNode.list(),
    ]);
    setTrees(ts || []);
    setTaskNodes(tns || []);
    if (ts?.length && !currentId) setCurrentId(ts[0].id);
  };
  useEffect(() => { loadLists(); }, []);

  useEffect(() => {
    if (!currentId) return;
    (async () => {
      const t = await base44.entities.BehaviorTree.get(currentId);
      if (t && typeof t.data === 'string') { try { t.data = JSON.parse(t.data); } catch { t.data = { nodes: [] }; } }
      setTree(t);
      setSelectedId(null);
      setDirty(false);
      setSaved(true);
      ur.clear();
    })();
  }, [currentId]);

  // 防抖自动保存
  useEffect(() => {
    if (!tree || !dirty) return;
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await base44.entities.BehaviorTree.update(tree.id, { name: tree.name, data: tree.data });
      setDirty(false);
      setSaved(true);
    }, 800);
    return () => saveTimer.current && clearTimeout(saveTimer.current);
  }, [tree, dirty]);

  const updateTree = useCallback((updater) => {
    setTree((prev) => {
      if (!prev) return prev;
      const data = JSON.parse(JSON.stringify(prev.data || { nodes: [] }));
      updater(data);
      return { ...prev, data };
    });
    setDirty(true);
  }, []);

  // 撤销/重做（快照=树名+节点数据；切树时清历史——见 currentId effect）
  const ur = useUndoRedo(
    useCallback(() => (tree ? JSON.stringify({ name: tree.name, data: tree.data }) : null), [tree]),
    useCallback((s) => {
      const p = JSON.parse(s);
      setTree((prev) => (prev ? { ...prev, ...p } : prev));
      setSelectedId(null);
      setDirty(true);
    }, []),
    [tree]);

  const nodes = tree?.data?.nodes || [];

  // tree → RF
  useEffect(() => {
    setRfNodes(nodes.map((n) => {
      const cfg = BT_NODE_CONFIG[n.type] || BT_NODE_CONFIG.action;
      const tn = n.task_node_id ? taskNodeMap[n.task_node_id] : null;
      return {
        id: n.id, type: 'btNode', position: { x: n.x || 0, y: n.y || 0 },
        data: {
          nodeType: n.type, childCount: (n.children || []).length,
          title: tn ? tn.name : cfg.label,
          subtitle: tn ? (tn.node_type === 'action' ? '动作服务' : '条件服务') : null,
        },
      };
    }));
    const edges = [];
    for (const n of nodes) for (const cid of n.children || []) {
      edges.push({ id: `${n.id}-${cid}`, source: n.id, sourceHandle: 'out', target: cid, targetHandle: 'in', ...ueEdgeStyle(UE.dim, 1.5) });
    }
    setRfEdges(edges);
  }, [tree, taskNodeMap, setRfNodes, setRfEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedId);

  const onNodeDragStop = useCallback(() => {
    hl.clear();
    setRfNodes((ns) => {
      const pos = Object.fromEntries(ns.map((n) => [n.id, n.position]));
      updateTree((data) => {
        for (const n of data.nodes) if (pos[n.id]) { n.x = pos[n.id].x; n.y = pos[n.id].y; }
      });
      return ns;
    });
  }, [setRfNodes, updateTree, hl]);

  // 拖线换父：source=组合节点 → target=非根节点；不允许成环
  const isValidConnection = useCallback((conn) => {
    if (!conn.source || !conn.target || conn.source === conn.target) return false;
    const src = nodes.find((n) => n.id === conn.source);
    if (!src || !COMPOSITES.includes(src.type)) return false;
    const dst = nodes.find((n) => n.id === conn.target);
    if (!dst || dst.type === 'root') return false;
    // 目标不能是 source 的祖先（防环）
    let cur = src;
    const parentOf = (id) => nodes.find((n) => (n.children || []).includes(id));
    while (cur) {
      if (cur.id === dst.id) return false;
      cur = parentOf(cur.id);
    }
    return true;
  }, [nodes]);

  const onConnect = useCallback((conn) => {
    updateTree((data) => {
      data.nodes.forEach((n) => { if (n.children) n.children = n.children.filter((c) => c !== conn.target); });
      const p = data.nodes.find((n) => n.id === conn.source);
      p.children = [...(p.children || []), conn.target];
    });
  }, [updateTree]);

  // 拖线头重插 = 换父（BT 的线只有父子语义）
  const onReconnect = useCallback((oldEdge, conn) => {
    const src = nodes.find((n) => n.id === conn.source);
    const dst = nodes.find((n) => n.id === conn.target);
    if (!src || !dst || !COMPOSITES.includes(src.type) || dst.type === 'root' || conn.source === conn.target) return;
    let cur = src;
    const parentOf = (id) => nodes.find((n) => (n.children || []).includes(id));
    while (cur) {
      if (cur.id === dst.id) return; // 防环
      cur = parentOf(cur.id);
    }
    updateTree((data) => {
      data.nodes.forEach((n) => { if (n.children) n.children = n.children.filter((c) => c !== conn.target); });
      const p = data.nodes.find((n) => n.id === conn.source);
      p.children = [...(p.children || []), conn.target];
    });
  }, [nodes, updateTree]);

  const onNodesDelete = useCallback((deleted) => {
    const ids = deleted.filter((d) => {
      const n = nodes.find((x) => x.id === d.id);
      return n && n.type !== 'root';
    }).map((d) => d.id);
    if (!ids.length) return;
    updateTree((data) => {
      const toDelete = new Set();
      const collect = (nid) => {
        toDelete.add(nid);
        const n = data.nodes.find((x) => x.id === nid);
        (n?.children || []).forEach(collect);
      };
      ids.forEach(collect);
      data.nodes.forEach((n) => { if (n.children) n.children = n.children.filter((c) => !toDelete.has(c)); });
      data.nodes = data.nodes.filter((n) => !toDelete.has(n.id));
    });
    setSelectedId(null);
  }, [nodes, updateTree]);

  const addChild = (parentId, childType) => {
    if (childType === 'action' || childType === 'condition') {
      setPicker({ parentId, nodeType: childType });
      return;
    }
    insertChild(parentId, childType, null);
  };

  const insertChild = (parentId, childType, taskNodeId) => {
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;
    const childCount = parent.children?.length || 0;
    const newNode = {
      id: genId('n'), type: childType,
      x: (parent.x || 0) + childCount * 70 - 30, y: (parent.y || 0) + 140,
      ...(childType === 'action' || childType === 'condition' ? { task_node_id: taskNodeId } : { children: [] }),
    };
    updateTree((data) => {
      const p = data.nodes.find((n) => n.id === parentId);
      p.children = [...(p.children || []), newNode.id];
      data.nodes.push(newNode);
    });
    setSelectedId(newNode.id);
  };

  const confirmPicker = (taskNodeId) => {
    insertChild(picker.parentId, picker.nodeType, taskNodeId);
    setPicker(null);
  };

  const deleteNode = (id) => onNodesDelete([{ id }]);

  // 右键联想菜单（与全部编辑器统一）：空白 = 根下添加；节点 = 添加子节点/删除子树
  const onPaneContextMenu = (e) => {
    const root = nodes.find((n) => n.type === 'root');
    if (!root) return;
    openMenu(e, CHILD_TYPES.map((ct) => ({
      icon: ct.icon, color: BT_NODE_CONFIG[ct.type].color,
      label: `根下添加 · ${ct.label}`,
      onClick: () => addChild(root.id, ct.type),
    })));
  };
  const onNodeContextMenu = (e, n) => {
    const node = nodes.find((x) => x.id === n.id);
    if (!node) return;
    const items = [{ icon: Pencil, label: '编辑节点', onClick: () => setSelectedId(n.id) }];
    if (COMPOSITES.includes(node.type)) {
      for (const ct of CHILD_TYPES) {
        items.push({
          icon: ct.icon, color: BT_NODE_CONFIG[ct.type].color,
          label: `添加子节点 · ${ct.label}`,
          onClick: () => addChild(node.id, ct.type),
        });
      }
    }
    if (node.type !== 'root') {
      items.push({ icon: Trash2, color: UE.err, label: '删除节点（含子树）', hint: 'Del', onClick: () => deleteNode(node.id) });
    }
    openMenu(e, items);
  };

  const setNodeTask = (nodeId, taskNodeId) => {
    updateTree((data) => {
      const idx = data.nodes.findIndex((n) => n.id === nodeId);
      if (idx >= 0) data.nodes[idx] = { ...data.nodes[idx], task_node_id: taskNodeId };
    });
  };

  const createNew = async () => {
    const rootId = genId('n');
    const t = await base44.entities.BehaviorTree.create({
      name: '新行为树', description: '',
      data: { nodes: [{ id: rootId, type: 'root', x: 400, y: 40, children: [] }] },
    });
    setTrees((prev) => [t, ...prev]);
    setCurrentId(t.id);
  };

  const deleteTree = async (id) => {
    await base44.entities.BehaviorTree.delete(id);
    setTrees((prev) => prev.filter((t) => t.id !== id));
    if (currentId === id) setCurrentId(null);
  };

  return (
    <div className="flex h-full" style={{ background: UE.canvas, color: UE.text }}>
      {/* 左：树列表 */}
      <div className="w-56 flex flex-col shrink-0" style={{ background: UE.panel, borderRight: `1px solid ${UE.border}` }}>
        <div className="p-3" style={{ borderBottom: `1px solid ${UE.border}` }}>
          <Button onClick={createNew} className="w-full gap-2" size="sm"><Plus className="w-4 h-4" />新建行为树</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {trees.map((t) => (
            <div key={t.id}
              className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${currentId === t.id ? 'bg-[rgba(255,255,255,0.10)]' : 'hover:bg-[rgba(255,255,255,0.05)]'}`}
              onClick={() => setCurrentId(t.id)}>
              <Network className="w-3.5 h-3.5 shrink-0" style={{ color: '#C7C7CC' }} />
              <span className="text-sm flex-1 truncate" style={{ color: UE.text }}>{t.name}</span>
              <button onClick={(e) => { e.stopPropagation(); deleteTree(t.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity" style={{ color: UE.err }}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {trees.length === 0 && <div className="text-xs text-center py-4" style={{ color: UE.faint }}>暂无行为树</div>}
        </div>
      </div>

      {/* 中：画布 */}
      <div className="flex-1 flex flex-col min-w-0">
        {tree ? (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: UE.toolbar, borderBottom: `1px solid ${UE.border}` }}>
              <Input value={tree.name} onChange={(e) => { setTree((prev) => ({ ...prev, name: e.target.value })); setDirty(true); }}
                className="h-8 w-48 text-sm font-medium bg-[#0E0F12] border-[rgba(255,255,255,0.08)] text-[#d6d6dc]" />
              <span className="text-[10px] hidden lg:block" style={{ color: UE.faint }}>拖线/重插 = 改父子 · Shift 框选 · Delete 删子树</span>
              <div className="flex items-center gap-1.5 text-xs ml-auto">
                <Button size="sm" variant="ghost" onClick={ur.undo} disabled={!ur.canUndo} title="撤销 (Ctrl+Z)" className="h-7 w-7 p-0 hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.text }}><Undo2 className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={ur.redo} disabled={!ur.canRedo} title="重做 (Ctrl+Y)" className="h-7 w-7 p-0 hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.text }}><Redo2 className="w-3.5 h-3.5" /></Button>
                {saved ? (
                  <span className="flex items-center gap-1" style={{ color: UE.faint }}><Save className="w-3 h-3" />已保存</span>
                ) : <span style={{ color: UE.warn }}>保存中...</span>}
              </div>
            </div>
            <div className="flex-1 relative">
              <ReactFlow
                key={tree.id}
                nodes={rfNodes}
                edges={rfEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onReconnect={onReconnect}
                isValidConnection={isValidConnection}
                onNodeDrag={hl.onDrag}
                onNodeDragStop={onNodeDragStop}
                onNodesDelete={onNodesDelete}
                onNodeClick={(_, n) => setSelectedId(n.id)}
                onPaneClick={() => setSelectedId(null)}
                onPaneContextMenu={onPaneContextMenu}
                onNodeContextMenu={onNodeContextMenu}
                nodeTypes={nodeTypes}
                fitView
                {...UE_RF_COMMON}
              >
                <Background variant={BackgroundVariant.Dots} color={UE.grid} gap={20} size={1.2} />
                <Controls showInteractive={false} />
                <MiniMap nodeColor={(n) => BT_NODE_CONFIG[n.data?.nodeType]?.color || '#3c3c46'} {...UE_MINIMAP} />
                <HelperLines x={hl.helper.x} y={hl.helper.y} />
              </ReactFlow>
              <ContextMenu menu={menu} onClose={closeMenu} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ color: UE.faint }}>选择或创建一个行为树</div>
        )}
      </div>

      {/* 右：属性 */}
      <div className="w-72 flex flex-col shrink-0 overflow-y-auto" style={{ background: UE.panel, borderLeft: `1px solid ${UE.border}` }}>
        {selectedNode ? (
          <div className="p-4 space-y-4">
            <div>
              <div className="text-xs mb-1" style={{ color: UE.faint }}>选中节点</div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: BT_NODE_CONFIG[selectedNode.type]?.color }} />
                <span className="font-semibold" style={{ color: UE.text }}>{BT_NODE_CONFIG[selectedNode.type]?.label}</span>
              </div>
            </div>

            {(selectedNode.type === 'action' || selectedNode.type === 'condition') && (
              <div className="space-y-1.5">
                <Label className="text-xs" style={{ color: UE.dim }}>服务节点（模板图）</Label>
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {taskNodes.filter((n) => n.node_type === selectedNode.type).map((n) => (
                    <button key={n.id} onClick={() => setNodeTask(selectedNode.id, n.id)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm border transition-colors ${selectedNode.task_node_id === n.id ? 'border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.08)]' : 'border-[#2e2e36] hover:bg-[rgba(255,255,255,0.05)]'}`}
                      style={{ color: UE.text }}>
                      {n.name}
                    </button>
                  ))}
                  {taskNodes.filter((n) => n.node_type === selectedNode.type).length === 0 && (
                    <div className="text-xs px-1" style={{ color: UE.faint }}>暂无{selectedNode.type === 'action' ? 'Action' : 'Condition'}服务节点</div>
                  )}
                </div>
              </div>
            )}

            {COMPOSITES.includes(selectedNode.type) && (
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: UE.dim }}>添加子节点</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CHILD_TYPES.map((ct) => {
                    const Icon = ct.icon;
                    return (
                      <button key={ct.type} onClick={() => addChild(selectedNode.id, ct.type)}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors hover:bg-[rgba(255,255,255,0.05)]"
                        style={{ borderColor: UE.border, color: UE.text }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: BT_NODE_CONFIG[ct.type].color }} />
                        {ct.label}
                      </button>
                    );
                  })}
                </div>
                {selectedNode.children?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-xs" style={{ color: UE.faint }}>子节点 ({selectedNode.children.length})</div>
                    {selectedNode.children.map((cid) => {
                      const child = nodes.find((n) => n.id === cid);
                      if (!child) return null;
                      const tn = child.task_node_id ? taskNodeMap[child.task_node_id] : null;
                      return (
                        <button key={cid} onClick={() => setSelectedId(cid)}
                          className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-[rgba(255,255,255,0.05)]" style={{ color: UE.text }}>
                          <ChevronRight className="w-3 h-3" style={{ color: UE.faint }} />
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: BT_NODE_CONFIG[child.type]?.color }} />
                          <span className="truncate">{tn ? tn.name : BT_NODE_CONFIG[child.type]?.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {selectedNode.type !== 'root' && (
              <Button variant="outline" onClick={() => deleteNode(selectedNode.id)}
                className="w-full gap-2 border-[#2e2e36]" style={{ color: UE.err }} size="sm">
                <Trash2 className="w-3.5 h-3.5" />删除节点（含子树）
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 text-sm text-center mt-8" style={{ color: UE.faint }}>选择一个节点查看属性</div>
        )}
      </div>

      {/* 服务节点选择对话框 */}
      <Dialog open={!!picker} onOpenChange={(v) => !v && setPicker(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择 {picker?.nodeType === 'action' ? 'Action' : 'Condition'} 服务节点</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5 max-h-80 overflow-y-auto py-2">
            {taskNodes.filter((n) => n.node_type === picker?.nodeType).map((n) => (
              <button key={n.id} onClick={() => confirmPicker(n.id)}
                className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                <div className="font-medium text-sm text-slate-800">{n.name}</div>
                {n.description && <div className="text-xs text-slate-400 mt-0.5">{n.description}</div>}
              </button>
            ))}
            {taskNodes.filter((n) => n.node_type === picker?.nodeType).length === 0 && (
              <div className="text-sm text-slate-400 text-center py-4">请先在服务节点库中创建{picker?.nodeType === 'action' ? 'Action' : 'Condition'}节点</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
