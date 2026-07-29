import React, { useState, useRef, useEffect } from "react";
import { Square, Clock } from "lucide-react";

export default function MacroExitNode({ 
  node,
  isSelected, 
  onSelect, 
  onDrag, 
  onPinMouseDown,
  onPinPositionsUpdate,
  onDragStart,
  onDragEnd,
  scale
}) {
  // Helper to check connections safely (though exit node usually has inputs, it might have output if we chain)
  // Input connections check depends on external data or is simplified. 
  // For this node, let's just ensure we don't crash if we check connections.

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
  }, [node.position, node.id, onPinPositionsUpdate, scale]);

  const handleMouseDown = (e) => {
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

  return (
    <div
      ref={nodeRef}
      className={`absolute bg-[#15171c] rounded-md shadow-sm select-none ${
        isSelected 
          ? 'border border-red-500 ring-1 ring-red-500/20' 
          : 'border border-white/10 hover:border-white/20'
      }`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: '160px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="h-8 bg-[#1a1d23] border-b border-white/5 border-t-2 border-t-red-500 rounded-t-md px-3 flex items-center gap-2 select-none">
        <Square className="w-3 h-3 text-red-400 fill-red-400 flex-shrink-0" />
        <span className="text-xs font-bold text-gray-200 uppercase tracking-wider whitespace-nowrap overflow-hidden text-ellipsis">Exit</span>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-gray-400 bg-[#0b0d12] border border-white/5 rounded p-2 mb-2">
            <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> End
            </span>
            <span className="font-mono text-red-400">{node.endTime || 0}ms</span>
        </div>
        
        <div className="flex justify-start">
             <div className="flex items-center gap-2">
                <div 
                    ref={(el) => pinRefs.current[`exec-input`] = el}
                    className="w-3 h-3 flex items-center justify-center cursor-crosshair"
                    style={{ color: '#ef4444' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onPinMouseDown(e, node.id, 'exec', false, true);
                    }}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" style={{ filter: 'drop-shadow(0 0 4px #ef4444)' }}>
                        <path d="M2 2 L8 2 L11 6 L8 10 L2 10 Z" />
                    </svg>
                </div>
                <span className="text-[10px] text-gray-500 font-medium">Complete</span>
             </div>
        </div>
      </div>
    </div>
  );
}