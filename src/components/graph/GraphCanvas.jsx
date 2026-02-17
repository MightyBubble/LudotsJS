import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import RFCustomNode from './RFCustomNode';
import RFCustomEdge from './RFCustomEdge';
import ContextMenu from './ContextMenu';
import { Download, Upload } from 'lucide-react';

const nodeTypes = { customNode: RFCustomNode };
const edgeTypes = { customEdge: RFCustomEdge };

function GraphCanvasInner({
  nodes: externalNodes,
  connections: externalConnections,
  connectionValues,
  zoom,
  pan,
  onPanChange,
  onUpdateNodePosition,
  onUpdateNodeData,
  onDeleteNode,
  onAddConnection,
  onDeleteConnection,
  onAddNodeAtPosition,
  onSelectNode,
  onSelectConnection,
  NodeComponent
}) {
  const reactFlowWrapper = useRef(null);
  const { screenToFlowPosition } = useReactFlow();
  const [contextMenu, setContextMenu] = useState(null);
  const [pendingDrop, setPendingDrop] = useState(null);

  // Convert external nodes to React Flow format
  const rfNodes = useMemo(() => {
    return externalNodes.map(node => ({
      id: node.id,
      type: 'customNode',
      position: { x: node.position?.x || 0, y: node.position?.y || 0 },
      data: {
        ...node,
        NodeComponent,
        onUpdateData: onUpdateNodeData,
        onDelete: onDeleteNode,
        connectionValues: connectionValues,
        connectedInputPorts: new Set(
          externalConnections
            .filter(c => c.toNode === node.id)
            .map(c => `${c.toNode}-${c.toPort}`)
        ),
      },
      selected: false,
    }));
  }, [externalNodes, externalConnections, connectionValues, NodeComponent, onUpdateNodeData, onDeleteNode]);

  // Convert external connections to React Flow edges
  const rfEdges = useMemo(() => {
    return externalConnections.map(conn => ({
      id: conn.id,
      source: conn.fromNode,
      sourceHandle: `output-${conn.fromPort}`,
      target: conn.toNode,
      targetHandle: `input-${conn.toPort}`,
      type: 'customEdge',
      data: {
        value: connectionValues?.[conn.id],
        onDelete: onDeleteConnection,
      },
    }));
  }, [externalConnections, connectionValues, onDeleteConnection]);

  const onNodesChange = useCallback((changes) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position && change.dragging) {
        onUpdateNodePosition(change.id, change.position);
      }
      if (change.type === 'select' && change.selected) {
        onSelectNode?.(change.id);
      }
    });
  }, [onUpdateNodePosition, onSelectNode]);

  const onEdgesChange = useCallback((changes) => {
    changes.forEach(change => {
      if (change.type === 'select' && change.selected) {
        onSelectConnection?.(change.id);
      }
    });
  }, [onSelectConnection]);

  const onConnect = useCallback((params) => {
    const fromPort = params.sourceHandle?.replace('output-', '') || 'value';
    const toPort = params.targetHandle?.replace('input-', '') || 'value';
    
    const connection = {
      id: `conn-${Date.now()}`,
      fromNode: params.source,
      fromPort,
      toNode: params.target,
      toPort,
    };
    onAddConnection(connection);
  }, [onAddConnection]);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    // Check for blackboard key drop
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
      // Continue to handle regular node drop
    }

    const nodeType = e.dataTransfer.getData('nodeType');
    if (nodeType) {
      onAddNodeAtPosition(nodeType, position);
    }
  }, [screenToFlowPosition, onAddNodeAtPosition]);

  const handleContextMenuSelect = (value) => {
    if (pendingDrop) {
      const nodeType = value === 'get' ? 'blackboard_get' : 'blackboard_set';
      onAddNodeAtPosition(nodeType, pendingDrop.position, pendingDrop.blackboardKey);
      setPendingDrop(null);
    }
    setContextMenu(null);
  };

  const onNodeDelete = useCallback((deletedNodes) => {
    deletedNodes.forEach(node => onDeleteNode(node.id));
  }, [onDeleteNode]);

  const onEdgeDelete = useCallback((deletedEdges) => {
    deletedEdges.forEach(edge => onDeleteConnection(edge.id));
  }, [onDeleteConnection]);

  const isValidConnection = useCallback((connection) => {
    // Prevent self-connections
    return connection.source !== connection.target;
  }, []);

  // Sync viewport from external zoom/pan
  const { setViewport, getViewport } = useReactFlow();
  const lastExternalUpdate = useRef({ zoom, pan });
  
  useEffect(() => {
    const current = getViewport();
    // Only sync if external values differ significantly from current viewport
    if (
      Math.abs(current.zoom - zoom) > 0.01 ||
      Math.abs(current.x - pan.x) > 1 ||
      Math.abs(current.y - pan.y) > 1
    ) {
      // Only apply if these came from external changes (toolbar buttons)
      if (
        lastExternalUpdate.current.zoom !== zoom ||
        lastExternalUpdate.current.pan.x !== pan.x ||
        lastExternalUpdate.current.pan.y !== pan.y
      ) {
        setViewport({ x: pan.x, y: pan.y, zoom });
        lastExternalUpdate.current = { zoom, pan };
      }
    }
  }, [zoom, pan, setViewport, getViewport]);

  const onMoveEnd = useCallback((_, viewport) => {
    lastExternalUpdate.current = { zoom: viewport.zoom, pan: { x: viewport.x, y: viewport.y } };
    onPanChange({ x: viewport.x, y: viewport.y });
  }, [onPanChange]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodesDelete={onNodeDelete}
        onEdgesDelete={onEdgeDelete}
        onMoveEnd={onMoveEnd}
        isValidConnection={isValidConnection}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: pan.x, y: pan.y, zoom }}
        fitView={false}
        snapToGrid={true}
        snapGrid={[20, 20]}
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode="Control"
        panOnDrag={[2]}
        selectionOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={true}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#0B0D12' }}
        connectionLineStyle={{ stroke: '#666', strokeWidth: 2, strokeDasharray: '5,5' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#1E2128"
        />
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