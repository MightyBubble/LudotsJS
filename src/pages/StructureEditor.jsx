import React, { useState, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Network, Plus, Save, Trash2, Search, X, LayoutGrid } from "lucide-react";
import GraphCanvas from '@/components/graph/GraphCanvas';

// Custom Node Component for Structure Editor
const StructureNode = ({ node, selected, onSelect, onStartConnection, onEndConnection, onUpdatePosition }) => {
  const handleMouseDown = (e) => {
    if (e.button === 0) {
      e.stopPropagation();
      onSelect(node.id, e.shiftKey);
    }
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        left: node.position.x,
        top: node.position.y,
        cursor: 'move',
      }}
      className={`px-4 py-2 rounded-lg shadow-lg border-2 min-w-[120px] text-center transition-all ${selected ? 'border-blue-500 bg-[#2d2d2d]' : 'border-[#3d3d3d] bg-[#1e1e1e]'}`}
    >
      {/* Input Port (Top) */}
      <div
        className="absolute left-1/2 -top-1.5 w-3 h-3 bg-gray-400 rounded-full -translate-x-1/2 hover:bg-blue-400 cursor-crosshair z-10"
        data-node-id={node.id}
        data-port-id="in"
        data-port-type="input"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnection(node.id, 'in', 'input', e.currentTarget);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onEndConnection(node.id, 'in', 'input');
        }}
      />

      <div className="font-bold text-white text-sm pointer-events-none">{node.data.label}</div>
      <div className="text-[10px] text-gray-400 font-mono mt-1 pointer-events-none">{node.data.nodeId}</div>

      {/* Output Port (Bottom) */}
      <div
        className="absolute left-1/2 -bottom-1.5 w-3 h-3 bg-gray-400 rounded-full -translate-x-1/2 hover:bg-blue-400 cursor-crosshair z-10"
        data-node-id={node.id}
        data-port-id="out"
        data-port-type="output"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnection(node.id, 'out', 'output', e.currentTarget);
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          onEndConnection(node.id, 'out', 'output');
        }}
      />
    </div>
  );
};

export default function StructureEditorPage() {
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const queryClient = useQueryClient();

  const { data: structures = [] } = useQuery({
    queryKey: ['structureDefinitions'],
    queryFn: () => base44.entities.StructureDefinition.list(),
    initialData: [],
  });

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.StructureDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structureDefinitions'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StructureDefinition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structureDefinitions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.StructureDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structureDefinitions'] });
      setSelectedStructure(null);
    },
  });

  const loadGraph = (structure) => {
    setSelectedStructure(structure);
    
    const initialNodes = (structure.nodes || []).map(n => ({
      id: n.node_id,
      position: n.position || { x: 0, y: 0 },
      data: { 
        label: n.name,
        nodeId: n.node_id,
        description: n.description
      },
    }));

    const initialConnections = (structure.edges || []).map((e, i) => ({
      id: `e-${i}`,
      fromNode: e.source_node_id,
      fromPort: 'out',
      toNode: e.target_node_id,
      toPort: 'in',
      data: { ...e, label: relations.find(r => r.relation_id === e.relation_definition_id)?.name || e.relation_definition_id }
    }));

    setNodes(initialNodes);
    setConnections(initialConnections);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSave = () => {
    if (!selectedStructure) return;

    const structureData = {
      ...selectedStructure,
      nodes: nodes.map(n => ({
        node_id: n.id,
        name: n.data.label,
        description: n.data.description || "",
        position: n.position
      })),
      edges: connections.map(c => ({
        source_node_id: c.fromNode,
        target_node_id: c.toNode,
        relation_definition_id: c.data?.relation_definition_id || "",
        attribute_values: c.data?.attribute_values || {}
      }))
    };

    updateMutation.mutate({ id: selectedStructure.id, data: structureData });
  };

  const handleAddNode = () => {
    const id = `node_${nodes.length + 1}`;
    const newNode = {
      id,
      position: { x: 100, y: 100 },
      data: { label: `新节点 ${nodes.length + 1}`, nodeId: id },
    };
    setNodes(prev => [...prev, newNode]);
  };

  // Callbacks for GraphCanvas
  const onUpdateNodePosition = useCallback((nodeId, position) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, position } : n));
  }, []);

  const onUpdateNodeData = useCallback((nodeId, data) => {
    // Not used much here, but needed for interface
  }, []);

  const onDeleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.fromNode !== nodeId && c.toNode !== nodeId));
    setEditingNode(null);
  }, []);

  const onAddConnection = useCallback((connection) => {
    const defaultRelation = relations[0]?.relation_id || "relation";
    const newConnection = {
      ...connection,
      data: { 
        relation_definition_id: defaultRelation,
        label: relations.find(r => r.relation_id === defaultRelation)?.name || defaultRelation
      }
    };
    setConnections(prev => [...prev, newConnection]);
  }, [relations]);

  const onDeleteConnection = useCallback((connectionId) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
    setEditingEdge(null);
  }, []);

  const handleSelectNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingNode({ ...node.data, id: node.id });
      setEditingEdge(null);
    }
  }, [nodes]);

  const handleSelectConnection = useCallback((connectionId) => {
    const conn = connections.find(c => c.id === connectionId);
    if (conn) {
      setEditingEdge({ ...conn.data, id: conn.id });
      setEditingNode(null);
    }
  }, [connections]);

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      {/* Header */}
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-gray-400" />
          <span className="text-lg font-semibold text-gray-200">结构编辑器</span>
        </div>
        {selectedStructure && (
          <div className="flex items-center gap-4">
             <span className="text-sm font-bold text-blue-400">{selectedStructure.name}</span>
             <Button size="sm" onClick={handleSave} className="bg-[#0e639c] hover:bg-[#1177bb] h-7 text-xs">
               <Save className="w-3 h-3 mr-1" /> 保存结构
             </Button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: List */}
        <div className="w-64 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d] flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <Input 
                placeholder="搜索结构..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs" 
              />
            </div>
            <Button size="sm" onClick={() => setIsCreating(true)} className="h-8 px-2 bg-[#3d3d3d]">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isCreating && (
              <div className="p-2 bg-[#3d3d3d] rounded space-y-2 mb-2">
                <Input id="new-id" placeholder="ID (e.g. tech_tree)" className="h-7 text-xs" />
                <Input id="new-name" placeholder="名称" className="h-7 text-xs" />
                <div className="flex gap-1 justify-end">
                  <Button size="sm" className="h-6 text-xs" onClick={() => setIsCreating(false)}>取消</Button>
                  <Button size="sm" className="h-6 text-xs bg-blue-600" onClick={() => {
                    const id = document.getElementById('new-id').value;
                    const name = document.getElementById('new-name').value;
                    if(id && name) createMutation.mutate({ structure_id: id, name, nodes: [], edges: [] });
                  }}>创建</Button>
                </div>
              </div>
            )}
            {structures
              .filter(s => s.name.includes(searchQuery) || s.structure_id.includes(searchQuery))
              .map(s => (
              <div 
                key={s.id}
                onClick={() => loadGraph(s)}
                className={`p-2 rounded cursor-pointer text-xs flex justify-between items-center group ${selectedStructure?.id === s.id ? 'bg-[#0e639c] text-white' : 'text-gray-300 hover:bg-[#3d3d3d]'}`}
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-[10px] opacity-60">{s.structure_id}</div>
                </div>
                <Button 
                  variant="ghost" 
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-900/50 hover:text-red-200"
                  onClick={(e) => { e.stopPropagation(); if(confirm('删除?')) deleteMutation.mutate(s.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Graph Canvas */}
        <div className="flex-1 bg-[#1a1a1a] relative">
          {selectedStructure ? (
            <>
              <GraphCanvas
                nodes={nodes}
                connections={connections}
                zoom={zoom}
                pan={pan}
                onPanChange={setPan}
                onUpdateNodePosition={onUpdateNodePosition}
                onUpdateNodeData={onUpdateNodeData}
                onDeleteNode={onDeleteNode}
                onAddConnection={onAddConnection}
                onDeleteConnection={onDeleteConnection}
                NodeComponent={(props) => (
                  <StructureNode 
                    {...props} 
                    onSelect={(id) => {
                      props.onSelect(id);
                      handleSelectNode(id);
                    }}
                  />
                )}
                // Handle connection selection via GraphCanvas's internal selection mechanism
                // We intercept the selection state in parent by passing onSelectConnection if needed,
                // but GraphCanvas manages selection state. We rely on editingEdge state updated via specialized method or we can add a listener.
                // Actually GraphCanvas has onSelectConnection prop? Let's check GraphCanvas code.
                // Yes: onSelect={handleSelectConnection} for connections.
              />
              {/* GraphCanvas doesn't expose onSelectConnection directly as a prop to bubble up selection data, 
                  but we can hack it or better yet, let's rely on clicking the connection line which GraphCanvas handles.
                  Wait, GraphCanvas handles selection internally but doesn't callback with "selected connection data".
                  It just highlights it.
                  I might need to modify GraphCanvas to support external selection callback or 
                  I can just overlay a click handler if GraphCanvas doesn't support it. 
                  Actually, looking at GraphCanvas source:
                  <Connection ... onSelect={handleSelectConnection} />
                  handleSelectConnection updates internal state. It doesn't prop out.
                  
                  Workaround: I'll just add a click listener on the canvas wrapper to detect clicks on connections if possible, 
                  OR I'll modify the GraphCanvas to accept onConnectionSelect prop. 
                  
                  However, for now, to keep it simple and avoid editing GraphCanvas:
                  The user can delete connections using Backspace which GraphCanvas handles.
                  Editing connection data (relation type) is the missing piece if I can't select it.
                  
                  I will Assume GraphCanvas is "good enough" for positioning and connecting.
                  For editing edge properties, I might need a custom Connection component or modify GraphCanvas.
                  
                  Actually, I can just iterate over connections and see which one is selected if I had access to GraphCanvas state.
                  
                  Let's look at StructureNode again. I passed onSelect.
                  
                  For connections, maybe I can just render them myself? No, GraphCanvas does it.
                  
                  Let's try to use the internal GraphCanvas features.
                  If I can't select edges to edit them, I'll just rely on deleting and re-creating for now, 
                  OR I'll assume the user is okay with just basic connections.
                  
                  WAIT, I can pass a custom Connection component to GraphCanvas? No.
                  
                  Let's check if I can pass `onConnectionClick` to GraphCanvas?
                  The provided `GraphCanvas` code doesn't seem to expose connection click events to the parent.
                  
                  Okay, I will simply use a trick:
                  I will rely on `onDeleteConnection` to remove edges.
                  For changing types, I might add a small UI on the edge? GraphCanvas doesn't support that.
                  
                  Alternative: I will add a simple list of "Current Connections" in the right panel 
                  where user can see and edit them.
              */}
              
              <div className="absolute top-4 left-4 bg-[#2d2d2d]/90 p-2 rounded border border-[#3d3d3d] flex gap-2">
                <Button size="sm" onClick={handleAddNode} className="h-7 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
                  <Plus className="w-3 h-3 mr-1" /> 添加节点
                </Button>
                <Button size="sm" onClick={() => { setZoom(z => Math.min(z + 0.1, 2)); }} className="h-7 w-7 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d]">+</Button>
                <Button size="sm" onClick={() => { setZoom(z => Math.max(z - 0.1, 0.5)); }} className="h-7 w-7 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d]">-</Button>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              <div className="text-center">
                <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>选择或创建一个结构开始编辑</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-64 bg-[#252526] border-l border-[#3d3d3d] p-4 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-200">
              {editingNode ? "节点属性" : "连接列表"}
            </h3>
            {(editingNode || editingEdge) && <Button size="sm" variant="ghost" onClick={() => { setEditingNode(null); setEditingEdge(null); }} className="h-6 w-6 p-0">
              <X className="w-4 h-4" />
            </Button>}
          </div>

          {editingNode ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">节点ID</label>
                <Input 
                  value={editingNode.nodeId} 
                  onChange={e => {
                    setEditingNode({...editingNode, nodeId: e.target.value});
                    setNodes(nds => nds.map(n => n.id === editingNode.id ? {...n, data: {...n.data, nodeId: e.target.value}} : n));
                  }}
                  className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">名称</label>
                <Input 
                  value={editingNode.label} 
                  onChange={e => {
                    setEditingNode({...editingNode, label: e.target.value});
                    setNodes(nds => nds.map(n => n.id === editingNode.id ? {...n, data: {...n.data, label: e.target.value}} : n));
                  }}
                  className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">描述</label>
                <Input 
                  value={editingNode.description || ""} 
                  onChange={e => {
                    setEditingNode({...editingNode, description: e.target.value});
                    setNodes(nds => nds.map(n => n.id === editingNode.id ? {...n, data: {...n.data, description: e.target.value}} : n));
                  }}
                  className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs"
                />
              </div>
              <Button 
                className="w-full bg-red-900/50 hover:bg-red-900 text-xs h-7 mt-4"
                onClick={() => onDeleteNode(editingNode.id)}
              >
                删除节点
              </Button>
            </div>
          ) : selectedStructure ? (
            // List all connections for editing since we can't easily select them in GraphCanvas
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-2">所有连接 ({connections.length})</div>
              {connections.map(conn => {
                const sourceLabel = nodes.find(n => n.id === conn.fromNode)?.data.label || conn.fromNode;
                const targetLabel = nodes.find(n => n.id === conn.toNode)?.data.label || conn.toNode;
                return (
                  <div key={conn.id} className="bg-[#1e1e1e] p-2 rounded border border-[#3d3d3d] text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-400">{sourceLabel} → {targetLabel}</span>
                      <button onClick={() => onDeleteConnection(conn.id)} className="text-red-400 hover:text-white">×</button>
                    </div>
                    <Select 
                      value={conn.data?.relation_definition_id || ""}
                      onValueChange={v => {
                        const relName = relations.find(r => r.relation_id === v)?.name || v;
                        setConnections(prev => prev.map(c => c.id === conn.id ? { ...c, data: { ...c.data, relation_definition_id: v, label: relName } } : c));
                      }}
                    >
                      <SelectTrigger className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-xs w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                        {relations.map(r => (
                          <SelectItem key={r.id} value={r.relation_id} className="text-xs">{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center mt-10">
              选择节点或连接进行编辑
            </div>
          )}
        </div>
      </div>
    </div>
  );
}