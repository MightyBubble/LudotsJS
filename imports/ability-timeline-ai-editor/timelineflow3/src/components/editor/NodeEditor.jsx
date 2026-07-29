import React, { useState, useRef, useEffect, useCallback } from "react";
import OperatorNode from "./OperatorNode";
import Connection from "./Connection";
import Minimap from "./Minimap";
import EffectClipNode from "./EffectClipNode";
import GameplayTagClipNode from "./GameplayTagClipNode";
import GameplayCueClipNode from "./GameplayCueClipNode";
import MontageClipNode from "./MontageClipNode";
import CompositeClipNode from "./CompositeClipNode";
import MacroEntryNode from "./MacroEntryNode";
import MacroExitNode from "./MacroExitNode";
import InstantEffectFrameNode from "./InstantEffectFrameNode";
import CustomEventFrameNode from "./CustomEventFrameNode";
import GameplayCueFrameNode from "./GameplayCueFrameNode";
import BlackboardNode from "./BlackboardNode";
import EffectEventsNode from "./EffectEventsNode";
import RerouteNode from "./RerouteNode";

export default function NodeEditor({
  nodes,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  onCreateConnection,
  onRemoveConnection,
  onDragStart,
  onDragEnd,
  globalBlackboard,
  onDiveIn,
  onConnectionDoubleClick
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState(null);
  const [snapTarget, setSnapTarget] = useState(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [pinPositions, setPinPositions] = useState({});
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef(null);
  const transformRef = useRef(null);

  const connectingFromRef = useRef(null);
  const snapTargetRef = useRef(null);
  const nodesRef = useRef(nodes);

  const SNAP_DISTANCE = 30;

  // 判断引脚是否为执行类型
  const isExecutionPin = (nodeType, pinType) => {
    const executionPins = [
      'onTryAdd', 'onApplied', 'onTick', 'onInterrupted', 'onTimeout', 'onRemoved', 'onCompleted',
      'exec', 'execOut'
    ];
    return executionPins.includes(pinType);
  };

  useEffect(() => {
    connectingFromRef.current = connectingFrom;
  }, [connectingFrom]);

  useEffect(() => {
    snapTargetRef.current = snapTarget;
  }, [snapTarget]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedConnectionId) {
        e.preventDefault();
        const parts = selectedConnectionId.split('|');
        if (parts.length === 4) {
            const [nodeId, pinType, targetNodeId, targetPin] = parts;
            onRemoveConnection(nodeId, pinType, targetNodeId, targetPin);
        }
        setSelectedConnectionId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedConnectionId, onRemoveConnection]);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    if (canvasRef.current) {
      canvasRef.current.addEventListener('contextmenu', handleContextMenu);
      return () => {
        if (canvasRef.current) {
          canvasRef.current.removeEventListener('contextmenu', handleContextMenu);
        }
      };
    }
  }, []);

  const handleWheel = (e) => {
    e.preventDefault();

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = (mouseX - offset.x) / scale;
    const worldY = (mouseY - offset.y) / scale;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(2, scale * delta));

    const newOffset = {
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale
    };

    setScale(newScale);
    setOffset(newOffset);
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 2) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
    else if (e.button === 0 && e.target === canvasRef.current) {
      setSelectedConnectionId(null);
      onSelectNode(null);
    }
  };

  const handleNodeDrag = useCallback((nodeId, totalDeltaX, totalDeltaY, initialX, initialY) => {
    onUpdateNode(nodeId, {
      position: {
        x: initialX + totalDeltaX / scale,
        y: initialY + totalDeltaY / scale
      }
    });
  }, [onUpdateNode, scale]);

  const handlePinPositionsUpdate = useCallback((nodeId, positions) => {
    setPinPositions(prev => ({
      ...prev,
      [nodeId]: positions
    }));
  }, []);

  const screenToCanvas = (screenX, screenY) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top
    };
  };

  const getPinScreenPosition = (nodeId, pinType, isOutput) => {
    const positions = pinPositions[nodeId];
    if (!positions) return null;
    const key = `${pinType}-${isOutput ? 'output' : 'input'}`;
    return positions[key] || null;
  };

  const handlePinMouseDown = (e, nodeId, pinType, isOutput, isExecution = false) => {
    e.stopPropagation();
    e.preventDefault();

    const pinPos = getPinScreenPosition(nodeId, pinType, isOutput);
    if (!pinPos) return;

    const canvasPos = screenToCanvas(pinPos.x, pinPos.y);
    if (!canvasPos) return;

    setConnectingFrom({
      nodeId,
      pinType,
      isOutput,
      isExecution,
      startX: canvasPos.x,
      startY: canvasPos.y,
      currentX: canvasPos.x,
      currentY: canvasPos.y
    });
    setSelectedConnectionId(null);
  };

  const getNodePins = (node) => {
    if (['effect_clip', 'gameplay_tag_clip', 'gameplay_cue_clip', 'montage_clip', 'composite_clip', 'instant_effect_frame', 'custom_event_frame', 'gameplay_cue_frame', 'macro_entry', 'macro_exit'].includes(node.type)) {
      return [];
    } else if (node.type === 'get_blackboard' || node.type === 'set_blackboard') {
      return ['value'];
    } else if (node.type === 'constant') {
      return ['constantValue'];
    } else if (['add', 'subtract', 'multiply', 'divide'].includes(node.type)) {
      return ['inputA', 'inputB', 'output'];
    } else if (node.type === 'macro_entry') {
      return ['exec'];
    } else if (node.type === 'macro_exit') {
      return ['exec'];
    } else if (node.type === 'effect_events') {
      return ['handle', 'onTryAdd', 'onApplied', 'onTick', 'onInterrupted', 'onTimeout', 'onRemoved'];
    } else if (node.type === 'reroute') {
      return ['input', 'output'];
    }
    return [];
    };

  const findSnapTarget = (canvasX, canvasY) => {
    const connecting = connectingFromRef.current;
    if (!connecting) return null;

    const currentNodes = nodesRef.current;
    let closestPin = null;
    let closestDistance = SNAP_DISTANCE;

    currentNodes.forEach(node => {
      if (node.id === connecting.nodeId) return;

      let pins = [];
      const contextFields = ['caster', 'target', 'casterPos', 'targetPos'];
      const timeFields = ['startTime', 'endTime', 'duration'];

      if (node.type === 'effect_clip') {
        const effectDataFields = ['magnitude', 'stackCount'];
        // Removed lifecycle callbacks from main node, added events pin
        pins = [...contextFields, ...timeFields, ...effectDataFields, 'exec', 'events'];
      } else if (node.type === 'effect_events') {
         if (!connecting.isOutput) {
             pins = ['handle', 'onTryAdd', 'onApplied', 'onTick', 'onInterrupted', 'onTimeout', 'onRemoved'];
         } else {
             pins = ['handle', 'onTryAdd', 'onApplied', 'onTick', 'onInterrupted', 'onTimeout', 'onRemoved'];
         }
      } else if (node.type === 'gameplay_tag_clip') {
        const tagDataFields = ['attachmentCount'];

        if (!connecting.isOutput) {
          pins = [...contextFields, ...timeFields, ...tagDataFields, 'exec'];
        } else {
          pins = [...contextFields, ...timeFields, ...tagDataFields, 'exec'];
        }
      } else if (node.type === 'gameplay_cue_clip') {
        const cueDataFields = ['cueTag', 'intensity'];
        if (!connecting.isOutput) {
          pins = [...contextFields, ...timeFields, ...cueDataFields, 'exec'];
        } else {
          pins = [...contextFields, ...timeFields, ...cueDataFields, 'exec'];
        }
      } else if (node.type === 'montage_clip') {
        const montageDataFields = ['animName', 'sectionName', 'playRate'];
        const montageLifecycleCallbacks = ['onCompleted'];
        if (!connecting.isOutput) {
          pins = [...contextFields, ...timeFields, ...montageDataFields, 'exec', ...montageLifecycleCallbacks];
        } else {
          pins = [...contextFields, ...timeFields, ...montageDataFields, 'exec', ...montageLifecycleCallbacks];
        }
      } else if (node.type === 'composite_clip') {
        // Composite clips act like regular clips
        if (!connecting.isOutput) {
          pins = [...contextFields, ...timeFields, 'exec'];
        } else {
          pins = [...contextFields, ...timeFields, 'exec'];
        }
      } else if (node.type === 'instant_effect_frame') {
        const instantFields = ['effectType', 'value'];
        const instantTimeFields = ['startTime'];

        if (!connecting.isOutput) {
          pins = [...contextFields, ...instantTimeFields, ...instantFields, 'exec', 'execOut'];
        } else {
          pins = [...contextFields, ...instantTimeFields, ...instantFields, 'exec', 'execOut'];
        }
      } else if (node.type === 'custom_event_frame') {
        const eventFields = ['eventName'];
        const eventTimeFields = ['startTime'];

        if (!connecting.isOutput) {
          pins = [...contextFields, ...eventTimeFields, ...eventFields, 'exec', 'execOut'];
        } else {
          pins = [...contextFields, ...eventTimeFields, ...eventFields, 'exec', 'execOut'];
        }
      } else if (node.type === 'gameplay_cue_frame') {
        const cueFields = ['cueTag', 'intensity'];
        const cueTimeFields = ['startTime'];

        if (!connecting.isOutput) {
          pins = [...contextFields, ...cueTimeFields, ...cueFields, 'exec', 'execOut'];
        } else {
          pins = [...contextFields, ...cueTimeFields, ...cueFields, 'exec', 'execOut'];
        }
      } else {
        pins = getNodePins(node);
      }

      pins.forEach(pinType => {
        const targetIsOutput = !connecting.isOutput;

        // 检查引脚类型匹配
        // Special case: events -> handle is a data connection that looks like execution? No, it's data.
        // But let's make sure we don't mix them.
        const targetIsExecution = isExecutionPin(node.type, pinType);
        
        // Allow data connections (handle/events)
        const isEventConnection = (pinType === 'events' || pinType === 'handle');
        const connectingIsEvent = (connecting.pinType === 'events' || connecting.pinType === 'handle');
        
        if (isEventConnection !== connectingIsEvent) {
             return;
        }

        if (!isEventConnection && connecting.isExecution !== targetIsExecution) {
          return; 
        }

        let isInputPin = false;
        let isOutputPin = false;

        if (node.type === 'effect_clip') {
          const effectDataFields = ['magnitude', 'stackCount'];
          
          isInputPin = [...contextFields, ...timeFields, ...effectDataFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...timeFields, 'events'].includes(pinType);
        } else if (node.type === 'effect_events') {
          isInputPin = pinType === 'handle';
          isOutputPin = ['onTryAdd', 'onApplied', 'onTick', 'onInterrupted', 'onTimeout', 'onRemoved'].includes(pinType);
        } else if (node.type === 'gameplay_tag_clip') {
          const tagDataFields = ['attachmentCount'];

          isInputPin = [...contextFields, ...timeFields, ...tagDataFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...timeFields].includes(pinType);
        } else if (node.type === 'gameplay_cue_clip') {
          const cueDataFields = ['cueTag', 'intensity'];
          isInputPin = [...contextFields, ...timeFields, ...cueDataFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...timeFields].includes(pinType);
        } else if (node.type === 'montage_clip') {
          const montageDataFields = ['animName', 'sectionName', 'playRate'];
          const montageLifecycleCallbacks = ['onCompleted'];
          isInputPin = [...contextFields, ...timeFields, ...montageDataFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...timeFields, ...montageLifecycleCallbacks].includes(pinType);
        } else if (node.type === 'composite_clip') {
          isInputPin = [...contextFields, ...timeFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...timeFields].includes(pinType);
        } else if (node.type === 'instant_effect_frame') {
          const instantFields = ['effectType', 'value'];
          const instantTimeFields = ['startTime'];

          isInputPin = [...contextFields, ...instantTimeFields, ...instantFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...instantTimeFields, 'execOut'].includes(pinType);
        } else if (node.type === 'custom_event_frame') {
          const eventFields = ['eventName'];
          const eventTimeFields = ['startTime'];

          isInputPin = [...contextFields, ...eventTimeFields, ...eventFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...eventTimeFields, 'execOut'].includes(pinType);
        } else if (node.type === 'gameplay_cue_frame') {
          const cueFields = ['cueTag', 'intensity'];
          const cueTimeFields = ['startTime'];

          isInputPin = [...contextFields, ...cueTimeFields, ...cueFields, 'exec'].includes(pinType);
          isOutputPin = [...contextFields, ...cueTimeFields, 'execOut'].includes(pinType);
        } else if (node.type === 'get_blackboard') {
          isOutputPin = pinType === 'value';
        } else if (node.type === 'set_blackboard') {
          isInputPin = pinType === 'value';
        } else if (node.type === 'constant') {
          isOutputPin = pinType === 'constantValue';
        } else if (['add', 'subtract', 'multiply', 'divide'].includes(node.type)) {
          isInputPin = ['inputA', 'inputB'].includes(pinType);
          isOutputPin = ['output'].includes(pinType);
        } else if (node.type === 'macro_entry') {
            isOutputPin = pinType === 'exec';
        } else if (node.type === 'macro_exit') {
            isInputPin = pinType === 'exec';
        } else if (node.type === 'effect_events') {
            isInputPin = pinType === 'handle';
            isOutputPin = ['onTryAdd', 'onApplied', 'onTick', 'onInterrupted', 'onTimeout', 'onRemoved'].includes(pinType);
        } else if (node.type === 'reroute') {
            // Reroute pins can be both inputs and outputs depending on usage, 
            // but strictly 'input' pin is input, 'output' pin is output
            isInputPin = pinType === 'input';
            isOutputPin = pinType === 'output';
        }

        if ((targetIsOutput && !isOutputPin) || (!targetIsOutput && !isInputPin)) {
          return;
        }

        const pinPos = getPinScreenPosition(node.id, pinType, targetIsOutput);

        if (pinPos) {
          const canvasPos = screenToCanvas(pinPos.x, pinPos.y);
          if (!canvasPos) return;

          const distance = Math.sqrt(
            Math.pow(canvasPos.x - canvasX, 2) +
            Math.pow(canvasPos.y - canvasY, 2)
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPin = {
              nodeId: node.id,
              pinType,
              isOutput: targetIsOutput,
              x: canvasPos.x,
              y: canvasPos.y
            };
          }
        }
      });
    });

    return closestPin;
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isPanning) {
        setOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
      }

      if (connectingFromRef.current) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        if (!canvasPos) return;

        const target = findSnapTarget(canvasPos.x, canvasPos.y);
        setSnapTarget(target);

        setConnectingFrom(prev => {
          if (!prev) return null;
          return {
            ...prev,
            currentX: canvasPos.x,
            currentY: canvasPos.y
          };
        });
      }
    };

    const handleGlobalMouseUp = (e) => {
      if (isPanning) {
        setIsPanning(false);
      }

      const currentConnecting = connectingFromRef.current;
      const currentSnapTarget = snapTargetRef.current;

      if (currentConnecting && currentSnapTarget) {
        if (currentConnecting.isOutput && !currentSnapTarget.isOutput) {
          onCreateConnection(
            currentConnecting.nodeId,
            currentConnecting.pinType,
            currentSnapTarget.nodeId,
            currentSnapTarget.pinType
          );
        } else if (!currentConnecting.isOutput && currentSnapTarget.isOutput) {
          onCreateConnection(
            currentSnapTarget.nodeId,
            currentSnapTarget.pinType,
            currentConnecting.nodeId,
            currentConnecting.pinType
          );
        }
      }

      if (currentConnecting) {
        setConnectingFrom(null);
        setSnapTarget(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, panStart, onCreateConnection]);

  const handleConnectionDoubleClickInternal = (connectionId, screenPos) => {
      const canvasPos = screenToCanvas(screenPos.x, screenPos.y);
      if (canvasPos) {
          onConnectionDoubleClick?.(connectionId, canvasPos);
      }
  };

  const handlePinValueChange = (nodeId, pinType, value) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Handle non-numeric string fields
    if (
      (node.type === 'instant_effect_frame' && pinType === 'effectType') ||
      (node.type === 'custom_event_frame' && pinType === 'eventName') ||
      (node.type === 'gameplay_cue_frame' && pinType === 'cueTag') ||
      (node.type === 'gameplay_tag_clip' && pinType === 'tagName') ||
      (node.type === 'gameplay_cue_clip' && pinType === 'cueTag') ||
      (node.type === 'montage_clip' && (pinType === 'animName' || pinType === 'sectionName')) ||
      (node.type === 'get_blackboard' || node.type === 'set_blackboard') // Fallback if used
    ) {
      onUpdateNode(nodeId, { [pinType]: value });
      return;
    }

    // Handle Numeric fields
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
       onUpdateNode(nodeId, { [pinType]: numValue });
    }
  };

  const getAllConnections = () => {
    const connections = [];
    nodes.forEach(node => {
      if (node.connections && typeof node.connections === 'object') {
        Object.entries(node.connections).forEach(([pinType, connData]) => {
          if (!connData) return;
          
          const conns = Array.isArray(connData) ? connData : [connData];
          
          conns.forEach(conn => {
              if (conn && typeof conn === 'object' && conn.connectedTo) {
                const fromPos = getPinScreenPosition(node.id, pinType, true);
                const toPos = getPinScreenPosition(conn.connectedTo, conn.connectedPin, false);
    
                if (fromPos && toPos) {
                  const fromCanvas = screenToCanvas(fromPos.x, fromPos.y);
                  const toCanvas = screenToCanvas(toPos.x, toPos.y);
    
                  if (fromCanvas && toCanvas) {
                    const isExecution = isExecutionPin(node.type, pinType);
                    connections.push({
                      // Use pipe separator to safely split, and include target details for uniqueness
                      id: `${node.id}|${pinType}|${conn.connectedTo}|${conn.connectedPin}`,
                      fromPos: fromCanvas,
                      toPos: toCanvas,
                      fromNodeId: node.id,
                      fromPinType: pinType,
                      toNodeId: conn.connectedTo,
                      toPinType: conn.connectedPin,
                      isExecution,
                      controlPoints: conn.controlPoints 
                    });
                  }
                }
              }
          });
        });
      }
    });
    return connections;
  };

  const handleConnectionUpdate = (connectionId, updates) => {
    const parts = connectionId.split('|');
    if (parts.length !== 4) return;
    
    const [nodeId, pinType, targetNodeId, targetPin] = parts;
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.connections || !node.connections[pinType]) return;

    const existingConns = Array.isArray(node.connections[pinType]) 
        ? node.connections[pinType] 
        : [node.connections[pinType]];

    const newConns = existingConns.map(c => 
        (c.connectedTo === targetNodeId && c.connectedPin === targetPin)
            ? { ...c, ...updates }
            : c
    );

    const newConnections = {
      ...node.connections,
      [pinType]: newConns
    };

    onUpdateNode(nodeId, { connections: newConnections });
  };

  const handleMinimapNavigate = (newOffset) => {
    setOffset(newOffset);
  };

  return (
    <div className="flex-1 bg-[#0b0d12] flex flex-col overflow-hidden border-l border-white/5">
      <div className="h-8 bg-[#0b0d12] border-b border-white/5 flex items-center px-4 justify-between select-none z-20">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-blue-600/50" />
           <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Blueprint Graph</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-sm bg-gray-700" />
             <span className="text-[9px] text-gray-600 font-mono uppercase">Zoom: {Math.round(scale * 100)}%</span>
          </div>
        </div>
      </div>

      <div
        ref={canvasRef}
        className="flex-1 relative overflow-hidden bg-[#0b0d12]"
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        style={{
          cursor: isPanning ? 'grabbing' : connectingFrom ? 'crosshair' : 'default',
          backgroundImage: 'radial-gradient(circle, #1a1d23 1px, transparent 1px)',
          backgroundSize: `${20 * scale}px ${20 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`
        }}
      >
        <div
          ref={transformRef}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            {nodes.map(node => {
              let NodeComponent;
              let nodeProps = {};

              if (node.type === 'effect_clip') {
                NodeComponent = EffectClipNode;
                nodeProps = {
                  clip: {
                    ...node,
                    ...node.effectClipData,
                    nodePosition: node.position
                  }
                };
              } else if (node.type === 'gameplay_tag_clip') {
                NodeComponent = GameplayTagClipNode;
                nodeProps = {
                  clip: {
                    ...node,
                    ...node.gameplayTagClipData,
                    nodePosition: node.position
                  }
                };
                } else if (node.type === 'gameplay_cue_clip') {
                NodeComponent = GameplayCueClipNode;
                nodeProps = {
                  clip: {
                    ...node,
                    ...node.gameplayCueClipData,
                    nodePosition: node.position
                  }
                };
                } else if (node.type === 'montage_clip') {
                  NodeComponent = MontageClipNode;
                  nodeProps = {
                    clip: {
                      ...node,
                      ...node.montageClipData,
                      nodePosition: node.position
                    }
                  };
                } else if (node.type === 'composite_clip') {
                  NodeComponent = CompositeClipNode;
                  nodeProps = {
                    clip: {
                      ...node,
                      ...node.compositeClipData,
                      nodePosition: node.position
                    },
                    onDiveIn: onDiveIn
                  };
                } else if (node.type === 'instant_effect_frame') {
                NodeComponent = InstantEffectFrameNode;
                nodeProps = {
                  clip: {
                    ...node,
                    ...node.instantEffectFrameData,
                    nodePosition: node.position
                  }
                };
              } else if (node.type === 'custom_event_frame') {
                NodeComponent = CustomEventFrameNode;
                nodeProps = {
                  clip: {
                    ...node,
                    ...node.customEventFrameData,
                    nodePosition: node.position
                  }
                };
              } else if (node.type === 'gameplay_cue_frame') {
                NodeComponent = GameplayCueFrameNode;
                nodeProps = {
                  clip: {
                    ...node,
                    ...node.gameplayCueFrameData,
                    nodePosition: node.position
                  }
                };
              } else if (node.type === 'macro_entry') {
                  NodeComponent = MacroEntryNode;
                  nodeProps = { node };
              } else if (node.type === 'macro_exit') {
                  NodeComponent = MacroExitNode;
                  nodeProps = { node };
              } else if (node.type === 'get_blackboard' || node.type === 'set_blackboard') {
                NodeComponent = BlackboardNode;
                nodeProps = { node, blackboard: globalBlackboard };
              } else if (node.type === 'effect_events') {
                NodeComponent = EffectEventsNode;
                nodeProps = { node };
              } else if (node.type === 'reroute') {
                NodeComponent = RerouteNode;
                nodeProps = { node };
              } else {
                NodeComponent = OperatorNode;
                nodeProps = { node };
              }

              return (
                <NodeComponent
                  key={node.id}
                  {...nodeProps}
                  isSelected={node.id === selectedNodeId}
                  onSelect={() => {
                    onSelectNode(node.id);
                    setSelectedConnectionId(null);
                  }}
                  onDrag={handleNodeDrag}
                  onDelete={() => onDeleteNode(node.id)}
                  onPinMouseDown={handlePinMouseDown}
                  onPinValueChange={handlePinValueChange}
                  onUpdateNode={onUpdateNode}
                  onPinPositionsUpdate={handlePinPositionsUpdate}
                  isConnecting={!!connectingFrom}
                  snapTargetPin={snapTarget?.nodeId === node.id ? snapTarget.pinType : null}
                  snapTargetIsOutput={snapTarget?.nodeId === node.id ? snapTarget.isOutput : null}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  scale={scale}
                  offset={offset}
                  />
              );
            })}
          </div>
        </div>

        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <g>
            {getAllConnections().map((conn) => (
              <Connection
                key={conn.id}
                connectionId={conn.id}
                fromPos={conn.fromPos}
                toPos={conn.toPos}
                controlPoints={conn.controlPoints}
                isSelected={selectedConnectionId === conn.id}
                isDragging={false}
                isExecution={conn.isExecution}
                onSelect={() => {
                  setSelectedConnectionId(conn.id);
                  onSelectNode(null);
                }}
                onUpdate={handleConnectionUpdate}
                onDoubleClick={handleConnectionDoubleClickInternal}
                scale={scale}
              />
            ))}

            {connectingFrom && (
              <Connection
                fromPos={{ x: connectingFrom.startX, y: connectingFrom.startY }}
                toPos={
                  snapTarget
                    ? { x: snapTarget.x, y: snapTarget.y }
                    : { x: connectingFrom.currentX, y: connectingFrom.currentY }
                }
                isDragging={true}
                isExecution={connectingFrom.isExecution}
              />
            )}

            {snapTarget && (
              <>
                <circle
                  cx={snapTarget.x}
                  cy={snapTarget.y}
                  r="15"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="15;20;15"
                    dur="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={snapTarget.x}
                  cy={snapTarget.y}
                  r="8"
                  fill="#fbbf24"
                  opacity="0.8"
                />
              </>
            )}
          </g>
        </svg>

        <Minimap
          clips={nodes.map(n => ({
            id: n.id,
            nodePosition: n.position
          }))}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
          scale={scale}
          offset={offset}
          onNavigate={handleMinimapNavigate}
        />
      </div>
    </div>
  );
}