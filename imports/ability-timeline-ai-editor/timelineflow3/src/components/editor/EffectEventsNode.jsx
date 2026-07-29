import React, { useState, useRef, useEffect } from "react";
import { Zap, Play } from "lucide-react";

export default function EffectEventsNode({ 
  node,
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
    const target = e.target;
    if (
      target.closest('button') || 
      target.closest('.pin-handle')
    ) {
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

  const hasInputConnection = (pinType) => {
    return false;
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
          backgroundColor: hasConnection ? (color || '#a855f7') : isSnap ? '#fbbf24' : '#1e293b',
          borderColor: hasConnection ? (color || '#a855f7') : isSnap ? '#fbbf24' : '#64748b',
          transform: isSnap ? 'scale(1.3)' : 'scale(1)',
          boxShadow: hasConnection ? `0 0 4px ${color || '#a855f7'}` : isSnap ? '0 0 6px #fbbf24' : 'none',
          transition: 'transform 0.1s, box-shadow 0.1s'
        }}
      />
    );
  };

  const renderExecutionPin = (pinType, isOutput, isSnap, hasConnection, color = null) => {
    return (
      <div
        className="w-3 h-3 flex items-center justify-center"
        style={{
          color: hasConnection ? (color || '#06b6d4') : isSnap ? '#fbbf24' : '#64748b',
          transform: isSnap ? 'scale(1.3)' : 'scale(1)',
          filter: hasConnection ? `drop-shadow(0 0 4px ${color || '#06b6d4'})` : isSnap ? 'drop-shadow(0 0 6px #fbbf24)' : 'none',
          transition: 'transform 0.1s, filter 0.1s'
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 2 L8 2 L11 6 L8 10 L2 10 Z" />
        </svg>
      </div>
    );
  };

  const events = [
    { type: 'onTryAdd', label: 'TryAdd', color: '#64748b' },
    { type: 'onApplied', label: 'Applied', color: '#10b981' },
    { type: 'onTick', label: 'Tick', color: '#3b82f6' },
    { type: 'onInterrupted', label: 'Interrupted', color: '#f59e0b' },
    { type: 'onTimeout', label: 'Timeout', color: '#8b5cf6' },
    { type: 'onRemoved', label: 'Removed', color: '#ef4444' }
  ];

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
        minWidth: '280px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        transition: 'none',
        zIndex: isSelected ? 50 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-row items-stretch h-full min-h-[110px]">
        <div className="w-6 flex flex-col items-center justify-center bg-[#1a1d23] border-r border-white/5 rounded-l-lg z-10 relative">
          <div 
            ref={(el) => pinRefs.current[`handle-input`] = el}
            className="pin-handle cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
            onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, 'handle', false, false); }}
          >
            <div className="absolute w-5 h-5 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
              {renderDataPin('handle', false, isInputSnapTarget('handle'), hasInputConnection('handle'), '#a855f7')}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative h-full p-1">
          <div className="flex flex-col justify-center gap-1 px-4 py-4 z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-gradient-to-br from-purple-500/20 to-purple-600/5 rounded-md border border-purple-500/20">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-bold text-gray-200 uppercase tracking-wide text-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis select-none">{node.name}</span>
            </div>
            <span className="text-[9px] text-gray-500 font-mono mb-3 select-none">Effect Events</span>
          </div>

          <div className="flex flex-col gap-1.5 px-4 pb-3">
            {events.map((event) => (
              <div key={event.type} className="flex items-center justify-end gap-2 h-5">
                <span className="text-[9px] text-slate-400 font-medium select-none">{event.label}</span>
                <div 
                  ref={(el) => pinRefs.current[`${event.type}-output`] = el}
                  className="pin-handle cursor-crosshair flex items-center justify-center w-5 h-5 hover:scale-110 transition-transform z-50"
                  onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, event.type, true, true); }}
                >
                  {renderExecutionPin(event.type, true, isOutputSnapTarget(event.type), hasOutputConnection(event.type), event.color)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}