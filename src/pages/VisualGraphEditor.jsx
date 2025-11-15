import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GraphCanvas from '../components/graph/GraphCanvas';
import NodeLibrary from '../components/graph/NodeLibrary';
import Toolbar from '../components/graph/Toolbar';
import SimulationPanel from '../components/graph/SimulationPanel';
import ProjectManager from '../components/graph/ProjectManager';
import BlackboardPanel from '../components/graph/BlackboardPanel';
import OutputConfigPanel from '../components/graph/OutputConfigPanel';

export default function VisualGraphEditor() {
  const [currentProject, setCurrentProject] = useState(null);
  const [showProjectManager, setShowProjectManager] = useState(true);
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
  const [nodeValues, setNodeValues] = useState({});
  const [connectionValues, setConnectionValues] = useState({});

  const queryClient = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['dataGraphs'],
    queryFn: () => base44.entities.DataGraph.list(),
  });

  const createProjectMutation = useMutation({
    mutationFn: (data) => base44.entities.DataGraph.create({
      ...data,
      nodes: [],
      connections: [],
      blackboard: {},
      outputs: []
    }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
      openProject(project);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DataGraph.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.DataGraph.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataGraphs'] });
    },
  });

  const openProject = (project) => {
    setCurrentProject(project);
    setNodes(project.nodes || []);
    setConnections(project.connections || []);
    setBlackboard(project.blackboard || {});
    setOutputs(project.outputs || []);
    setShowProjectManager(false);
  };

  useEffect(() => {
    if (!currentProject) return;

    const outputNodeIds = new Set(outputs.map(o => `output-${o.id}`));
    const existingOutputNodes = nodes.filter(n => n.id.startsWith('output-'));
    
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
        position: { 
          x: 1000, 
          y: 100 + (outputs.indexOf(output) * 100) 
        },
        data: { label: output.label },
        inputs: [{ id: 'value', label: output.label, type: output.type }],
        outputs: [],
        locked: true
      }));
      setNodes(prev => [...prev, ...newNodes]);
    }
  }, [outputs, currentProject]);

  const saveProject = useCallback(() => {
    if (!currentProject) return;
    
    updateProjectMutation.mutate({
      id: currentProject.id,
      data: {
        nodes,
        connections,
        blackboard,
        outputs
      }
    });
  }, [currentProject, nodes, connections, blackboard, outputs]);

  const getNodeInputs = (type) => {
    const inputConfigs = {
      'number': [],
      'add': [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' }
      ],
      'subtract': [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' }
      ],
      'multiply': [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' }
      ],
      'divide': [
        { id: 'a', label: 'A', type: 'number' },
        { id: 'b', label: 'B', type: 'number' }
      ],
      'power': [
        { id: 'base', label: '底数', type: 'number' },
        { id: 'exponent', label: '指数', type: 'number' }
      ],
      'sum': [
        { id: 'array', label: '数组', type: 'array' }
      ],
      'product': [
        { id: 'array', label: '数组', type: 'array' }
      ],
      'max': [
        { id: 'array', label: '数组', type: 'array' }
      ],
      'min': [
        { id: 'array', label: '数组', type: 'array' }
      ],
      'clamp': [
        { id: 'value', label: '值', type: 'number' },
        { id: 'min', label: '最小值', type: 'number' },
        { id: 'max', label: '最大值', type: 'number' }
      ],
      'vector2': [
        { id: 'x', label: 'X', type: 'number' },
        { id: 'y', label: 'Y', type: 'number' }
      ],
      'vector3': [
        { id: 'x', label: 'X', type: 'number' },
        { id: 'y', label: 'Y', type: 'number' },
        { id: 'z', label: 'Z', type: 'number' }
      ],
      'vector4': [
        { id: 'x', label: 'X', type: 'number' },
        { id: 'y', label: 'Y', type: 'number' },
        { id: 'z', label: 'Z', type: 'number' },
        { id: 'w', label: 'W', type: 'number' }
      ],
      'vector_add': [
        { id: 'a', label: 'A', type: 'vector' },
        { id: 'b', label: 'B', type: 'vector' }
      ],
      'vector_subtract': [
        { id: 'a', label: 'A', type: 'vector' },
        { id: 'b', label: 'B', type: 'vector' }
      ],
      'vector_multiply': [
        { id: 'vector', label: '向量', type: 'vector' },
        { id: 'scalar', label: '标量', type: 'number' }
      ],
      'vector_dot': [
        { id: 'a', label: 'A', type: 'vector' },
        { id: 'b', label: 'B', type: 'vector' }
      ],
      'vector_cross': [
        { id: 'a', label: 'A', type: 'vector' },
        { id: 'b', label: 'B', type: 'vector' }
      ],
      'vector_normalize': [
        { id: 'vector', label: '向量', type: 'vector' }
      ],
      'vector_length': [
        { id: 'vector', label: '向量', type: 'vector' }
      ],
      'quaternion': [
        { id: 'x', label: 'X', type: 'number' },
        { id: 'y', label: 'Y', type: 'number' },
        { id: 'z', label: 'Z', type: 'number' },
        { id: 'w', label: 'W', type: 'number' }
      ],
      'color': [
        { id: 'r', label: 'R', type: 'number' },
        { id: 'g', label: 'G', type: 'number' },
        { id: 'b', label: 'B', type: 'number' }
      ],
      'blackboard_get': [],
      'blackboard_set': [
        { id: 'value', label: '值', type: 'any' }
      ]
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
      'vector_add': [{ id: 'result', label: '结果', type: 'vector' }],
      'vector_subtract': [{ id: 'result', label: '结果', type: 'vector' }],
      'vector_multiply': [{ id: 'result', label: '结果', type: 'vector' }],
      'vector_dot': [{ id: 'result', label: '结果', type: 'number' }],
      'vector_cross': [{ id: 'result', label: '结果', type: 'vector' }],
      'vector_normalize': [{ id: 'result', label: '结果', type: 'vector' }],
      'vector_length': [{ id: 'result', label: '长度', type: 'number' }],
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
      sum: {},
      product: {},
      max: {},
      min: {},
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
      add: { a: 0, b: 0 },
      subtract: { a: 0, b: 0 },
      multiply: { a: 0, b: 0 },
      divide: { a: 1, b: 1 },
      power: { base: 2, exponent: 2 },
      sum: {},
      product: {},
      max: {},
      min: {},
      clamp: { value: 0, min: 0, max: 100 },
      vector2: { x: 0, y: 0 },
      vector3: { x: 0, y: 0, z: 0 },
      vector4: { x: 0, y: 0, z: 0, w: 0 },
      quaternion: { x: 0, y: 0, z: 0, w: 1 },
      color: { r: 1, g: 1, b: 1 },
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
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, position } : node
    ));
  }, []);

  const updateNodeData = useCallback((nodeId, data) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    ));
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setConnections(prev => prev.filter(conn => 
      conn.fromNode !== nodeId && conn.toNode !== nodeId
    ));
  }, []);

  const addConnection = useCallback((connection) => {
    const exists = connections.some(c => 
      c.fromNode === connection.fromNode &&
      c.fromPort === connection.fromPort &&
      c.toNode === connection.toNode &&
      c.toPort === connection.toPort
    );
    
    if (!exists) {
      setConnections(prev => [...prev, connection]);
    }
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
        node.inputs.forEach(input => {
          const conn = connections.find(c => c.toNode === nodeId && c.toPort === input.id);
          if (conn) {
            const sourceValue = execute(conn.fromNode);
            if (sourceValue && sourceValue[conn.fromPort] !== undefined) {
              inputs[input.id] = sourceValue[conn.fromPort];
              connValues[conn.id] = sourceValue[conn.fromPort];
            }
          } else if (node.data[input.id] !== undefined) {
            inputs[input.id] = node.data[input.id];
          }
        });

        let output = {};
        switch (node.type) {
          case 'number':
            output = { value: node.data.value || 0 };
            break;
          case 'add':
            output = { result: (inputs.a ?? node.data.a ?? 0) + (inputs.b ?? node.data.b ?? 0) };
            break;
          case 'subtract':
            output = { result: (inputs.a ?? node.data.a ?? 0) - (inputs.b ?? node.data.b ?? 0) };
            break;
          case 'multiply':
            output = { result: (inputs.a ?? node.data.a ?? 0) * (inputs.b ?? node.data.b ?? 0) };
            break;
          case 'divide':
            const b = inputs.b ?? node.data.b ?? 1;
            output = { result: b !== 0 ? (inputs.a ?? node.data.a ?? 0) / b : 0 };
            break;
          case 'power':
            output = { result: Math.pow(inputs.base ?? node.data.base ?? 0, inputs.exponent ?? node.data.exponent ?? 0) };
            break;
          case 'sum':
            const sumArray = inputs.array || [];
            output = { result: Array.isArray(sumArray) ? sumArray.reduce((acc, val) => acc + (val || 0), 0) : 0 };
            break;
          case 'product':
            const productArray = inputs.array || [];
            output = { result: Array.isArray(productArray) && productArray.length > 0 ? productArray.reduce((acc, val) => acc * (val || 1), 1) : 0 };
            break;
          case 'max':
            const maxArray = inputs.array || [];
            output = { result: Array.isArray(maxArray) && maxArray.length > 0 ? Math.max(...maxArray) : 0 };
            break;
          case 'min':
            const minArray = inputs.array || [];
            output = { result: Array.isArray(minArray) && minArray.length > 0 ? Math.min(...minArray) : 0 };
            break;
          case 'clamp':
            const val = inputs.value ?? node.data.value ?? 0;
            const minVal = inputs.min ?? node.data.min ?? 0;
            const maxVal = inputs.max ?? node.data.max ?? 100;
            output = { result: Math.max(minVal, Math.min(maxVal, val)) };
            break;
          case 'vector2':
            output = { vector: { x: inputs.x ?? node.data.x ?? 0, y: inputs.y ?? node.data.y ?? 0 } };
            break;
          case 'vector3':
            output = { vector: { x: inputs.x ?? node.data.x ?? 0, y: inputs.y ?? node.data.y ?? 0, z: inputs.z ?? node.data.z ?? 0 } };
            break;
          case 'vector4':
            output = { vector: { x: inputs.x ?? node.data.x ?? 0, y: inputs.y ?? node.data.y ?? 0, z: inputs.z ?? node.data.z ?? 0, w: inputs.w ?? node.data.w ?? 0 } };
            break;
          case 'color':
            output = { color: { r: inputs.r ?? node.data.r ?? 0, g: inputs.g ?? node.data.g ?? 0, b: inputs.b ?? node.data.b ?? 0 } };
            break;
          case 'blackboard_get':
            const key = node.data.key;
            output = { value: blackboard[key]?.value };
            break;
          case 'blackboard_set':
            const setKey = node.data.key;
            const setValue = inputs.value;
            if (setKey && blackboard[setKey] && setValue !== undefined) {
              setBlackboard(prev => ({
                ...prev,
                [setKey]: { ...prev[setKey], value: setValue }
              }));
            }
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

        values[nodeId] = output;
        executed.add(nodeId);
        return output;
      };

      nodes.forEach(node => execute(node.id));
      setNodeValues(values);
      setConnectionValues(connValues);

      const results = {};
      nodes.filter(n => n.id.startsWith('output-')).forEach(node => {
        const val = values[node.id];
        if (val && val.value !== undefined) {
          results[node.id] = { nodeId: node.id, type: node.type, value: val.value, label: node.data.label };
        }
      });
      setSimulationResults(results);
    };

    calculateNodeValues();
  }, [nodes, connections, blackboard]);

  const runSimulation = useCallback(() => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 300);
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (showProjectManager || !currentProject) {
    return (
      <ProjectManager
        projects={projects}
        onOpen={openProject}
        onCreate={(data) => createProjectMutation.mutate(data)}
        onDelete={(id) => deleteProjectMutation.mutate(id)}
        onClose={() => {
          if (currentProject) {
            setShowProjectManager(false);
          }
        }}
      />
    );
  }

  return (
    <div className="h-screen w-full bg-[#1e1e1e] flex flex-col overflow-hidden">
      <Toolbar 
        onSave={saveProject}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetView={handleResetView}
        onToggleLibrary={() => setShowLibrary(!showLibrary)}
        onToggleBlackboard={() => setShowBlackboard(!showBlackboard)}
        onSimulate={runSimulation}
        onBack={() => setShowProjectManager(true)}
        onConfigOutput={() => setShowOutputConfig(true)}
        projectName={currentProject.name}
        zoom={zoom}
        isSimulating={isSimulating}
        showBlackboard={showBlackboard}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {showLibrary && (
          <NodeLibrary 
            onAddNode={addNode}
            onClose={() => setShowLibrary(false)}
          />
        )}

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
          <BlackboardPanel 
            blackboard={blackboard}
            onChange={setBlackboard}
          />
        ) : (
          <SimulationPanel results={simulationResults} />
        )}
      </div>

      {showOutputConfig && (
        <OutputConfigPanel
          outputs={outputs}
          onChange={setOutputs}
          onClose={() => setShowOutputConfig(false)}
        />
      )}
    </div>
  );
}