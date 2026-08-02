import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Node from './Node';
import Connection from './Connection';
import ContextMenu from './ContextMenu';
import { Download, Upload } from 'lucide-react';

const RFNodeWrapper = ({ data, selected }) => {
  const {
    node,
    NodeComponent,
    connectedInputPorts,
    onUpdateData,
    onUpdateNode,
    onDelete
  } = data;
  const Comp = NodeComponent || Node;
  const noop = () => {};

  return (
    <Comp
      node={node}
      selected={selected}
      connectedInputPorts={connectedInputPorts}
      connectedValues={node.connectedValues}
      onUpdatePosition={noop}
      onUpdateData={onUpdateData}
      onUpdateNode={onUpdateNode}
      onDelete={onDelete}
      onSelect={noop}
      onStartConnection={noop}
      onEndConnection={noop}
    />
  );
};

const nodeTypes = { unified: RFNodeWrapper };
const edgeTypes = { unified: Connection };

function ViewportSync({ zoom, pan }) {
  const { setViewport, getViewport } = useReactFlow();

  useEffect(() => {
    if (typeof zoom !== 'number') return;
    const v = getViewport();
    if (Math.abs(v.zoom - zoom) > 0.001) {
      setViewport({ x: v.x, y: v.y, zoom });
    }
  }, [zoom, getViewport, setViewport]);

  useEffect(() => {
    if (!pan) return;
    const v = getViewport();
    if (Math.abs(v.x - pan.x) > 0.5 || Math.abs(v.y - pan.y) > 0.5) {
      setViewport({ x: pan.x, y: pan.y, zoom: v.zoom });
    }
  }, [pan?.x, pan?.y, getViewport, setViewport]);

  return null;
}

function GraphCanvasInner({
  nodes,
  connections,
  connectionValues,
  zoom = 1,
  pan = { x: 0, y: 0 },
  onPanChange,
  onZoomChange,
  onUpdateNodePosition,
  onUpdateNodeData,
  onUpdateNode,
  onDeleteNode,
  onAddConnection,
  onDeleteConnection,
  onAddNodeAtPosition,
  onSelectNode,
  onSelectConnection,
  onPaneContextMenu,
  NodeComponent,
  variableNodeTypes = { read: 'blackboard_get', write: 'blackboard_set' }
}) {
  const { screenToFlowPosition } = useReactFlow();
  const [rfNodes, setRfNodes] = useState([]);
  const [rfEdges, setRfEdges] = useState([]);
  const containerRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [pendingDrop, setPendingDrop] = useState(null);

  const connectedInputPorts = useMemo(() => {
    const set = new Set();
    (connections || []).forEach(conn => {
      set.add(`${conn.toNode}-${conn.toPort}`);
    });
    return set;
  }, [connections]);

  // Sync incoming props into React Flow's own node state, preserving measurements
  useEffect(() => {
    setRfNodes(prev => {
      const prevMap = new Map(prev.map(n => [n.id, n]));
      return (nodes || []).map(node => {
        const old = prevMap.get(node.id);
        const isLocked = node.locked || (node.id && node.id.startsWith('output-'));
        return {
          ...(old || {}),
          id: node.id,
          type: 'unified',
          position: node.position || old?.position || { x: 0, y: 0 },
          draggable: true,
          deletable: !isLocked,
          data: {
            node,
            NodeComponent,
            connectedInputPorts,
            onUpdateData: onUpdateNodeData,
            onUpdateNode,
            onDelete: onDeleteNode
          }
        };
      });
    });
  }, [nodes, NodeComponent, connectedInputPorts, onUpdateNodeData, onUpdateNode, onDeleteNode]);

  useEffect(() => {
    setRfEdges(prev => {
      const prevMap = new Map(prev.map(e => [e.id, e]));
      return (connections || []).map(conn => {
        const old = prevMap.get(conn.id);
        return {
          ...(old || {}),
          id: conn.id,
          source: conn.fromNode,
          sourceHandle: conn.fromPort,
          target: conn.toNode,
          targetHandle: conn.toPort,
          type: 'unified',
          data: {
            value: connectionValues?.[conn.id],
            label: conn.data?.label
          }
        };
      });
    });
  }, [connections, connectionValues]);

  const handleNodesChange = useCallback((changes) => {
    setRfNodes(prev => applyNodeChanges(changes, prev));
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        onUpdateNodePosition?.(change.id, change.position);
      } else if (change.type === 'remove') {
        onDeleteNode?.(change.id);
      }
    });
  }, [onUpdateNodePosition, onDeleteNode]);

  const handleEdgesChange = useCallback((changes) => {
    setRfEdges(prev => applyEdgeChanges(changes, prev));
    changes.forEach(change => {
      if (change.type === 'remove') {
        onDeleteConnection?.(change.id);
      }
    });
  }, [onDeleteConnection]);

  const handleConnect = useCallback((params) => {
    if (!params.source || !params.target || params.source === params.target) return;
    onAddConnection?.({
      id: `conn-${Date.now()}`,
      fromNode: params.source,
      fromPort: params.sourceHandle,
      toNode: params.target,
      toPort: params.targetHandle
    });
  }, [onAddConnection]);

  const handleMove = useCallback((_, viewport) => {
    onPanChange?.({ x: viewport.x, y: viewport.y });
    onZoomChange?.(viewport.zoom);
  }, [onPanChange, onZoomChange]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        const { blackboardKey } = JSON.parse(jsonData);
        if (blackboardKey) {
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            options: [
              { label: 'Get (读取)', value: 'get', icon: Download },
              { label: 'Set (写入)', value: 'set', icon: Upload }
            ]
          });
          setPendingDrop({ blackboardKey, position });
          return;
        }
      }
    } catch (err) {
      // fall through to regular node drop
    }

    const nodeType = e.dataTransfer.getData('nodeType');
    if (nodeType) {
      onAddNodeAtPosition?.(nodeType, position);
    }
  }, [screenToFlowPosition, onAddNodeAtPosition]);

  const handleContextMenuSelect = useCallback((value) => {
    if (pendingDrop) {
      const nodeType = value === 'get' ? variableNodeTypes.read : variableNodeTypes.write;
      onAddNodeAtPosition?.(nodeType, pendingDrop.position, pendingDrop.blackboardKey);
      setPendingDrop(null);
    }
    setContextMenu(null);
  }, [pendingDrop, onAddNodeAtPosition, variableNodeTypes]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-[#0B0D12] relative"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={(e) => {
        if (e.target.closest('.react-flow__node') || e.target.closest('.react-flow__edge')) return;
        e.preventDefault();
        const rect = containerRef.current.getBoundingClientRect();
        onPaneContextMenu?.({
          x: e.clientX,
          y: e.clientY,
          position: {
            x: (e.clientX - rect.left - (pan?.x ?? 0)) / zoom,
            y: (e.clientY - rect.top - (pan?.y ?? 0)) / zoom
          }
        });
      }}
    >
      <style>{`
        .react-flow__attribution { display: none; }
        .react-flow__handle { transition: none; }
        .react-flow__edge.selected .react-flow__edge-path { stroke: #ffa500; }
      `}</style>

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onMove={handleMove}
        onNodeClick={(_, node) => onSelectNode?.(node.id)}
        onEdgeClick={(_, edge) => onSelectConnection?.(edge.id)}

        defaultViewport={{ x: pan?.x ?? 0, y: pan?.y ?? 0, zoom }}
        minZoom={0.2}
        maxZoom={2}
        deleteKeyCode={['Delete', 'Backspace']}
        panOnDrag={[1]}
        selectionOnDrag
        multiSelectionKeyCode={['Control', 'Meta']}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#0B0D12' }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1E2128" />
        <ViewportSync zoom={zoom} pan={pan} />
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onSelect={handleContextMenuSelect}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

export default function GraphCanvas(props) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}