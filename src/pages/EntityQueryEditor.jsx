import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Plus, Filter, Trash2 } from "lucide-react";
import GraphCanvas from '../components/graph/GraphCanvas';
import QueryNodeLibrary from '../components/queryGraph/QueryNodeLibrary';
import Toolbar from '../components/graph/Toolbar';
import QueryNode from '../components/queryGraph/QueryNode';
import Node from '../components/graph/Node';
import BlackboardPanel from '../components/graph/BlackboardPanel';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function EntityQueryEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentQuery, setCurrentQuery] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [blackboard, setBlackboard] = useState({});
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(true);
  const [showBlackboard, setShowBlackboard] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newQuery, setNewQuery] = useState({ query_name: '', description: '' });
  const [connectionValues, setConnectionValues] = useState({});

  const queryClient = useQueryClient();

  const { data: queries = [] } = useQuery({
    queryKey: ['entityQueries'],
    queryFn: () => base44.entities.EntityQuery.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntityQuery.create({
      ...data,
      graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {} })
    }),
    onSuccess: (query) => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
      setIsCreating(false);
      setNewQuery({ query_name: '', description: '' });
      openQuery(query);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityQuery.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntityQuery.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
    },
  });

  const filteredQueries = useMemo(() => {
    if (!searchQuery) return queries;
    return queries.filter(q =>
      q.query_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [queries, searchQuery]);

  const openQuery = (query) => {
    let graphDef;
    try {
      graphDef = typeof query.graph_definition === 'string'
        ? JSON.parse(query.graph_definition)
        : query.graph_definition || {};
    } catch {
      graphDef = {};
    }

    setCurrentQuery(query);
    setNodes(graphDef.nodes || []);
    setConnections(graphDef.connections || []);
    setBlackboard(graphDef.blackboard || {});
  };

  const saveQuery = useCallback(() => {
    if (!currentQuery) return;

    updateMutation.mutate({
      id: currentQuery.id,
      data: {
        graph_definition: JSON.stringify({ nodes, connections, blackboard })
      }
    });
  }, [currentQuery, nodes, connections, blackboard]);

  const getNodeInputs = (type) => {
    const inputConfigs = {
      'entity_source': [],
      'filter_prototype': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_attribute': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'threshold', label: '阈值', type: 'number' }
      ],
      'filter_tag': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_relation': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_relation_attribute': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'threshold', label: '阈值', type: 'number' }
      ],
      'filter_relation_tag': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_related_entity_attribute': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'threshold', label: '阈值', type: 'number' }
      ],
      'filter_related_entity_tag': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'spatial_distance': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'maxDistance', label: '最大距离', type: 'number' }
      ],
      'spatial_area': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'logic_intersect': [{ id: 'a', label: 'A', type: 'entities' }, { id: 'b', label: 'B', type: 'entities' }],
      'logic_union': [{ id: 'a', label: 'A', type: 'entities' }, { id: 'b', label: 'B', type: 'entities' }],
      'logic_difference': [{ id: 'a', label: 'A (被减)', type: 'entities' }, { id: 'b', label: 'B (减去)', type: 'entities' }],
      'sort_by_attribute': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'sort_by_relation': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'sort_by_tag': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'limit_top': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'count', label: '数量', type: 'number' }
      ],
      'limit_bottom': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'count', label: '数量', type: 'number' }
      ],
      'limit_percent_top': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'percent', label: '百分比', type: 'number' }
      ],
      'limit_percent_bottom': [
        { id: 'entities', label: '实体集', type: 'entities' },
        { id: 'percent', label: '百分比', type: 'number' }
      ],
      'output': [{ id: 'entities', label: '实体集', type: 'entities' }],
      
      'number': [],
      'add': [{ id: 'a', label: 'A', type: 'number' }, { id: 'b', label: 'B', type: 'number' }],
      'subtract': [{ id: 'a', label: 'A', type: 'number' }, { id: 'b', label: 'B', type: 'number' }],
      'multiply': [{ id: 'a', label: 'A', type: 'number' }, { id: 'b', label: 'B', type: 'number' }],
      'divide': [{ id: 'a', label: 'A', type: 'number' }, { id: 'b', label: 'B', type: 'number' }],
      'power': [{ id: 'base', label: '底数', type: 'number' }, { id: 'exponent', label: '指数', type: 'number' }],
      'sum': [{ id: 'array', label: '数组', type: 'array' }],
      'product': [{ id: 'array', label: '数组', type: 'array' }],
      'max': [{ id: 'array', label: '数组', type: 'array' }],
      'min': [{ id: 'array', label: '数组', type: 'array' }],
      'clamp': [{ id: 'value', label: '值', type: 'number' }, { id: 'min', label: '最小值', type: 'number' }, { id: 'max', label: '最大值', type: 'number' }],
      'vector2': [{ id: 'x', label: 'X', type: 'number' }, { id: 'y', label: 'Y', type: 'number' }],
      'vector3': [{ id: 'x', label: 'X', type: 'number' }, { id: 'y', label: 'Y', type: 'number' }, { id: 'z', label: 'Z', type: 'number' }],
      'vector4': [{ id: 'x', label: 'X', type: 'number' }, { id: 'y', label: 'Y', type: 'number' }, { id: 'z', label: 'Z', type: 'number' }, { id: 'w', label: 'W', type: 'number' }],
      'quaternion': [{ id: 'x', label: 'X', type: 'number' }, { id: 'y', label: 'Y', type: 'number' }, { id: 'z', label: 'Z', type: 'number' }, { id: 'w', label: 'W', type: 'number' }],
      'color': [{ id: 'r', label: 'R', type: 'number' }, { id: 'g', label: 'G', type: 'number' }, { id: 'b', label: 'B', type: 'number' }],
      'blackboard_get': [],
      'blackboard_set': [{ id: 'value', label: '值', type: 'any' }]
    };
    return inputConfigs[type] || [];
  };

  const getNodeOutputs = (type) => {
    const outputConfigs = {
      'entity_source': [{ id: 'entities', label: '实体集', type: 'entities' }],
      'filter_prototype': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_attribute': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_tag': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_relation': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_relation_attribute': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_relation_tag': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_related_entity_attribute': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'filter_related_entity_tag': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'spatial_distance': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'spatial_area': [{ id: 'filtered', label: '过滤结果', type: 'entities' }],
      'logic_intersect': [{ id: 'result', label: '结果', type: 'entities' }],
      'logic_union': [{ id: 'result', label: '结果', type: 'entities' }],
      'logic_difference': [{ id: 'result', label: '结果', type: 'entities' }],
      'sort_by_attribute': [{ id: 'sorted', label: '排序结果', type: 'entities' }],
      'sort_by_relation': [{ id: 'sorted', label: '排序结果', type: 'entities' }],
      'sort_by_tag': [{ id: 'sorted', label: '排序结果', type: 'entities' }],
      'limit_top': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'limit_bottom': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'limit_percent_top': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'limit_percent_bottom': [{ id: 'limited', label: '限制结果', type: 'entities' }],
      'output': [],
      
      'number': [{ id: 'value', label: '值', type: 'number' }],
      'add': [{ id: 'result', label: '结果', type: 'number' }],
      'subtract': [{ id: 'result', label: '结果', type: 'number' }],
      'multiply': [{ id: 'result', label: '结果', type: 'number' }],
      'divide': [{ id: 'result', label: '结果', type: 'number' }],
      'power': [{ id: 'result', label: '结果', type: 'number' }],
      'sum': [{ id: 'result', label: '总和', type: 'number' }],
      'product': [{ id: 'result', label: '乘积', type: 'number' }],
      'max': [{ id: 'result', label: '最大值', type: 'number' }],
      'min': [{ id: 'result', label: '最小值', type: 'number' }],
      'clamp': [{ id: 'result', label: '结果', type: 'number' }],
      'vector2': [{ id: 'vector', label: '向量', type: 'vector2' }],
      'vector3': [{ id: 'vector', label: '向量', type: 'vector3' }],
      'vector4': [{ id: 'vector', label: '向量', type: 'vector4' }],
      'quaternion': [{ id: 'quaternion', label: '四元数', type: 'quaternion' }],
      'color': [{ id: 'color', label: '颜色', type: 'color' }],
      'blackboard_get': [{ id: 'value', label: '值', type: 'any' }],
      'blackboard_set': []
    };
    return outputConfigs[type] || [];
  };

  const addNode = useCallback((type) => {
    const defaultData = {
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
      blackboard_set: { key: '' }
    };

    const newNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 300, y: 200 + nodes.length * 100 },
      data: defaultData[type] || {},
      inputs: getNodeInputs(type),
      outputs: getNodeOutputs(type)
    };
    setNodes(prev => [...prev, newNode]);
  }, [nodes.length]);

  const addNodeAtPosition = useCallback((type, position, blackboardKey = null) => {
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
      inputs: getNodeInputs(type),
      outputs: getNodeOutputs(type)
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
    const calculateNodeValues = () => {
      const values = {};
      const connValues = {};
      const executed = new Set();
      const nodeOrder = [];
      const visited = new Set();
      const recursionStack = new Set();

      // Topological sort (DFS based) to ensure correct execution order
      const dfs = (nodeId) => {
          if (recursionStack.has(nodeId)) {
              console.warn(`Circular dependency detected involving node: ${nodeId}`);
              return; // Break cycle
          }
          if (visited.has(nodeId)) return;

          visited.add(nodeId);
          recursionStack.add(nodeId);

          const node = nodes.find(n => n.id === nodeId);
          if (node && node.inputs) {
              node.inputs.forEach(input => {
                  const conn = connections.find(c => c.toNode === nodeId && c.toPort === input.id);
                  if (conn) {
                      dfs(conn.fromNode);
                  }
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
                // If source node hasn't produced a value for this port, use default data or undefined
                inputs[input.id] = node.data[input.id]; // Fallback to node's own data
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
              // For other nodes, pass inputs through or provide default outputs based on type config
              const defaultOutputs = getNodeOutputs(node.type).reduce((acc, out) => {
                // Try to pass the input with the same name as output, otherwise use a sensible default
                acc[out.id] = inputs[out.id] !== undefined ? inputs[out.id] : (out.type === 'entities' ? [] : undefined);
                return acc;
              }, {});
              output = defaultOutputs;
          }
        } catch (e) {
          console.error('Error calculating node', nodeId, e);
          output = {};
        }

        values[nodeId] = output;
        executed.add(nodeId);
        return output;
      };

      nodeOrder.forEach(nodeId => { // Use topological sort order
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
        // Only store the connected value for the specific port
        nodeConnectedValues[conn.toNode][conn.toPort] = connValues[conn.id];
      });

      setNodes(prev => prev.map(node => ({
        ...node,
        connectedValues: nodeConnectedValues[node.id] || {}
      })));
    };

    calculateNodeValues();
  }, [nodes.length, connections, blackboard, getNodeOutputs]); // Added getNodeOutputs to dependencies to ensure correctness

  const handleCreate = () => {
    if (!newQuery.query_name) {
      alert('请填写查询名称');
      return;
    }
    createMutation.mutate(newQuery);
  };

  const NodeComponentRouter = useCallback((props) => {
    const queryNodeTypes = ['entity_source', 'filter_prototype', 'filter_attribute', 'filter_tag', 'filter_relation', 
      'filter_relation_attribute', 'filter_relation_tag', 'filter_related_entity_attribute', 'filter_related_entity_tag',
      'spatial_distance', 'spatial_area', 'logic_intersect', 'logic_union', 'logic_difference',
      'sort_by_attribute', 'sort_by_relation', 'sort_by_tag',
      'limit_top', 'limit_bottom', 'limit_percent_top', 'limit_percent_bottom', 'output'];
    
    if (queryNodeTypes.includes(props.node.type)) {
      return <QueryNode {...props} />;
    }
    return <Node {...props} />;
  }, []);

  if (currentQuery) {
    return (
      <div className="h-screen w-full bg-[#1e1e1e] flex flex-col overflow-hidden">
        <Toolbar
          onSave={saveQuery}
          onZoomIn={() => setZoom(prev => Math.min(prev + 0.1, 2))}
          onZoomOut={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
          onResetView={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          onToggleLibrary={() => setShowLibrary(!showLibrary)}
          onToggleBlackboard={() => setShowBlackboard(!showBlackboard)}
          onBack={() => setCurrentQuery(null)}
          projectName={currentQuery.query_name}
          zoom={zoom}
          showBlackboard={showBlackboard}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {showLibrary && <QueryNodeLibrary onAddNode={addNode} onClose={() => setShowLibrary(false)} />}

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
              NodeComponent={NodeComponentRouter}
              connectionValues={connectionValues} // Pass connection values to GraphCanvas
            />

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded text-white/60 text-xs font-mono space-y-1">
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
              <Plus className="w-3 h-3 mr-1" />新建查询
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
            <DialogHeader><DialogTitle className="text-white">新建实体查询</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">查询名称</label>
                <Input value={newQuery.query_name} onChange={(e) => setNewQuery({ ...newQuery, query_name: e.target.value })} placeholder="我的查询" className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">描述</label>
                <Input value={newQuery.description} onChange={(e) => setNewQuery({ ...newQuery, description: e.target.value })} className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">创建</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-3 gap-4">
          {filteredQueries.map((query) => (
            <div key={query.id} className="bg-[#252526] rounded border border-[#3e3e42] p-4 hover:border-[#0e639c] transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{query.query_name}</h3>
                  {query.description && <p className="text-white/60 text-xs mt-1">{query.description}</p>}
                </div>
                <button onClick={() => { if (confirm('确定删除？')) deleteMutation.mutate(query.id); }} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <Button size="sm" onClick={() => openQuery(query)} className="w-full h-7 bg-[#0e639c] hover:bg-[#1177bb]">
                <Filter className="w-3 h-3 mr-1" />可视化编辑
              </Button>
            </div>
          ))}
        </div>
        {filteredQueries.length === 0 && (
          <div className="text-center py-12 text-white/40"><Filter className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无查询</p></div>
        )}
      </div>
    </div>
  );
}