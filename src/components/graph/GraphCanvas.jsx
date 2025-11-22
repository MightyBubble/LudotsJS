import React, { useRef, useState, useCallback } from 'react';
import Node from './Node';
import Connection from './Connection';
import ContextMenu from './ContextMenu';
import { Download, Upload } from 'lucide-react';

export default function GraphCanvas({
  nodes,
  connections,
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
  const canvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState(null);
  const [pendingDrop, setPendingDrop] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [selectedConnections, setSelectedConnections] = useState(new Set());

  const DefaultNodeComponent = NodeComponent || Node;

  const handleMouseDown = (e) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.button === 0 && e.target === e.currentTarget) {
      setSelectedNodes(new Set());
      setSelectedConnections(new Set());
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();

    try {
      const jsonData = e.dataTransfer.getData('application/json');
      if (jsonData) {
        const { blackboardKey } = JSON.parse(jsonData);
        if (blackboardKey) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          const x = (e.clientX - canvasRect.left - pan.x) / zoom;
          const y = (e.clientY - canvasRect.top - pan.y) / zoom;

          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            options: [
              { label: 'Get (读取)', value: 'get', icon: Download },
              { label: 'Set (写入)', value: 'set', icon: Upload }
            ]
          });
          setPendingDrop({ blackboardKey, position: { x, y } });
          return;
        }
      }
    } catch (err) {
      // Continue to handle regular node drop
    }

    const nodeType = e.dataTransfer.getData('nodeType');
    if (nodeType) {
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - canvasRect.left - pan.x) / zoom;
      const y = (e.clientY - canvasRect.top - pan.y) / zoom;
      onAddNodeAtPosition(nodeType, { x, y });
    }
  };

  const handleContextMenuSelect = (value) => {
    if (pendingDrop) {
      const nodeType = value === 'get' ? 'blackboard_get' : 'blackboard_set';
      onAddNodeAtPosition(nodeType, pendingDrop.position, pendingDrop.blackboardKey);
      setPendingDrop(null);
    }
    setContextMenu(null);
  };

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }

    if (connectingFrom) {
      setMousePos({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart, connectingFrom, onPanChange]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    if (connectingFrom) {
      setConnectingFrom(null);
    }
  }, [connectingFrom]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();

      selectedNodes.forEach(nodeId => {
        onDeleteNode(nodeId);
      });

      selectedConnections.forEach(connId => {
        onDeleteConnection(connId);
      });

      setSelectedNodes(new Set());
      setSelectedConnections(new Set());
    }
  }, [selectedNodes, selectedConnections, onDeleteNode, onDeleteConnection]);

  React.useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleMouseMove, handleMouseUp, handleKeyDown]);

  const handleStartConnection = useCallback((nodeId, portId, portType, portElement) => {
    setConnectingFrom({ nodeId, portId, portType, portElement });
  }, []);

  const handleEndConnection = useCallback((nodeId, portId, portType) => {
    if (!connectingFrom) return;

    if (connectingFrom.nodeId === nodeId) {
      setConnectingFrom(null);
      return;
    }

    if (connectingFrom.portType === portType) {
      setConnectingFrom(null);
      return;
    }

    const connection = {
      id: `conn-${Date.now()}`,
      fromNode: connectingFrom.portType === 'output' ? connectingFrom.nodeId : nodeId,
      fromPort: connectingFrom.portType === 'output' ? connectingFrom.portId : portId,
      toNode: connectingFrom.portType === 'output' ? nodeId : connectingFrom.nodeId,
      toPort: connectingFrom.portType === 'output' ? portId : connectingFrom.portId
    };

    onAddConnection(connection);
    setConnectingFrom(null);
  }, [connectingFrom, onAddConnection]);

  const handleSelectNode = useCallback((nodeId, multiSelect) => {
    if (multiSelect) {
      setSelectedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      });
    } else {
      setSelectedNodes(new Set([nodeId]));
      setSelectedConnections(new Set());
      if (onSelectNode) onSelectNode(nodeId);
    }
  }, [onSelectNode]);

  const handleSelectConnection = useCallback((connId, multiSelect) => {
    if (multiSelect) {
      setSelectedConnections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(connId)) {
          newSet.delete(connId);
        } else {
          newSet.add(connId);
        }
        return newSet;
      });
    } else {
      setSelectedConnections(new Set([connId]));
      setSelectedNodes(new Set());
      if (onSelectConnection) onSelectConnection(connId);
    }
  }, [onSelectConnection]);

  const getPortPosition = (nodeId, portId, portType) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const portElement = document.querySelector(`[data-node-id="${nodeId}"][data-port-id="${portId}"][data-port-type="${portType}"]`);
    if (!portElement) return { x: 0, y: 0 };

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const portRect = portElement.getBoundingClientRect();

    return {
      x: (portRect.left + portRect.width / 2 - canvasRect.left - pan.x) / zoom,
      y: (portRect.top + portRect.height / 2 - canvasRect.top - pan.y) / zoom
    };
  };

  const getConnectionPositions = () => {
    return connections.map(conn => {
      const fromPos = getPortPosition(conn.fromNode, conn.fromPort, 'output');
      const toPos = getPortPosition(conn.toNode, conn.toPort, 'input');

      return {
        ...conn,
        fromX: fromPos.x,
        fromY: fromPos.y,
        toX: toPos.x,
        toY: toPos.y,
        value: connectionValues?.[conn.id]
      };
    });
  };

  const getTempConnectionPosition = () => {
    if (!connectingFrom || !canvasRef.current || !connectingFrom.portElement) return null;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const portRect = connectingFrom.portElement.getBoundingClientRect();

    const fromX = (portRect.left + portRect.width / 2 - canvasRect.left - pan.x) / zoom;
    const fromY = (portRect.top + portRect.height / 2 - canvasRect.top - pan.y) / zoom;
    const toX = (mousePos.x - canvasRect.left - pan.x) / zoom;
    const toY = (mousePos.y - canvasRect.top - pan.y) / zoom;

    return { fromX, fromY, toX, toY };
  };

  const isInputPortConnected = useCallback((nodeId, portId) => {
    return connections.some(c => c.toNode === nodeId && c.toPort === portId);
  }, [connections]);

  const connectedInputPorts = React.useMemo(() => {
    const set = new Set();
    connections.forEach(conn => {
      set.add(`${conn.toNode}-${conn.toPort}`);
    });
    return set;
  }, [connections]);

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-[#1e1e1e] relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        cursor: isPanning ? 'grabbing' : 'default',
        position: 'relative'
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <svg className="w-full h-full">
          <defs>
            <pattern
              id="grid"
              width={20 * zoom}
              height={20 * zoom}
              patternUnits="userSpaceOnUse"
              x={pan.x % (20 * zoom)}
              y={pan.y % (20 * zoom)}
            >
              <circle cx="1" cy="1" r="1" fill="#404040" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <svg
          className="w-full h-full"
          style={{
            overflow: 'visible',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          <g style={{ pointerEvents: 'auto' }}>
            {getConnectionPositions().map(conn => (
              <Connection
                key={conn.id}
                id={conn.id}
                fromX={conn.fromX}
                fromY={conn.fromY}
                toX={conn.toX}
                toY={conn.toY}
                value={conn.value}
                selected={selectedConnections.has(conn.id)}
                onSelect={handleSelectConnection}
                onDelete={onDeleteConnection}
              />
            ))}

            {connectingFrom && getTempConnectionPosition() && (() => {
              const pos = getTempConnectionPosition();
              return (
                <Connection
                  fromX={pos.fromX}
                  fromY={pos.fromY}
                  toX={pos.toX}
                  toY={pos.toY}
                  temporary
                />
              );
            })()}
          </g>
        </svg>
      </div>

      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          pointerEvents: 'auto',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map(node => (
          <DefaultNodeComponent
            key={node.id}
            node={node}
            selected={selectedNodes.has(node.id)}
            connectedInputPorts={connectedInputPorts}
            onUpdatePosition={onUpdateNodePosition}
            onUpdateData={onUpdateNodeData}
            onDelete={onDeleteNode}
            onSelect={handleSelectNode}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
          />
        ))}
      </div>

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