import React, { useState, useCallback, useRef, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  addEdge,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Network, Plus, Save, Trash2, Search, Settings, X, LayoutGrid, Circle, Square, Hexagon } from "lucide-react";

// 自定义节点组件
const StructureNode = ({ data, selected }) => {
  return (
    <div className={`px-4 py-2 rounded-lg shadow-lg border-2 min-w-[120px] text-center transition-all ${selected ? 'border-blue-500 bg-[#2d2d2d]' : 'border-[#3d3d3d] bg-[#1e1e1e]'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-400" />
      <div className="font-bold text-white text-sm">{data.label}</div>
      <div className="text-[10px] text-gray-400 font-mono mt-1">{data.nodeId}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-400" />
    </div>
  );
};

const nodeTypes = {
  default: StructureNode,
};

export default function StructureEditorPage() {
  const [selectedStructure, setSelectedStructure] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNode, setEditingNode] = useState(null);
  const [editingEdge, setEditingEdge] = useState(null);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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

  // 初始化/加载 Graph
  const loadGraph = (structure) => {
    setSelectedStructure(structure);
    
    const initialNodes = (structure.nodes || []).map(n => ({
      id: n.node_id,
      type: 'default',
      position: n.position || { x: 0, y: 0 },
      data: { 
        label: n.name,
        nodeId: n.node_id,
        description: n.description
      },
    }));

    const initialEdges = (structure.edges || []).map((e, i) => ({
      id: `e-${i}`,
      source: e.source_node_id,
      target: e.target_node_id,
      label: relations.find(r => r.relation_id === e.relation_definition_id)?.name || e.relation_definition_id,
      data: { ...e },
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: '#888' },
    }));

    setNodes(initialNodes);
    setEdges(initialEdges);
  };

  // 保存 Graph
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
      edges: edges.map(e => ({
        source_node_id: e.source,
        target_node_id: e.target,
        relation_definition_id: e.data.relation_definition_id || "",
        attribute_values: e.data.attribute_values || {}
      }))
    };

    updateMutation.mutate({ id: selectedStructure.id, data: structureData });
  };

  const onConnect = useCallback((params) => {
    // 默认连接添加一个基础关系
    const defaultRelation = relations[0]?.relation_id || "relation";
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep',
      label: relations.find(r => r.relation_id === defaultRelation)?.name || defaultRelation,
      markerEnd: { type: MarkerType.ArrowClosed },
      data: { relation_definition_id: defaultRelation }
    }, eds));
  }, [relations, setEdges]);

  const handleAddNode = () => {
    const id = `node_${nodes.length + 1}`;
    const newNode = {
      id,
      type: 'default',
      position: { x: 100, y: 100 },
      data: { label: `新节点 ${nodes.length + 1}`, nodeId: id },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  // Node 点击编辑
  const onNodeClick = (event, node) => {
    setEditingNode({ ...node.data, id: node.id });
    setEditingEdge(null);
  };

  // Edge 点击编辑
  const onEdgeClick = (event, edge) => {
    setEditingEdge({ ...edge.data, id: edge.id, source: edge.source, target: edge.target });
    setEditingNode(null);
  };

  const onPaneClick = () => {
    setEditingNode(null);
    setEditingEdge(null);
  };

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
        {/* 左侧列表 */}
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

        {/* 中间画布 */}
        <div className="flex-1 bg-[#1a1a1a] relative">
          {selectedStructure ? (
            <>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background color="#333" gap={16} />
                <Controls className="bg-[#2d2d2d] border-[#3d3d3d] fill-white" />
                <MiniMap className="bg-[#2d2d2d] border-[#3d3d3d]" maskColor="#1e1e1e" />
              </ReactFlow>
              
              <div className="absolute top-4 left-4 bg-[#2d2d2d]/90 p-2 rounded border border-[#3d3d3d] flex gap-2">
                <Button size="sm" onClick={handleAddNode} className="h-7 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
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

        {/* 右侧属性面板 */}
        {(editingNode || editingEdge) && (
          <div className="w-64 bg-[#252526] border-l border-[#3d3d3d] p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-200">
                {editingNode ? "节点属性" : "连接属性"}
              </h3>
              <Button size="sm" variant="ghost" onClick={onPaneClick} className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {editingNode && (
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
                  onClick={() => {
                    setNodes(nds => nds.filter(n => n.id !== editingNode.id));
                    setEdges(eds => eds.filter(e => e.source !== editingNode.id && e.target !== editingNode.id));
                    setEditingNode(null);
                  }}
                >
                  删除节点
                </Button>
              </div>
            )}

            {editingEdge && (
              <div className="space-y-4">
                <div className="text-xs text-gray-500 mb-2">
                  {nodes.find(n => n.id === editingEdge.source)?.data.label} 
                  {' -> '}
                  {nodes.find(n => n.id === editingEdge.target)?.data.label}
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">关系类型</label>
                  <Select 
                    value={editingEdge.relation_definition_id || ""}
                    onValueChange={v => {
                      setEditingEdge({...editingEdge, relation_definition_id: v});
                      const relName = relations.find(r => r.relation_id === v)?.name || v;
                      setEdges(eds => eds.map(e => e.id === editingEdge.id ? {...e, label: relName, data: {...e.data, relation_definition_id: v}} : e));
                    }}
                  >
                    <SelectTrigger className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                      {relations.map(r => (
                        <SelectItem key={r.id} value={r.relation_id} className="text-xs">{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full bg-red-900/50 hover:bg-red-900 text-xs h-7 mt-4"
                  onClick={() => {
                    setEdges(eds => eds.filter(e => e.id !== editingEdge.id));
                    setEditingEdge(null);
                  }}
                >
                  删除连接
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}