import React, { useState, useCallback } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, LayoutGrid } from "lucide-react";
import AssetBrowserPanel from "@/components/assetBrowser/AssetBrowserPanel";
import GraphCanvas from '@/components/graph/GraphCanvas';
import Toolbar from '@/components/graph/Toolbar';
import StructureNode from '@/components/graph/StructureNode';

export default function StructureEditorPage() {
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  const [showLibrary, setShowLibrary] = useState(true); // Used for left sidebar visibility
  
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
    onSuccess: (newStruct) => {
      queryClient.invalidateQueries({ queryKey: ['structureDefinitions'] });
      setIsCreating(false);
      loadGraph(newStruct);
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['structureDefinitions'] });
      if (selectedStructure && selectedStructure.id === id) {
        setSelectedStructure(null);
        setNodes([]);
        setConnections([]);
      }
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
    setEditingNode(null);
    setEditingEdge(null);
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
    const id = `node_${Date.now()}`;
    // Calculate position relative to the current view (center of the visible area)
    const x = (-pan.x + 150) / zoom; 
    const y = (-pan.y + 150) / zoom;
    
    const newNode = {
      id,
      position: { x, y },
      data: { label: `节点 ${nodes.length + 1}`, nodeId: id },
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

  return (
    <div className="h-full flex flex-col bg-[#0D0F14] text-white">
      <Toolbar
        onSave={handleSave}
        onZoomIn={() => setZoom(z => Math.min(z + 0.1, 2))}
        onZoomOut={() => setZoom(z => Math.max(z - 0.1, 0.5))}
        onResetView={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        onToggleLibrary={() => setShowLibrary(!showLibrary)}
        onBack={() => setSelectedStructure(null)}
        projectName={selectedStructure?.name || "结构编辑器"}
        zoom={zoom}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Structure List */}
        {(!selectedStructure || showLibrary) && (
          <AssetBrowserPanel
            entityName="StructureDefinition"
            records={structures}
            toItem={(s) => ({ id: s.id, name: s.name, subtitle: s.structure_id })}
            selectedId={selectedStructure?.id}
            onSelect={loadGraph}
            onCreate={() => setIsCreating(true)}
            onDelete={(s) => { if (window.confirm('确定删除此结构吗？')) deleteMutation.mutate(s.id); }}
          >
            {isCreating && (
              <div className="p-2 border-b border-[#2A2E37] space-y-2">
                <Input id="new-id" placeholder="ID (e.g. tech_tree)" className="h-7 text-xs bg-[#0D0F14] border-[#2A2E37] text-white" />
                <Input id="new-name" placeholder="名称" className="h-7 text-xs bg-[#0D0F14] border-[#2A2E37] text-white" />
                <div className="flex gap-1 justify-end">
                  <Button size="sm" className="h-6 text-xs bg-[#1E2128]" onClick={() => setIsCreating(false)}>取消</Button>
                  <Button size="sm" className="h-6 text-xs bg-[#D97706] hover:bg-[#B45309] text-white" onClick={() => {
                    const id = document.getElementById('new-id').value;
                    const name = document.getElementById('new-name').value;
                    if (id && name) createMutation.mutate({ structure_id: id, name, nodes: [], edges: [] });
                  }}>创建</Button>
                </div>
              </div>
            )}
          </AssetBrowserPanel>
        )}

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
                onZoomChange={setZoom}
                onUpdateNodePosition={onUpdateNodePosition}
                onUpdateNodeData={onUpdateNodeData}
                onDeleteNode={onDeleteNode}
                onAddConnection={onAddConnection}
                onDeleteConnection={onDeleteConnection}
                onSelectNode={handleSelectNode}
                NodeComponent={StructureNode}
              />
              
              <div className="absolute top-4 left-4 bg-[#15171C]/90 p-2 rounded border border-[#2A2E37] flex gap-2">
                <Button size="sm" onClick={handleAddNode} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37] text-xs text-white">
                  <Plus className="w-3 h-3 mr-1" /> 添加节点
                </Button>
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
        {selectedStructure && (
          <div className="w-64 bg-[#15171C] border-l border-[#2A2E37] p-4 overflow-y-auto">
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
                    className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
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
                    className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
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
                    className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                  />
                </div>
                <Button 
                  className="w-full bg-red-900/50 hover:bg-red-900 text-xs h-7 mt-4"
                  onClick={() => onDeleteNode(editingNode.id)}
                >
                  删除节点
                </Button>
              </div>
            ) : (
              // List all connections for editing
              <div className="space-y-2">
                <div className="text-xs text-gray-500 mb-2">所有连接 ({connections.length})</div>
                {connections.map(conn => {
                  const sourceLabel = nodes.find(n => n.id === conn.fromNode)?.data.label || conn.fromNode;
                  const targetLabel = nodes.find(n => n.id === conn.toNode)?.data.label || conn.toNode;
                  return (
                    <div key={conn.id} className="bg-[#0D0F14] p-2 rounded border border-[#2A2E37] text-xs">
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
                        <SelectTrigger className="h-6 bg-[#15171C] border-[#2A2E37] text-xs w-full text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                          {relations.map(r => (
                            <SelectItem key={r.id} value={r.relation_id} className="text-xs text-white">{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                })}
                {connections.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-xs">暂无连接</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}