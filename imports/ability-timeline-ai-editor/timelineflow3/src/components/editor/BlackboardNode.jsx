import React, { useState, useRef, useEffect } from "react";
import { Database } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BlackboardNode({ 
  node,
  blackboard,
  isSelected, 
  onSelect, 
  onDrag, 
  onDelete,
  onPinMouseDown,
  onUpdateNode,
  isConnecting,
  snapTargetPin,
  snapTargetIsOutput,
  onDragStart,
  onDragEnd,
  onPinPositionsUpdate,
  scale,
  offset
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const nodeRef = useRef(null);
  const pinRefs = useRef({});

  const isGetNode = node.type === 'get_blackboard';
  const variableName = node.blackboardData?.variableName || "";
  const variableType = blackboard[variableName]?.type || "number";

  useEffect(() => {
    if (!nodeRef.current) return;
    
    const updatePinPositions = () => {
      const positions = {};
      Object.entries(pinRefs.current).forEach(([key, ref]) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          positions[key] = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        }
      });
      onPinPositionsUpdate?.(node.id, positions);
    };

    updatePinPositions();
  }, [node.position, node.id, onPinPositionsUpdate, scale, offset]);

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.closest('.pin-handle') || e.target.closest('[role="combobox"]')) {
      return;
    }
    
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartRef.current = { 
      x: e.clientX, 
      y: e.clientY,
      initialX: node.position.x,
      initialY: node.position.y
    };
    onDragStart?.();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const totalDeltaX = e.clientX - dragStartRef.current.x;
      const totalDeltaY = e.clientY - dragStartRef.current.y;
      onDrag(node.id, totalDeltaX, totalDeltaY, dragStartRef.current.initialX, dragStartRef.current.initialY);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd?.();
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const handleVariableChange = (varName) => {
    onUpdateNode(node.id, {
      blackboardData: {
        ...node.blackboardData,
        variableName: varName
      }
    });
  };

  const hasOutputConnection = (pinType) => {
    const conn = node.connections?.[pinType];
    if (Array.isArray(conn)) return conn.length > 0;
    return !!conn?.connectedTo;
  };

  const isInputSnapTarget = (pinType) => {
    return snapTargetPin === pinType && snapTargetIsOutput === false;
  };

  const isOutputSnapTarget = (pinType) => {
    return snapTargetPin === pinType && snapTargetIsOutput === true;
  };

  const renderDataPin = (pinType, isOutput, isSnap, hasConnection, color = null) => {
    return (
      <div
        className="w-2 h-2 rounded-full border-[1.5px]"
        style={{
          backgroundColor: hasConnection ? (color || '#06b6d4') : isSnap ? '#fbbf24' : '#1e293b',
          borderColor: hasConnection ? (color || '#06b6d4') : isSnap ? '#fbbf24' : '#64748b',
          transform: isSnap ? 'scale(1.3)' : 'scale(1)',
          boxShadow: hasConnection ? `0 0 4px ${color || '#06b6d4'}` : isSnap ? '0 0 6px #fbbf24' : 'none',
          transition: 'transform 0.1s, box-shadow 0.1s'
        }}
      />
    );
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute bg-[#111318] rounded-lg shadow-2xl select-none ${
        isSelected 
          ? 'ring-1 ring-white/40' 
          : 'ring-1 ring-white/5 hover:ring-white/10'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: 'fit-content',
        minWidth: '200px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        transition: 'none',
        zIndex: isSelected ? 50 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-row items-stretch h-full">
        {!isGetNode && (
          <div className="w-6 flex flex-col items-center justify-center bg-[#1a1d23] border-r border-white/5 rounded-l-lg z-10 relative">
            <div 
              ref={(el) => pinRefs.current[`value-input`] = el}
              className="pin-handle cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
              onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, 'value', false, false); }}
            >
              <div className="absolute w-5 h-5 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
                {renderDataPin('value', false, isInputSnapTarget('value'), false, '#f59e0b')}
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col relative h-full p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-md border ${
              isGetNode 
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border-emerald-500/20' 
                : 'bg-gradient-to-br from-orange-500/20 to-orange-600/5 border-orange-500/20'
            }`}>
              <Database className={`w-4 h-4 ${isGetNode ? 'text-emerald-400' : 'text-orange-400'}`} />
            </div>
            <span className="text-sm font-bold text-gray-200 uppercase tracking-wide whitespace-nowrap overflow-hidden text-ellipsis select-none">
              {isGetNode ? 'Get' : 'Set'}
            </span>
          </div>

          <Select
            value={variableName}
            onValueChange={handleVariableChange}
          >
            <SelectTrigger 
              className="h-7 text-xs bg-[#0b0d12] border-white/5 text-gray-300 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue placeholder="选择变量" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(blackboard).length > 0 ? (
                Object.entries(blackboard).map(([varName, varData]) => (
                  <SelectItem key={varName} value={varName}>
                    <div className="flex items-center gap-2">
                      <span>{varName}</span>
                      <span className="text-[10px] text-gray-500">({varData.type})</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="_none" disabled>暂无变量</SelectItem>
              )}
            </SelectContent>
          </Select>

          {variableName && (
            <div className="text-[9px] text-gray-500 font-mono mt-2 select-none text-center">
              {variableType}
            </div>
          )}
        </div>

        {isGetNode && (
          <div className="w-6 flex flex-col items-center justify-center bg-[#1a1d23] border-l border-white/5 rounded-r-lg z-10 relative">
            <div 
              ref={(el) => pinRefs.current[`value-output`] = el}
              className="pin-handle cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
              onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, 'value', true, false); }}
            >
              <div className="absolute w-5 h-5 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
                {renderDataPin('value', true, isOutputSnapTarget('value'), hasOutputConnection('value'), '#10b981')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}