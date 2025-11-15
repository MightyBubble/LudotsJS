import React, { useState, useMemo, useCallback, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Plus, Workflow, Trash2, Network } from "lucide-react";
import GraphCanvas from '../components/graph/GraphCanvas';
import NodeLibrary from '../components/graph/NodeLibrary';
import Toolbar from '../components/graph/Toolbar';
import SimulationPanel from '../components/graph/SimulationPanel';
import BlackboardPanel from '../components/graph/BlackboardPanel';
import OutputConfigPanel from '../components/graph/OutputConfigPanel';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function DataGraphEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentGraph, setCurrentGraph] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [blackboard, setBlackboard] = useState({});
  const [outputs, setOutputs] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLibrary, setShowLibrary] = useState(true);
  const [showBlackboard, setShowBlackboard] = useState(true);
  const [showOutputConfig, setShowOutputConfig] = useState(false);
  const [simulationResults, setSimulationResults] = useState({});
  const [isSimulating, setIsSimulating] = useState(false);
  const [connectionValues, setConnectionValues] = useState({});
  const [isCreating, setIsCreating] = useState(false);
  const [newGraph, setNewGraph] = useState({ graph_id: '', name: '', description: '', graph_type: 'curve' });

  const queryClient = useQueryClient();

  const { data: graphs = [] } = useQuery({
    queryKey: ['dataGraphs'],
    queryFn: () => base44.entities.DataGraph.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DataGraph.create({
      ...data,
      graph_definition: JSON.stringify({ nodes: [], connections: [], blackboard: {}, outputs: [] })
    }),
    onSuccess: (graph) => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
      setIsCreating(false);
      setNewGraph({ graph_id: '', name: '', description: '', graph_type: 'curve' });
      openGraph(graph);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DataGraph.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DataGraph.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
    },
  });

  const filteredGraphs = useMemo(() => {
    if (!searchQuery) return graphs;
    return graphs.filter(g => 
      g.graph_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.name && g.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [graphs, searchQuery]);

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
    setOutputs(graphDef.outputs || []);
  };

  useEffect(() => {
    if (!currentGraph) return;

    const outputNodeIds = new Set(outputs.map(o => `output-${o.id}`));
    const existingOutputNodes = nodes.filter(n => n.id && n.id.startsWith('output-'));
    
    const nodesToRemove = existingOutputNodes.filter(n => !outputNodeIds.has(n.id));
    if (nodesToRemove.length > 0) {
      setNodes(prev => prev.filter(n => !nodesToRemove.some(r => r.id === n.id)));
      setConnections(prev => prev.filter(c => !nodesToRemove.some(r => r.id === c.toNode)));
    }

    const existingOutputNodeIds = new Set(existingOutputNodes.map(n => n.id));
    const newOutputs = outputs.filter(o => !existingOutputNodeIds.has(`output-${o.id}`));
    
    if (newOutputs.length > 0) {
      const outputTypeMap = {
        number: 'output_number',
        vector2: 'output_vector2',
        vector3: 'output_vector3',
        vector4: 'output_vector4',
        color: 'output_color'
      };

      const newNodes = newOutputs.map((output) => ({
        id: `output-${output.id}`,
        type: outputTypeMap[output.type] || 'output_number',
        position: { x: 1000, y: 100 + (outputs.indexOf(output) * 100) },
        data: { label: output.label },
        inputs: [{ id: 'value', label: output.label, type: output.type }],
        outputs: [],
        locked: true
      }));
      setNodes(prev => [...prev, ...newNodes]);
    }
  }, [outputs, currentGraph]);

  const saveGraph = useCallback(() => {
    if (!currentGraph) return;
    
    updateMutation.mutate({
      id: currentGraph.id,
      data: {
        graph_definition: JSON.stringify({ nodes, connections, blackboard, outputs })
      }
    });
  }, [currentGraph, nodes, connections, blackboard, outputs]);

  const getNodeInputs = (type) => {
    const inputConfigs = {
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
            case 'vector2': 
              output = { vector: { x: inputs.x ?? node.data?.x ?? 0, y: inputs.y ?? node.data?.y ?? 0 } }; 
              break;
            case 'vector3': 
              output = { vector: { x: inputs.x ?? node.data?.x ?? 0, y: inputs.y ?? node.data?.y ?? 0, z: inputs.z ?? node.data?.z ?? 0 } }; 
              break;
            case 'vector4': 
              output = { vector: { x: inputs.x ?? node.data?.x ?? 0, y: inputs.y ?? node.data?.y ?? 0, z: inputs.z ?? node.data?.z ?? 0, w: inputs.w ?? node.data?.w ?? 0 } }; 
              break;
            case 'color': 
              output = { color: { r: inputs.r ?? node.data?.r ?? 0, g: inputs.g ?? node.data?.g ?? 0, b: inputs.b ?? node.data?.b ?? 0 } }; 
              break;
            case 'blackboard_get': 
              output = { value: blackboard[node.data?.key]?.value }; 
              break;
            case 'output_number':
            case 'output_vector2':
            case 'output_vector3':
            case 'output_vector4':
            case 'output_color':
              output = { value: inputs.value };
              break;
            default: 
              output = inputs;
          }
        } catch (e) {
          console.error('Error calculating node', nodeId, e);
          output = {};
        }

        values[nodeId] = output;
        executed.add(nodeId);
        return output;
      };

      nodes.forEach(node => {
        try {
          execute(node.id);
        } catch (e) {
          console.error('Error executing node', node.id, e);
        }
      });
      
      setConnectionValues(connValues);

      const results = {};
      nodes.filter(n => n.id && n.id.startsWith('output-')).forEach(node => {
        const val = values[node.id];
        if (val && val.value !== undefined) {
          results[node.id] = { nodeId: node.id, type: node.type, value: val.value, label: node.data?.label };
        }
      });
      setSimulationResults(results);
    };

    calculateNodeValues();
  }, [nodes, connections, blackboard]);

  const handleCreate = () => {
    if (!newGraph.graph_id || !newGraph.name) {
      alert('请填写 Graph ID 和名称');
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
          onSimulate={() => { setIsSimulating(true); setTimeout(() => setIsSimulating(false), 300); }}
          onBack={() => setCurrentGraph(null)}
          onConfigOutput={() => setShowOutputConfig(true)}
          projectName={currentGraph.name}
          zoom={zoom}
          isSimulating={isSimulating}
          showBlackboard={showBlackboard}
        />

        <div className="flex-1 flex overflow-hidden relative">
          {showLibrary && <NodeLibrary onAddNode={addNode} onClose={() => setShowLibrary(false)} />}

          <div className="flex-1 relative">
            <GraphCanvas
              nodes={nodes}
              connections={connections}
              connectionValues={connectionValues}
              zoom={zoom}
              pan={pan}
              onPanChange={setPan}
              onUpdateNodePosition={updateNodePosition}
              onUpdateNodeData={updateNodeData}
              onDeleteNode={deleteNode}
              onAddConnection={addConnection}
              onDeleteConnection={deleteConnection}
              onAddNodeAtPosition={addNodeAtPosition}
            />

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-2 rounded text-white/60 text-xs font-mono space-y-1">
              <div>节点: {nodes.length}</div>
              <div>连接: {connections.length}</div>
              <div>缩放: {(zoom * 100).toFixed(0)}%</div>
            </div>
          </div>

          {showBlackboard ? (
            <BlackboardPanel blackboard={blackboard} onChange={setBlackboard} />
          ) : (
            <SimulationPanel results={simulationResults} />
          )}
        </div>

        {showOutputConfig && (
          <OutputConfigPanel outputs={outputs} onChange={setOutputs} onClose={() => setShowOutputConfig(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Network className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">Data Graph 编辑器</span>
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
            <DialogHeader><DialogTitle className="text-white">新建 Data Graph</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">Graph ID</label>
                <Input value={newGraph.graph_id} onChange={(e) => setNewGraph({ ...newGraph, graph_id: e.target.value })} placeholder="linear_curve" className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">名称</label>
                <Input value={newGraph.name} onChange={(e) => setNewGraph({ ...newGraph, name: e.target.value })} placeholder="线性曲线" className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">描述</label>
                <Input value={newGraph.description} onChange={(e) => setNewGraph({ ...newGraph, description: e.target.value })} className="bg-[#3c3c3c] border-[#434343] text-white" />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">类型</label>
                <select value={newGraph.graph_type} onChange={(e) => setNewGraph({ ...newGraph, graph_type: e.target.value })} className="w-full bg-[#3c3c3c] border border-[#434343] text-white rounded px-3 py-2 text-sm">
                  <option value="curve">曲线图</option>
                  <option value="attribute_calculation">属性计算图</option>
                </select>
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
                <div>
                  <h3 className="text-white font-medium">{graph.name}</h3>
                  <p className="text-white/40 text-xs font-mono mt-1">{graph.graph_id}</p>
                </div>
                <button onClick={() => { if (confirm('确定删除？')) deleteMutation.mutate(graph.id); }} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-white/60 text-xs mb-3">{graph.description || '暂无描述'}</p>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${graph.graph_type === 'curve' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'}`}>
                  {graph.graph_type === 'curve' ? '曲线' : '属性计算'}
                </span>
                <Button size="sm" onClick={() => openGraph(graph)} className="ml-auto h-7 bg-[#0e639c] hover:bg-[#1177bb]">
                  <Workflow className="w-3 h-3 mr-1" />可视化编辑
                </Button>
              </div>
            </div>
          ))}
        </div>
        {filteredGraphs.length === 0 && (
          <div className="text-center py-12 text-white/40"><Network className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无 Data Graph</p></div>
        )}
      </div>
    </div>
  );
}