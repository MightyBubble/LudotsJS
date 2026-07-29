import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Plus, Network, Filter, Database, Share2, Link, Trash2, Edit3, Save, X } from "lucide-react"; // Added Database icon and others
import GraphCanvas from '../components/graph/GraphCanvas';
import UnifiedNodeLibrary from '../components/graph/UnifiedNodeLibrary';
import Toolbar from '../components/graph/Toolbar';
import UnifiedNode from '../components/graph/UnifiedNode';
import BlackboardPanel from '../components/graph/BlackboardPanel';
import { Input } from "@/components/ui/input";
import { getNodeConfig } from '../components/graph/nodeConfigs';
import { evaluateGraph } from '@/lib/graphRuntime';
import { structureToGraph, graphToStructure } from '@/lib/structureAdapter';
import QuerySimulationPanel from '../components/queryGraph/QuerySimulationPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UnifiedGraphEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGraph, setCurrentGraph] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [blackboard, setBlackboard] = useState({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(true);
  const [showBlackboard, setShowBlackboard] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGraph, setNewGraph] = useState({ name: '', description: '', graph_type: 'data', return_type: 'void' }); // Added return_type
  const [connectionValues, setConnectionValues] = useState({});
  const [isEditingType, setIsEditingType] = useState(false);
  const [showLibraryMobile, setShowLibraryMobile] = useState(false);
  const [showBlackboardMobile, setShowBlackboardMobile] = useState(false);
  
  // Structure Editor State
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);

  const queryClient = useQueryClient();

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const { data: dataGraphs = [] } = useQuery({
    queryKey: ['dataGraphs'],
    queryFn: () => base44.entities.DataGraph.list(),
    initialData: [],
  });

  const { data: queryGraphs = [] } = useQuery({
    queryKey: ['entityQueries'],
    queryFn: () => base44.entities.EntityQuery.list(),
    initialData: [],
  });

  const { data: functionGraphs = [] } = useQuery({ // Added functionGraphs query
    queryKey: ['functionGraphs'],
    queryFn: () => base44.entities.FunctionGraph.list(),
    initialData: [],
  });

  // 结构图的唯一真源是 StructureDefinition
  const { data: structureDefs = [] } = useQuery({
    queryKey: ['structureDefinitions'],
    queryFn: () => base44.entities.StructureDefinition.list(),
    initialData: [],
  });

  const allGraphs = useMemo(() => {
    const dataGraphEntities = dataGraphs.map(g => ({
      ...g,
      graph_type: g.graph_type || 'data', // Default to data if not set
      entity_type: 'DataGraph',
    }));

    return [
      ...structureDefs.map(s => ({ ...s, graph_type: 'structure', entity_type: 'StructureDefinition' })),
      ...dataGraphEntities,
      ...queryGraphs.map(g => ({ ...g, name: g.query_name, graph_type: 'query', entity_type: 'EntityQuery' })),
      ...functionGraphs.map(g => ({ ...g, graph_type: 'function', entity_type: 'FunctionGraph' }))
    ];
  }, [structureDefs, dataGraphs, queryGraphs, functionGraphs]);

  const invalidateGraphs = useCallback(() => {
    ['dataGraphs', 'entityQueries', 'functionGraphs', 'structureDefinitions'].forEach(key =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (data.graph_type === 'structure') {
        return base44.entities.StructureDefinition.create({
          structure_id: data.name.toLowerCase().replace(/\s+/g, '_'),
          name: data.name,
          description: data.description,
          structure_type: 'graph',
          nodes: [],
          edges: []
        });
      } else if (data.graph_type === 'data') {
        return base44.entities.DataGraph.create({
          graph_id: data.name.toLowerCase().replace(/\s+/g, '_'),
          name: data.name,
          description: data.description,
          graph_type: data.graph_type,
          graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {} })
        });
      } else if (data.graph_type === 'query') { // Added else if for query type
        return base44.entities.EntityQuery.create({
          query_name: data.name,
          description: data.description,
          graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {} })
        });
      } else { // Handle function graph creation
        return base44.entities.FunctionGraph.create({
          function_id: data.name.toLowerCase().replace(/\s+/g, '_'),
          name: data.name,
          description: data.description,
          return_type: data.return_type || 'void',
          parameters: [], // Default empty parameters for now
          graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {} })
        });
      }
    },
    onSuccess: (graph, variables) => {
      // Invalidate the correct query key based on graph_type
      invalidateGraphs();
      setIsCreating(false);
      setNewGraph({ name: '', description: '', graph_type: 'data', return_type: 'void' }); // Reset newGraph state, including return_type
      const entityType = variables.graph_type === 'structure' ? 'StructureDefinition'
        : variables.graph_type === 'data' ? 'DataGraph'
        : variables.graph_type === 'query' ? 'EntityQuery' : 'FunctionGraph';
      openGraph({ ...graph, graph_type: variables.graph_type, entity_type: entityType });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, entity_type }) => {
      if (entity_type === 'StructureDefinition') {
        return base44.entities.StructureDefinition.update(id, data);
      } else if (entity_type === 'DataGraph') {
        return base44.entities.DataGraph.update(id, data);
      } else if (entity_type === 'EntityQuery') { // Added else if for EntityQuery
        return base44.entities.EntityQuery.update(id, data);
      } else { // Handle FunctionGraph update
        return base44.entities.FunctionGraph.update(id, data);
      }
    },
    onSuccess: () => invalidateGraphs(),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, entity_type }) => {
      if (entity_type === 'StructureDefinition') {
        return base44.entities.StructureDefinition.delete(id);
      } else if (entity_type === 'DataGraph') {
        return base44.entities.DataGraph.delete(id);
      } else if (entity_type === 'EntityQuery') { // Added else if for EntityQuery
        return base44.entities.EntityQuery.delete(id);
      } else { // Handle FunctionGraph delete
        return base44.entities.FunctionGraph.delete(id);
      }
    },
    onSuccess: () => invalidateGraphs(),
  });

  const filteredGraphs = useMemo(() => {
    if (!searchQuery) return allGraphs;
    return allGraphs.filter(g =>
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allGraphs, searchQuery]);

  const openGraph = (graph) => {
    if (graph.entity_type === 'StructureDefinition') {
      const { nodes: structNodes, connections: structConns } = structureToGraph(graph);
      setCurrentGraph(graph);
      setNodes(structNodes);
      setConnections(structConns);
      setBlackboard({});
      return;
    }

    let graphDef;
    try {
      graphDef = typeof graph.graph_definition === 'string'
        ? JSON.parse(graph.graph_definition)
        : graph.graph_definition || {};
    } catch {
      graphDef = {};
    }

    setCurrentGraph(graph);
    setNodes(graphDef.nodes || []);
    setConnections(graphDef.connections || []);
    setBlackboard(graphDef.blackboard || {});
  };

  const saveGraph = useCallback(() => {
    if (!currentGraph) return;

    if (currentGraph.entity_type === 'StructureDefinition') {
      updateMutation.mutate({
        id: currentGraph.id,
        entity_type: 'StructureDefinition',
        data: graphToStructure(nodes, connections)
      });
      return;
    }

    updateMutation.mutate({
      id: currentGraph.id,
      entity_type: currentGraph.entity_type,
      data: {
        graph_definition: JSON.stringify({ nodes, connections, blackboard })
      }
    });
  }, [currentGraph, nodes, connections, blackboard, updateMutation]);

  const updateGraphType = useCallback((newType) => {
    if (!currentGraph) return;

    // 转换图类型需要删除旧图并创建新图
    alert('图类型转换功能开发中...');
    setIsEditingType(false);
  }, [currentGraph]);

  const updateReturnType = useCallback((newReturnType) => {
    if (!currentGraph || currentGraph.graph_type !== 'function') return;

    updateMutation.mutate({
      id: currentGraph.id,
      entity_type: currentGraph.entity_type,
      data: {
        return_type: newReturnType
      }
    });

    setCurrentGraph(prev => ({ ...prev, return_type: newReturnType }));
  }, [currentGraph, updateMutation]);

  const addNode = useCallback((type) => {
    const config = getNodeConfig(type);
    if (!config) return;

    const defaultData = {
      number: { value: 0 },
      add: { a: 0, b: 0 },
      subtract: { a: 0, b: 0 },
      multiply: { a: 0, b: 0 },
      divide: { a: 1, b: 1 },
      power: { base: 2, exponent: 2 },
      clamp: { value: 0, min: 0, max: 100 },
      vector2: { x: 0, y: 0 },
      vector3: { x: 0, y: 0, z: 0 },
      vector4: { x: 0, y: 0, z: 0, w: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      color: { r: 1, g: 1, b: 1 },
      blackboard_get: { key: '' },
      blackboard_set: { key: '' },
      structure_node: { label: '新节点', nodeId: `node_${Date.now()}`, description: '' },
      // Query node defaults
      entity_source: {},
      filter_prototype: { prototypeId: '' },
      filter_attribute: { attributeId: '', key: '', operator: 'gt', threshold: 0 },
      filter_tag: { tagPath: '', mode: 'has' },
      filter_relation: { relationId: '', direction: 'source' },
      filter_relation_attribute: { relationId: '', attributeId: '', key: '', operator: 'gt', threshold: 0 },
      filter_relation_tag: { relationId: '', tagPath: '', mode: 'has' },
      filter_related_entity_attribute: { relationId: '', attributeId: '', key: '', operator: 'gt', threshold: 0 },
      filter_related_entity_tag: { relationId: '', tagPath: '', mode: 'has' },
      spatial_distance: { maxDistance: 100, x: 0, y: 0, z: 0 },
      spatial_area: { shape: 'sphere', centerX: 0, centerY: 0, centerZ: 0, sizeX: 10, sizeY: 10, sizeZ: 10 },
      sort_by_attribute: { attributeId: '', key: '', order: 'asc' },
      sort_by_relation: { relationId: '', order: 'asc' },
      sort_by_tag: { tagPath: '', order: 'asc' },
      limit_top: { count: 10 },
      limit_bottom: { count: 10 },
      limit_percent_top: { percent: 10 },
      limit_percent_bottom: { percent: 10 },
    };

    const newNode = {
      id: `node-${Date.now()}`,
      type,
      // Center the node in the current view
      position: { x: (-pan.x + 300) / zoom, y: (-pan.y + 200) / zoom },
      data: defaultData[type] || {},
      inputs: config.inputs || [],
      outputs: config.outputs || []
    };
    setNodes(prev => [...prev, newNode]);
  }, [nodes.length, pan, zoom]);

  const addNodeAtPosition = useCallback((type, position, blackboardKey = null) => {
    const config = getNodeConfig(type);
    if (!config) return;

    const defaultData = {
      number: { value: 0 },
      blackboard_get: { key: blackboardKey || '' },
      blackboard_set: { key: blackboardKey || '' }
    };

    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position,
      data: defaultData[type] || {},
      inputs: config.inputs || [],
      outputs: config.outputs || []
    };
    setNodes(prev => [...prev, newNode]);
  }, []);

  const updateNodePosition = useCallback((nodeId, position) => {
    setNodes(prev => prev.map(node => node.id === nodeId ? { ...node, position } : node));
  }, []);

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes(prev => prev.map(node => node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node));
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => conn.fromNode !== nodeId && conn.toNode !== nodeId));
  }, []);

  const addConnection = useCallback((connection) => {
    // 类型校验
    const fromNode = nodes.find(n => n.id === connection.fromNode);
    const toNode = nodes.find(n => n.id === connection.toNode);

    if (fromNode && toNode) {
      const fromPort = fromNode.outputs?.find(p => p.id === connection.fromPort);
      const toPort = toNode.inputs?.find(p => p.id === connection.toPort);

      if (fromPort && toPort) {
        // 检查类型兼容性
        const fromType = fromPort.type;
        const toType = toPort.type;

        // any类型可以接受任何输入
        if (toType !== 'any' && fromType !== 'any' && fromType !== toType) {
          alert(`类型不匹配：无法将 ${fromType} 连接到 ${toType}`);
          return;
        }
      }
    }

    const exists = connections.some(c =>
      c.fromNode === connection.fromNode && c.fromPort === connection.fromPort &&
      c.toNode === connection.toNode && c.toPort === connection.toPort
    );
    if (!exists) setConnections(prev => [...prev, connection]);
  }, [connections, nodes]);

  const deleteConnection = useCallback((connectionId) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  useEffect(() => {
    if (!currentGraph) return;

    const { connectionValues: connValues } = evaluateGraph({ nodes, connections, blackboard });
    setConnectionValues(connValues);

    const nodeConnectedValues = {};
    connections.forEach(conn => {
      if (!nodeConnectedValues[conn.toNode]) nodeConnectedValues[conn.toNode] = {};
      nodeConnectedValues[conn.toNode][conn.toPort] = connValues[conn.id];
    });

    setNodes(prev => prev.map(node => ({
      ...node,
      connectedValues: nodeConnectedValues[node.id] || {}
    })));
  }, [nodes.length, connections, blackboard, currentGraph, nodes]);

  const handleCreate = () => {
    if (!newGraph.name) {
      alert('请填写图名称');
      return;
    }
    createMutation.mutate(newGraph);
  };

  if (currentGraph) {
    return (
      <div className="h-screen w-full bg-[#0D0F14] flex flex-col overflow-hidden">
        <Toolbar
          onSave={saveGraph}
          onZoomIn={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          onZoomOut={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          onResetView={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          onToggleLibrary={() => {
            setShowLibrary(prev => !prev);
            setShowLibraryMobile(prev => !prev);
          }}
          onToggleBlackboard={() => {
            setShowBlackboard(prev => !prev);
            setShowBlackboardMobile(prev => !prev);
          }}
          onBack={() => setCurrentGraph(null)}
          projectName={currentGraph.name}
          zoom={zoom}
          showBlackboard={showBlackboard}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {/* 桌面端显示 */}
          {showLibrary && <div className="hidden md:block"><UnifiedNodeLibrary graphType={currentGraph.graph_type} onAddNode={addNode} onClose={() => setShowLibrary(false)} /></div>}

          {/* 移动端节点库弹窗 */}
          {showLibraryMobile && (
            <div className="md:hidden absolute inset-0 z-50 bg-black/50" onClick={() => setShowLibraryMobile(false)}>
              <div className="absolute bottom-0 left-0 right-0 bg-[#15171C] max-h-[60vh] overflow-hidden rounded-t-xl" onClick={(e) => e.stopPropagation()}>
                <UnifiedNodeLibrary graphType={currentGraph.graph_type} onAddNode={(type) => { addNode(type); setShowLibraryMobile(false); }} onClose={() => setShowLibraryMobile(false)} />
              </div>
            </div>
          )}

          <div className="flex-1 relative">
            <GraphCanvas
              nodes={nodes}
              connections={connections}
              zoom={zoom}
              pan={pan}
              onPanChange={setPan}
              onZoomChange={setZoom}
              onUpdateNodePosition={updateNodePosition}
              onUpdateNodeData={updateNodeData}
              onDeleteNode={deleteNode}
              onAddConnection={addConnection}
              onDeleteConnection={deleteConnection}
              onAddNodeAtPosition={addNodeAtPosition}
              NodeComponent={UnifiedNode}
              connectionValues={connectionValues}
              onSelectNode={(id) => setEditingNodeId(id)}
              onSelectConnection={(id) => setSelectedConnectionId(id)}
            />

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded text-white/60 text-xs font-mono space-y-1 pointer-events-none">
              <div className="flex items-center gap-2">
                <span>类型: {currentGraph.graph_type === 'data' ? 'Data' : currentGraph.graph_type === 'query' ? 'Query' : currentGraph.graph_type === 'structure' ? 'Structure' : 'Function'}</span>
              </div>
              {currentGraph.graph_type === 'function' && (
                <div className="flex items-center gap-2">
                  <span>返回:</span>
                  <Dialog open={isEditingType} onOpenChange={setIsEditingType}>
                    <DialogTrigger asChild>
                      <button className="text-[#D97706] hover:text-[#B45309] underline">
                        {currentGraph.return_type || 'void'}
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#15171C] border-[#2A2E37] text-[#e5e5e5]">
                      <DialogHeader><DialogTitle className="text-[#e5e5e5]">修改返回类型</DialogTitle></DialogHeader>
                      <div className="space-y-4 py-4">
                        <Select value={currentGraph.return_type || 'void'} onValueChange={(v) => { updateReturnType(v); setIsEditingType(false); }}>
                          <SelectTrigger className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                            <SelectItem value="void" className="text-[#e5e5e5]">void (无返回)</SelectItem>
                            <SelectItem value="number" className="text-[#e5e5e5]">number (数值)</SelectItem>
                            <SelectItem value="boolean" className="text-[#e5e5e5]">boolean (布尔)</SelectItem>
                            <SelectItem value="string" className="text-[#e5e5e5]">string (字符串)</SelectItem>
                            <SelectItem value="array" className="text-[#e5e5e5]">array (数组)</SelectItem>
                            <SelectItem value="object" className="text-[#e5e5e5]">object (对象)</SelectItem>
                            <SelectItem value="entity" className="text-[#e5e5e5]">entity (实体)</SelectItem>
                            <SelectItem value="entities" className="text-[#e5e5e5]">entities (实体集)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
              <div>节点: {nodes.length}</div>
              <div>连接: {connections.length}</div>
              <div>缩放: {(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* 桌面端显示 - 普通黑板 或 结构图属性面板 */}
          {showBlackboard && (
            <div className="hidden md:block h-full">
              {currentGraph.graph_type === 'structure' ? (
                <div className="w-64 bg-[#15171C] border-l border-[#2A2E37] p-4 h-full overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-[#e5e5e5]">结构属性</h3>
                  </div>
                  
                  {editingNodeId ? (
                    (() => {
                      const node = nodes.find(n => n.id === editingNodeId);
                      if (!node) return null;
                      return (
                        <div className="space-y-4">
                          <div className="text-xs text-gray-500 mb-2">编辑节点</div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">节点ID</label>
                            <Input 
                              value={node.data.nodeId || ''} 
                              onChange={e => updateNodeData(node.id, { nodeId: e.target.value })}
                              className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">显示名称</label>
                            <Input 
                              value={node.data.label || ''} 
                              onChange={e => updateNodeData(node.id, { label: e.target.value })}
                              className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-1">描述</label>
                            <Input 
                              value={node.data.description || ''} 
                              onChange={e => updateNodeData(node.id, { description: e.target.value })}
                              className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]"
                            />
                          </div>
                          <Button 
                            className="w-full bg-red-900/20 hover:bg-red-900/40 text-xs h-7 mt-4 text-red-400"
                            onClick={() => {
                              deleteNode(node.id);
                              setEditingNodeId(null);
                            }}
                          >
                            删除节点
                          </Button>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-4">
                      <div className="text-xs text-gray-500 mb-2">连接列表 ({connections.length})</div>
                      {connections.length === 0 && <div className="text-xs text-gray-600">暂无连接</div>}
                      {connections.map(conn => {
                        const fromNode = nodes.find(n => n.id === conn.fromNode);
                        const toNode = nodes.find(n => n.id === conn.toNode);
                        const label = fromNode?.data?.label || 'Unknown';
                        const toLabel = toNode?.data?.label || 'Unknown';
                        
                        return (
                          <div key={conn.id} className="bg-[#0D0F14] p-2 rounded border border-[#2A2E37] text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-400">{label} → {toLabel}</span>
                              <button onClick={() => deleteConnection(conn.id)} className="text-red-400 hover:text-white">×</button>
                            </div>
                            <Select 
                              value={conn.data?.relation_definition_id || ""}
                              onValueChange={v => {
                                const newConns = connections.map(c => c.id === conn.id ? { ...c, data: { ...c.data, relation_definition_id: v } } : c);
                                setConnections(newConns);
                              }}
                            >
                              <SelectTrigger className="h-6 bg-[#15171C] border-[#2A2E37] text-xs w-full text-[#e5e5e5]">
                                <SelectValue placeholder="选择关系" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                {relations.map(r => (
                                  <SelectItem key={r.id} value={r.relation_id} className="text-xs text-[#e5e5e5] hover:bg-[#262626]">{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : currentGraph.graph_type === 'query' ? (
                <QuerySimulationPanel nodes={nodes} connections={connections} />
              ) : (
                <BlackboardPanel blackboard={blackboard} onChange={setBlackboard} />
              )}
            </div>
          )}

          {/* 移动端黑板弹窗 */}
          {showBlackboardMobile && (
            <div className="md:hidden absolute inset-0 z-50 bg-black/50" onClick={() => setShowBlackboardMobile(false)}>
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-[#15171C]" onClick={(e) => e.stopPropagation()}>
                <BlackboardPanel blackboard={blackboard} onChange={setBlackboard} />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0D0F14] text-[#e5e5e5]">
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] flex items-center px-2 md:px-4 gap-2 md:gap-3">
        <Network className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">图编辑器</span>
        <span className="text-xs text-gray-500 hidden sm:inline">共 {filteredGraphs.length} 个</span>
        <div className="flex-1" />
        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#0D0F14] border-[#2A2E37] text-xs text-[#e5e5e5]"
          />
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 md:px-3 bg-[#D97706] hover:bg-[#B45309] text-black text-xs">
              <Plus className="w-3 h-3 md:mr-1" />
              <span className="hidden md:inline">新建图</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#15171C] border-[#2A2E37] text-[#e5e5e5]">
            <DialogHeader><DialogTitle className="text-[#e5e5e5]">新建图</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">类型</label>
                <Select value={newGraph.graph_type} onValueChange={(v) => setNewGraph({ ...newGraph, graph_type: v })}>
                  <SelectTrigger className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    <SelectItem value="data" className="text-[#e5e5e5] hover:bg-[#262626]">Data Graph (数据图)</SelectItem>
                    <SelectItem value="query" className="text-[#e5e5e5] hover:bg-[#262626]">Entity Query (实体查询)</SelectItem>
                    <SelectItem value="function" className="text-[#e5e5e5] hover:bg-[#262626]">Function Graph (函数图)</SelectItem>
                    <SelectItem value="structure" className="text-[#e5e5e5] hover:bg-[#262626]">Structure Graph (结构图)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">名称</label>
                <Input value={newGraph.name} onChange={(e) => setNewGraph({ ...newGraph, name: e.target.value })} placeholder="我的图" className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]" />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1.5 block">描述</label>
                <Input value={newGraph.description} onChange={(e) => setNewGraph({ ...newGraph, description: e.target.value })} className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]" />
              </div>
              {newGraph.graph_type === 'function' && ( // Conditionally render return type select for function graphs
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">返回类型</label>
                  <Select value={newGraph.return_type} onValueChange={(v) => setNewGraph({ ...newGraph, return_type: v })}>
                    <SelectTrigger className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      <SelectItem value="void" className="text-[#e5e5e5] hover:bg-[#262626]">void (无返回)</SelectItem>
                      <SelectItem value="number" className="text-[#e5e5e5] hover:bg-[#262626]">number (数值)</SelectItem>
                      <SelectItem value="boolean" className="text-[#e5e5e5] hover:bg-[#262626]">boolean (布尔)</SelectItem>
                      <SelectItem value="string" className="text-[#e5e5e5] hover:bg-[#262626]">string (字符串)</SelectItem>
                      <SelectItem value="array" className="text-[#e5e5e5] hover:bg-[#262626]">array (数组)</SelectItem>
                      <SelectItem value="object" className="text-[#e5e5e5] hover:bg-[#262626]">object (对象)</SelectItem>
                      <SelectItem value="entity" className="text-[#e5e5e5] hover:bg-[#262626]">entity (实体)</SelectItem>
                      <SelectItem value="entities" className="text-[#e5e5e5] hover:bg-[#262626]">entities (实体集)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full bg-[#D97706] hover:bg-[#B45309] text-black">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 移动端搜索 */}
      <div className="md:hidden px-2 py-2 bg-[#15171C] border-b border-[#2A2E37]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 w-full bg-[#0D0F14] border-[#2A2E37] text-sm text-[#e5e5e5]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredGraphs.map((graph) => (
            <div key={graph.id} className="bg-[#15171C] rounded border border-[#2A2E37] p-4 hover:border-[#D97706] transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Conditional rendering for icons based on graph_type */}
                    {graph.graph_type === 'data' ? <Network className="w-4 h-4 text-[#5b9bd5]" /> : 
                     graph.graph_type === 'query' ? <Filter className="w-4 h-4 text-[#70ad47]" /> : 
                     graph.graph_type === 'structure' ? <Share2 className="w-4 h-4 text-[#ffc000]" /> :
                     <Database className="w-4 h-4 text-[#c97fff]" />}
                    <h3 className="text-[#e5e5e5] font-medium">{graph.name}</h3>
                  </div>
                  {graph.description && <p className="text-gray-500 text-xs mt-1">{graph.description}</p>}
                  <div className="text-[10px] text-gray-600 mt-2">
                    {/* Conditional rendering for graph type display */}
                    {graph.graph_type === 'data' ? 'Data Graph' : 
                     graph.graph_type === 'query' ? 'Entity Query' : 
                     graph.graph_type === 'structure' ? 'Structure Definition' :
                     `Function Graph (${graph.return_type || 'void'})`}
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={() => openGraph(graph)} className="w-full h-7 bg-[#D97706] hover:bg-[#B45309] text-black">
                <Network className="w-3 h-3 mr-1" />可视化编辑
              </Button>
            </div>
          ))}
        </div>
        {filteredGraphs.length === 0 && (
          <div className="text-center py-12 text-white/40"><Network className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无图</p></div>
        )}
      </div>
    </div>
  );
}