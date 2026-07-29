import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Node({ 
  clip,
  isSelected, 
  onSelect, 
  onDrag, 
  onDelete,
  onPinMouseDown,
  onPinValueChange,
  isConnecting,
  snapTargetPin,
  snapTargetIsOutput,
  onDragStart,
  onDragEnd,
  onPinPositionsUpdate
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const nodeRef = useRef(null);
  const pinRefs = useRef({});

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
      onPinPositionsUpdate?.(clip.id, positions);
    };

    updatePinPositions();
  }, [clip.nodePosition, clip.id, onPinPositionsUpdate]);

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.closest('.pin-handle')) {
      return;
    }
    
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartRef.current = { 
      x: e.clientX, 
      y: e.clientY,
      initialX: clip.nodePosition.x,
      initialY: clip.nodePosition.y
    };
    onDragStart?.();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const totalDeltaX = e.clientX - dragStartRef.current.x;
      const totalDeltaY = e.clientY - dragStartRef.current.y;
      onDrag(clip.id, totalDeltaX, totalDeltaY, dragStartRef.current.initialX, dragStartRef.current.initialY);
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

  const pins = [
    { type: 'startTime', label: 'Start', value: clip.startTime },
    { type: 'endTime', label: 'End', value: clip.endTime },
    { type: 'duration', label: 'Duration', value: clip.duration }
  ];

  const hasOutputConnection = (pinType) => {
    return clip.connections?.[pinType]?.connectedTo;
  };

  const isInputSnapTarget = (pinType) => {
    return snapTargetPin === pinType && snapTargetIsOutput === false;
  };

  const isOutputSnapTarget = (pinType) => {
    return snapTargetPin === pinType && snapTargetIsOutput === true;
  };

  return (
    <div
      ref={nodeRef}
      className={`absolute bg-[#2a2a2a] rounded select-none ${
        isSelected 
          ? 'ring-2 ring-orange-500 shadow-lg shadow-orange-500/30' 
          : 'ring-1 ring-gray-700 hover:ring-gray-600'
      }`}
      style={{
        left: clip.nodePosition.x,
        top: clip.nodePosition.y,
        width: '224px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        transition: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="h-9 bg-gradient-to-r from-purple-600 to-blue-600 rounded-t px-3 flex items-center justify-between group">
        <span className="text-xs font-medium text-white truncate">{clip.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded"
          style={{ transition: 'opacity 0.2s' }}
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* Pins */}
      <div className="p-2 space-y-1.5">
        {pins.map((pin) => {
          const isInputSnap = isInputSnapTarget(pin.type);
          const isOutputSnap = isOutputSnapTarget(pin.type);
          const hasOutput = hasOutputConnection(pin.type);
          
          return (
            <div key={pin.type} className="flex items-center gap-2 h-9">
              {/* Input Pin */}
              <div 
                ref={(el) => pinRefs.current[`${pin.type}-input`] = el}
                className="pin-handle relative flex-shrink-0 cursor-crosshair"
                style={{ 
                  width: '12px', 
                  height: '12px',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onPinMouseDown(e, clip.id, pin.type, false);
                }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{
                    backgroundColor: isInputSnap ? '#fbbf24' : 'transparent',
                    borderColor: isInputSnap ? '#fbbf24' : '#64748b',
                    transform: isInputSnap ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: isInputSnap ? '0 0 8px #fbbf24' : 'none',
                    transition: 'transform 0.1s, box-shadow 0.1s'
                  }}
                />
              </div>

              {/* Pin Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[9px] text-slate-400 mb-0.5 leading-none">{pin.label}</div>
                <Input
                  type="number"
                  value={pin.value}
                  onChange={(e) => onPinValueChange(clip.id, pin.type, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="h-5 text-[11px] bg-slate-900/50 border-slate-700 text-white px-2"
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              {/* Output Pin */}
              <div 
                ref={(el) => pinRefs.current[`${pin.type}-output`] = el}
                className="pin-handle relative flex-shrink-0 cursor-crosshair"
                style={{ 
                  width: '12px', 
                  height: '12px',
                  pointerEvents: 'auto'
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onPinMouseDown(e, clip.id, pin.type, true);
                }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2"
                  style={{
                    backgroundColor: hasOutput ? '#06b6d4' : isOutputSnap ? '#fbbf24' : 'transparent',
                    borderColor: hasOutput ? '#06b6d4' : isOutputSnap ? '#fbbf24' : '#64748b',
                    transform: isOutputSnap ? 'scale(1.3)' : 'scale(1)',
                    boxShadow: isOutputSnap ? '0 0 6px #06b6d4' : isOutputSnap ? '0 0 8px #fbbf24' : 'none',
                    transition: 'transform 0.1s, box-shadow 0.1s'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}