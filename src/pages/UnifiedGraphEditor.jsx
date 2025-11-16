import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Plus, Network, Filter } from "lucide-react";
import GraphCanvas from '../components/graph/GraphCanvas';
import UnifiedNodeLibrary from '../components/graph/UnifiedNodeLibrary';
import Toolbar from '../components/graph/Toolbar';
import UnifiedNode from '../components/graph/UnifiedNode';
import BlackboardPanel from '../components/graph/BlackboardPanel';
import { Input } from "@/components/ui/input";
import { getNodeConfig } from '../components/graph/nodeConfigs';
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
  const [newGraph, setNewGraph] = useState({ name: '', description: '', graph_type: 'data' });
  const [connectionValues, setConnectionValues] = useState({});

  const queryClient = useQueryClient();

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

  const allGraphs = useMemo(() => {
    return [
      ...dataGraphs.map(g => ({ ...g, graph_type: 'data', entity_type: 'DataGraph' })),
      ...queryGraphs.map(g => ({ ...g, name: g.query_name, graph_type: 'query', entity_type: 'EntityQuery' }))
    ];
  }, [dataGraphs, queryGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (data.graph_type === 'data') {
        return base44.entities.DataGraph.create({
          graph_id: data.name.toLowerCase().replace(/\s+/g, '_'),
          name: data.name,
          description: data.description,
          graph_type: 'curve',
          graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {} })
        });
      } else {
        return base44.entities.EntityQuery.create({
          query_name: data.name,
          description: data.description,
          graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {} })
        });
      }
    },
    onSuccess: (graph, variables) => {
      if (variables.graph_type === 'data') {
        queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
      }
      setIsCreating(false);
      setNewGraph({ name: '', description: '', graph_type: 'data' });
      openGraph({ ...graph, graph_type: variables.graph_type, entity_type: variables.graph_type === 'data' ? 'DataGraph' : 'EntityQuery' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, entity_type }) => {
      if (entity_type === 'DataGraph') {
        return base44.entities.DataGraph.update(id, data);
      } else {
        return base44.entities.EntityQuery.update(id, data);
      }
    },
    onSuccess: (_, variables) => {
      if (variables.entity_type === 'DataGraph') {
        queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, entity_type }) => {
      if (entity_type === 'DataGraph') {
        return base44.entities.DataGraph.delete(id);
      } else {
        return base44.entities.EntityQuery.delete(id);
      }
    },
    onSuccess: (_, variables) => {
      if (variables.entity_type === 'DataGraph') {
        queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
      }
    },
  });

  const filteredGraphs = useMemo(() => {
    if (!searchQuery) return allGraphs;
    return allGraphs.filter(g =>
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allGraphs, searchQuery]);

  const openGraph = (graph) => {
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

    updateMutation.mutate({
      id: currentGraph.id,
      entity_type: currentGraph.entity_type,
      data: {
        graph_definition: JSON.stringify({ nodes, connections, blackboard })
      }
    });
  }, [currentGraph, nodes, connections, blackboard]);

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
      position: { x: 300, y: 200 + nodes.length * 100 },
      data: defaultData[type] || {},
      inputs: config.inputs || [],
      outputs: config.outputs || []
    };
    setNodes(prev => [...prev, newNode]);
  }, [nodes.length]);

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
    const exists = connections.some(c =>
      c.fromNode === connection.fromNode && c.fromPort === connection.fromPort &&
      c.toNode === connection.toNode && c.toPort === connection.toPort
    );
    if (!exists) setConnections(prev => [...prev, connection]);
  }, [connections]);

  const deleteConnection = useCallback((connectionId) => {
    setConnections(prev => prev.filter(c => c.id !== connectionId));
  }, []);

  useEffect(() => {
    if (!currentGraph) return;
    
    const calculateNodeValues = () => {
      const values = {};
      const connValues = {};
      const executed = new Set();
      const nodeOrder = [];
      const visited = new Set();
      const recursionStack = new Set();

      const dfs = (nodeId) => {
        if (recursionStack.has(nodeId)) return;
        if (visited.has(nodeId)) return;

        visited.add(nodeId);
        recursionStack.add(nodeId);

        const node = nodes.find(n => n.id === nodeId);
        if (node && node.inputs) {
          node.inputs.forEach(input => {
            const conn = connections.find(c => c.toNode === nodeId && c.toPort === input.id);
            if (conn) dfs(conn.fromNode);
          });
        }

        recursionStack.delete(nodeId);
        nodeOrder.push(nodeId);
      };

      nodes.forEach(node => dfs(node.id));

      const execute = (nodeId) => {
        if (executed.has(nodeId)) return values[nodeId];
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return null;

        const inputs = {};
        if (node.inputs) {
          node.inputs.forEach(input => {
            const conn = connections.find(c => c.toNode === nodeId && c.toPort === input.id);
            if (conn) {
              const sourceValue = execute(conn.fromNode);
              if (sourceValue && sourceValue[conn.fromPort] !== undefined) {
                inputs[input.id] = sourceValue[conn.fromPort];
                connValues[conn.id] = sourceValue[conn.fromPort];
              } else {
                inputs[input.id] = node.data[input.id];
              }
            } else if (node.data && node.data[input.id] !== undefined) {
              inputs[input.id] = node.data[input.id];
            }
          });
        }

        let output = {};
        try {
          switch (node.type) {
            case 'number': 
              output = { value: node.data?.value ?? 0 }; 
              break;
            case 'add': 
              output = { result: (inputs.a ?? node.data?.a ?? 0) + (inputs.b ?? node.data?.b ?? 0) }; 
              break;
            case 'subtract': 
              output = { result: (inputs.a ?? node.data?.a ?? 0) - (inputs.b ?? node.data?.b ?? 0) }; 
              break;
            case 'multiply': 
              output = { result: (inputs.a ?? node.data?.a ?? 0) * (inputs.b ?? node.data?.b ?? 0) }; 
              break;
            case 'divide': 
              const b = inputs.b ?? node.data?.b ?? 1;
              output = { result: b !== 0 ? (inputs.a ?? node.data?.a ?? 0) / b : 0 };
              break;
            case 'power': 
              output = { result: Math.pow(inputs.base ?? node.data?.base ?? 0, inputs.exponent ?? node.data?.exponent ?? 0) }; 
              break;
            case 'clamp':
              const val = inputs.value ?? node.data?.value ?? 0;
              const minVal = inputs.min ?? node.data?.min ?? 0;
              const maxVal = inputs.max ?? node.data?.max ?? 100;
              output = { result: Math.max(minVal, Math.min(maxVal, val)) };
              break;
            case 'blackboard_get': 
              output = { value: blackboard[node.data?.key]?.value }; 
              break;
            default:
              const config = getNodeConfig(node.type);
              if (config && config.outputs) {
                output = config.outputs.reduce((acc, out) => {
                  acc[out.id] = inputs[out.id] !== undefined ? inputs[out.id] : (out.type === 'entities' ? [] : undefined);
                  return acc;
                }, {});
              }
          }
        } catch (e) {
          console.error('Error calculating node', nodeId, e);
          output = {};
        }

        values[nodeId] = output;
        executed.add(nodeId);
        return output;
      };

      nodeOrder.forEach(nodeId => {
        try {
          execute(nodeId);
        } catch (e) {
          console.error('Error executing node', nodeId, e);
        }
      });
      
      setConnectionValues(connValues);

      const nodeConnectedValues = {};
      connections.forEach(conn => {
        if (!nodeConnectedValues[conn.toNode]) {
          nodeConnectedValues[conn.toNode] = {};
        }
        nodeConnectedValues[conn.toNode][conn.toPort] = connValues[conn.id];
      });

      setNodes(prev => prev.map(node => ({
        ...node,
        connectedValues: nodeConnectedValues[node.id] || {}
      })));
    };

    calculateNodeValues();
  }, [nodes.length, connections, blackboard, currentGraph]);

  const handleCreate = () => {
    if (!newGraph.name) {
      alert('请填写图名称');
      return;
    }
    createMutation.mutate(newGraph);
  };

  if (currentGraph) {
    return (
      <div className="h-screen w-full bg-[#1e1e1e] flex flex-col overflow-hidden">
        <Toolbar
          onSave={saveGraph}
          onZoomIn={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          onZoomOut={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          onResetView={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          onToggleLibrary={() => setShowLibrary(!showLibrary)}
          onToggleBlackboard={() => setShowBlackboard(!showBlackboard)}
          onBack={() => setCurrentGraph(null)}
          projectName={currentGraph.name}
          zoom={zoom}
          showBlackboard={showBlackboard}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {showLibrary && <UnifiedNodeLibrary graphType={currentGraph.graph_type} onAddNode={addNode} onClose={() => setShowLibrary(false)} />}

          <div className="flex-1 relative">
            <GraphCanvas
              nodes={nodes}
              connections={connections}
              zoom={zoom}
              pan={pan}
              onPanChange={setPan}
              onUpdateNodePosition={updateNodePosition}
              onUpdateNodeData={updateNodeData}
              onDeleteNode={deleteNode}
              onAddConnection={addConnection}
              onDeleteConnection={deleteConnection}
              onAddNodeAtPosition={addNodeAtPosition}
              NodeComponent={UnifiedNode}
              connectionValues={connectionValues}
            />

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded text-white/60 text-xs font-mono space-y-1">
              <div>类型: {currentGraph.graph_type === 'data' ? 'Data Graph' : 'Entity Query'}</div>
              <div>节点: {nodes.length}</div>
              <div>连接: {connections.length}</div>
              <div>缩放: {(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>

          {showBlackboard && <BlackboardPanel blackboard={blackboard} onChange={setBlackboard} />}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Network className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">图编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredGraphs.length} 个</span>
        <div className="flex-1" />
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs">
              <Plus className="w-3 h-3 mr-1" />新建图
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
            <DialogHeader><DialogTitle className="text-white">新建图</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">类型</label>
                <Select value={newGraph.graph_type} onValueChange={(v) => setNewGraph({ ...newGraph, graph_type: v })}>
                  <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                    <SelectItem value="data" className="text-white">Data Graph (数据图)</SelectItem>
                    <SelectItem value="query" className="text-white">Entity Query (实体查询)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">名称</label>
                <Input value={newGraph.name} onChange={(e) => setNewGraph({ ...newGraph, name: e.target.value })} placeholder="我的图" className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">描述</label>
                <Input value={newGraph.description} onChange={(e) => setNewGraph({ ...newGraph, description: e.target.value })} className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {filteredGraphs.map((graph) => (
            <div key={graph.id} className="bg-[#252526] rounded border border-[#3e3e42] p-4 hover:border-[#0e639c] transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {graph.graph_type === 'data' ? <Network className="w-4 h-4 text-[#5b9bd5]" /> : <Filter className="w-4 h-4 text-[#70ad47]" />}
                    <h3 className="text-white font-medium">{graph.name}</h3>
                  </div>
                  {graph.description && <p className="text-white/60 text-xs mt-1">{graph.description}</p>}
                  <div className="text-[10px] text-white/40 mt-2">
                    {graph.graph_type === 'data' ? 'Data Graph' : 'Entity Query'}
                  </div>
                </div>
              </div>
              <Button size="sm" onClick={() => openGraph(graph)} className="w-full h-7 bg-[#0e639c] hover:bg-[#1177bb]">
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