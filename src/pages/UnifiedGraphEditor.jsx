import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Network, Database, Info } from "lucide-react";
import AssetBrowserPanel from "@/components/assetBrowser/AssetBrowserPanel";
import GraphCanvas from '../components/graph/GraphCanvas';
import NodeSearchMenu from '../components/graph/NodeSearchMenu';
import FloatingPanel from '../components/graph/FloatingPanel';
import GraphMetaPanel from '../components/graph/GraphMetaPanel';
import Toolbar from '../components/graph/Toolbar';
import UnifiedNode from '../components/graph/UnifiedNode';
import BlackboardPanel from '../components/graph/BlackboardPanel';
import { Input } from "@/components/ui/input";
import { getNodeConfig } from '../components/graph/nodeConfigs';
import { graphTypeLabel, returnTypeOptions, USAGE_LABELS, DATA_RETURN_TYPES, FUNCTION_RETURN_TYPES } from '../components/graph/graphLabels';
import { evaluateGraph } from '@/lib/graphRuntime';
import QuerySimulationPanel from '../components/queryGraph/QuerySimulationPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'react-router-dom';

// 纯函数图默认节点：入口 + 返回
function buildFunctionDefaultNodes(returnType) {
  return [
    {
      id: 'function-entry',
      type: 'function_entry',
      position: { x: 120, y: 180 },
      data: {},
      inputs: [],
      outputs: [],
      locked: true
    },
    {
      id: 'function-return',
      type: 'function_return',
      position: { x: 560, y: 180 },
      data: {},
      inputs: [{ id: 'value', label: '返回值', type: returnType === 'void' ? 'any' : returnType }],
      outputs: [],
      locked: true
    }
  ];
}

export default function UnifiedGraphEditorPage() {
  const [selectedGraph, setSelectedGraph] = useState(null);
  const [currentGraph, setCurrentGraph] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [blackboard, setBlackboard] = useState({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const location = useLocation();
  const typeFilter = new URLSearchParams(location.search).get('type') || 'all';
  const [nodeMenu, setNodeMenu] = useState(null);
  const [showBlackboard, setShowBlackboard] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGraph, setNewGraph] = useState({ name: '', description: '', graph_type: 'data', usage: 'general', return_type: 'number' });
  const [connectionValues, setConnectionValues] = useState({});
  const [isEditingType, setIsEditingType] = useState(false);
  
  // Structure Editor State
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);

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

  const { data: functionGraphs = [] } = useQuery({ // Added functionGraphs query
    queryKey: ['functionGraphs'],
    queryFn: () => base44.entities.FunctionGraph.list(),
    initialData: [],
  });

  const { data: actionGraphs = [] } = useQuery({
    queryKey: ['actionGraphs'],
    queryFn: () => base44.entities.ActionGraph.list(),
    initialData: [],
  });

  const allGraphs = useMemo(() => {
    const dataGraphEntities = dataGraphs.map(g => ({
      ...g,
      graph_type: 'data', // DataGraph 恒为 data；用途由 usage 标记，出口由 return_type 标记
      entity_type: 'DataGraph',
    }));

    return [
      ...dataGraphEntities,
      ...queryGraphs.map(g => ({ ...g, name: g.query_name, graph_type: 'query', entity_type: 'EntityQuery' })),
      ...functionGraphs.map(g => ({ ...g, graph_type: 'function', entity_type: 'FunctionGraph' })),
      ...actionGraphs.map(g => ({ ...g, graph_type: 'action', entity_type: 'ActionGraph' }))
    ];
  }, [dataGraphs, queryGraphs, functionGraphs, actionGraphs]);

  const invalidateGraphs = useCallback(() => {
    ['dataGraphs', 'entityQueries', 'functionGraphs', 'actionGraphs'].forEach(key =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data) => {
      if (data.graph_type === 'data') {
        return base44.entities.DataGraph.create({
          graph_id: data.name.toLowerCase().replace(/\s+/g, '_'),
          name: data.name,
          description: data.description,
          usage: data.usage || 'general',
          return_type: data.return_type || 'number',
          graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {} })
        });
      } else if (data.graph_type === 'action') {
        return base44.entities.ActionGraph.create({
          action_id: data.name.toLowerCase().replace(/\s+/g, '_'),
          name: data.name,
          description: data.description,
          parameters: [],
          graph_definition: JSON.stringify({
            nodes: [{
              id: `node-${Date.now()}`,
              type: 'action_entry',
              position: { x: 120, y: 160 },
              data: {},
              inputs: [],
              outputs: getNodeConfig('action_entry').outputs
            }],
            connections: [],
            blackboard: {}
          })
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
          graph_definition: JSON.stringify({
            nodes: buildFunctionDefaultNodes(data.return_type || 'void'),
            connections: [],
            blackboard: {}
          })
        });
      }
    },
    onSuccess: (graph, variables) => {
      // Invalidate the correct query key based on graph_type
      invalidateGraphs();
      setIsCreating(false);
      setNewGraph({ name: '', description: '', graph_type: 'data', usage: 'general', return_type: 'number' });
      const entityType = variables.graph_type === 'data' ? 'DataGraph'
        : variables.graph_type === 'query' ? 'EntityQuery'
        : variables.graph_type === 'action' ? 'ActionGraph' : 'FunctionGraph';
      openGraph({ ...graph, graph_type: variables.graph_type, entity_type: entityType });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data, entity_type }) => {
      if (entity_type === 'DataGraph') {
        return base44.entities.DataGraph.update(id, data);
      } else if (entity_type === 'EntityQuery') { // Added else if for EntityQuery
        return base44.entities.EntityQuery.update(id, data);
      } else if (entity_type === 'ActionGraph') {
        return base44.entities.ActionGraph.update(id, data);
      } else { // Handle FunctionGraph update
        return base44.entities.FunctionGraph.update(id, data);
      }
    },
    onSuccess: () => invalidateGraphs(),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, entity_type }) => {
      if (entity_type === 'DataGraph') {
        return base44.entities.DataGraph.delete(id);
      } else if (entity_type === 'EntityQuery') { // Added else if for EntityQuery
        return base44.entities.EntityQuery.delete(id);
      } else if (entity_type === 'ActionGraph') {
        return base44.entities.ActionGraph.delete(id);
      } else { // Handle FunctionGraph delete
        return base44.entities.FunctionGraph.delete(id);
      }
    },
    onSuccess: () => invalidateGraphs(),
  });

  const openGraph = (graph) => {
    let graphDef;
    try {
      graphDef = typeof graph.graph_definition === 'string'
        ? JSON.parse(graph.graph_definition)
        : graph.graph_definition || {};
    } catch {
      graphDef = {};
    }

    let loadedNodes = graphDef.nodes || [];
    // 纯函数图必须存在入口与返回节点
    if (graph.graph_type === 'function' && !loadedNodes.some(n => n.type === 'function_entry')) {
      loadedNodes = [...buildFunctionDefaultNodes(graph.return_type || 'void'), ...loadedNodes];
    }

    setCurrentGraph(graph);
    setNodes(loadedNodes);
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
  }, [currentGraph, nodes, connections, blackboard, updateMutation]);

  const updateReturnType = useCallback((newReturnType) => {
    if (!currentGraph || (currentGraph.entity_type !== 'FunctionGraph' && currentGraph.entity_type !== 'DataGraph')) return;

    updateMutation.mutate({
      id: currentGraph.id,
      entity_type: currentGraph.entity_type,
      data: {
        return_type: newReturnType
      }
    });

    setCurrentGraph(prev => ({ ...prev, return_type: newReturnType }));
  }, [currentGraph, updateMutation]);

  const addNodeAtPosition = useCallback((type, position, blackboardKey = null) => {
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
      structure_node: { label: '新节点', nodeId: `node_${Date.now()}`, description: '' },
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
      string_value: { value: '' },
      boolean_value: { value: false },
      constant_get: { constantKey: '' },
      modulo: { a: 0, b: 1 },
      lerp: { a: 0, b: 1, t: 0.5 },
      remap: { value: 0, in_min: 0, in_max: 1, out_min: 0, out_max: 1 },
      get_tag_count: { tagPath: '' },
      is_prototype: { prototypeId: '' },
      call_validator: { validatorId: '' },
      call_requirement: { requirementId: '' },
      call_data_graph: { graphId: '' },
      modify_attribute: { attributeId: '', key: '', operation: 'add' },
      set_attribute: { attributeId: '', key: '' },
      clear_tag: { tagPath: '' },
      modify_relation_attribute: { relationId: '', attributeId: '', key: '', operation: 'add' },
      add_relation_tag: { relationId: '', tagPath: '' },
      remove_relation_tag: { relationId: '', tagPath: '' },
      spawn_entity: { prototypeId: '' },
      destroy_entity: {},
      set_entity_position: {},
      apply_modifier: { modifierId: '' },
      remove_modifier: { modifierId: '' },
      action_delay: { seconds: 1 },
      action_gate: { validatorId: '' },
      debug_log: { message: '' },
      add_tag: { tagPath: '' },
      remove_tag: { tagPath: '' },
      create_relation: { relationId: '' },
      remove_relation: { relationId: '' },
      fire_event: { eventId: '' },
      call_pure_function: { functionId: '' },
      run_entity_query: { queryId: '' },
      call_action_graph: { actionId: '' },
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

  const editorPane = currentGraph ? (
    <div className="flex-1 bg-[#0D0F14] flex flex-col overflow-hidden min-w-0">
      <Toolbar
        onSave={saveGraph}
        onZoomIn={() => setZoom(prev => Math.min(prev + 0.1, 2))}
        onZoomOut={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
        onResetView={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
        onToggleBlackboard={() => setShowBlackboard(prev => !prev)}
        onToggleInfo={() => setShowInfo(prev => !prev)}
        onBack={() => { setCurrentGraph(null); setSelectedGraph(null); }}
        projectName={currentGraph.name}
        zoom={zoom}
        showBlackboard={showBlackboard}
        showInfo={showInfo}
      />

      <div className="flex-1 relative overflow-hidden overscroll-contain">
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
          onPaneContextMenu={setNodeMenu}
        />

        {nodeMenu && (
          <NodeSearchMenu
            x={nodeMenu.x}
            y={nodeMenu.y}
            graphType={currentGraph.graph_type}
            onAdd={(type) => addNodeAtPosition(type, nodeMenu.position)}
            onClose={() => setNodeMenu(null)}
          />
        )}

        {showInfo && (
          <FloatingPanel title="资产信息" icon={Info} onClose={() => setShowInfo(false)} className="left-4 top-4">
            <GraphMetaPanel graph={currentGraph} />
          </FloatingPanel>
        )}

        {showBlackboard && (
          <FloatingPanel
            title={currentGraph.graph_type === 'query' ? '查询模拟' : '黑板变量'}
            icon={Database}
            onClose={() => setShowBlackboard(false)}
            className="right-4 top-4"
          >
            {currentGraph.graph_type === 'query' ? (
              <QuerySimulationPanel nodes={nodes} connections={connections} />
            ) : (
              <BlackboardPanel blackboard={blackboard} onChange={setBlackboard} />
            )}
          </FloatingPanel>
        )}

        <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded text-white/60 text-xs font-mono space-y-1">
          <div>类型: {graphTypeLabel(currentGraph)}</div>
          {returnTypeOptions(currentGraph).length > 0 && (
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
                    <Select value={currentGraph.return_type || 'number'} onValueChange={(v) => { updateReturnType(v); setIsEditingType(false); }}>
                      <SelectTrigger className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                        {returnTypeOptions(currentGraph).map(t => (
                          <SelectItem key={t} value={t} className="text-[#e5e5e5]">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
          <div>节点: {nodes.length} · 连接: {connections.length}</div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#0D0F14] text-[#e5e5e5]">
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
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
                    <SelectItem value="function" className="text-[#e5e5e5] hover:bg-[#262626]">Pure Function Graph (纯函数图)</SelectItem>
                    <SelectItem value="action" className="text-[#e5e5e5] hover:bg-[#262626]">Action Graph (动作图)</SelectItem>
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
              {newGraph.graph_type === 'data' && (
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">用途</label>
                  <Select value={newGraph.usage} onValueChange={(v) => setNewGraph({ ...newGraph, usage: v, return_type: v === 'validation' ? 'boolean' : 'number' })}>
                    <SelectTrigger className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {Object.entries(USAGE_LABELS).map(([k, label]) => (
                        <SelectItem key={k} value={k} className="text-[#e5e5e5] hover:bg-[#262626]">{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {(newGraph.graph_type === 'data' || newGraph.graph_type === 'function') && (
                <div>
                  <label className="text-sm text-gray-400 mb-1.5 block">{newGraph.graph_type === 'data' ? '出口类型' : '返回类型'}</label>
                  <Select value={newGraph.return_type} onValueChange={(v) => setNewGraph({ ...newGraph, return_type: v })}>
                    <SelectTrigger className="bg-[#0D0F14] border-[#2A2E37] text-[#e5e5e5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {(newGraph.graph_type === 'data' ? DATA_RETURN_TYPES : FUNCTION_RETURN_TYPES).map(t => (
                        <SelectItem key={t} value={t} className="text-[#e5e5e5] hover:bg-[#262626]">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full bg-[#D97706] hover:bg-[#B45309] text-black">创建</Button>
            </div>
          </DialogContent>
      </Dialog>

      <div className="flex-1 flex overflow-hidden">
        <AssetBrowserPanel
          key={typeFilter}
          entityName="Graph"
          records={typeFilter === 'all' ? allGraphs : allGraphs.filter(g => g.graph_type === typeFilter)}
          toItem={(g) => ({
            id: g.id,
            name: g.name,
            subtitle: `${graphTypeLabel(g)}${g.entity_type === 'DataGraph' ? ` · ${g.return_type || 'number'}` : ''}`,
          })}
          selectedId={selectedGraph?.id}
          onSelect={(g) => { setSelectedGraph(g); openGraph(g); }}
          onCreate={() => {
            if (typeFilter !== 'all') setNewGraph(prev => ({ ...prev, graph_type: typeFilter }));
            setIsCreating(true);
          }}
          onDelete={(g) => {
            if (window.confirm(`确定删除「${g.name}」吗？`)) {
              deleteMutation.mutate({ id: g.id, entity_type: g.entity_type });
              if (selectedGraph?.id === g.id) setSelectedGraph(null);
            }
          }}
        />

        {editorPane || (
          <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
            <div className="text-center">
              <Network className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>从左侧选择或新建一张图</p>
              <p className="text-xs text-gray-600 mt-2">画布内右键可唤出节点菜单</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}