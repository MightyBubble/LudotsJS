import React, { useState, useRef, useEffect } from "react";
import { Calculator, Hash } from "lucide-react";
import { Input } from "@/components/ui/input";

const OPERATOR_SYMBOLS = {
  add: "+",
  subtract: "-",
  multiply: "×",
  divide: "÷",
  constant: "K"
};

export default function OperatorNode({ 
  node,
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
    if (e.target.tagName === 'INPUT' || e.target.closest('button') || e.target.closest('.pin-handle')) {
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

  const hasOutputConnection = (pinType) => {
    const conn = node.connections?.[pinType];
    if (Array.isArray(conn)) return conn.length > 0;
    return !!conn?.connectedTo;
  };

  const hasInputConnection = (pinType) => {
    return false;
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

  if (node.type === 'constant') {
    const value = Math.round(node.operatorData?.constantValue || 0);

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
          width: '120px',
          cursor: isDragging ? 'grabbing' : 'grab',
          pointerEvents: 'auto',
          transition: 'none',
          zIndex: isSelected ? 50 : 10
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex flex-col h-full p-3 relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-gradient-to-br from-cyan-500/20 to-cyan-600/5 rounded-md border border-cyan-500/20">
              <Hash className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm font-bold text-gray-200 uppercase tracking-wide select-none flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{node.name}</span>
          </div>
          
          <Input
            type="number"
            value={value}
            onChange={(e) => onPinValueChange(node.id, 'constantValue', e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="h-8 text-sm bg-[#0b0d12] border-white/10 text-cyan-300 text-center focus:border-cyan-500/50 focus:ring-0 font-mono mb-2"
          />

          <div 
            ref={(el) => pinRefs.current[`constantValue-output`] = el}
            className="pin-handle absolute -bottom-3 left-1/2 -translate-x-1/2 cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
            onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, 'constantValue', true, false); }}
          >
            <div className="absolute w-5 h-5 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
              {renderDataPin('constantValue', true, isOutputSnapTarget('constantValue'), hasOutputConnection('constantValue'), '#06b6d4')}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const inputAValue = Math.round(node.operatorData?.inputA || 0);
  const inputBValue = Math.round(node.operatorData?.inputB || 0);
  const outputValue = Math.round(node.operatorData?.output || 0);

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
        width: '180px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        transition: 'none',
        zIndex: isSelected ? 50 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-col h-full p-3 relative">
        {/* Input A Pin - Top */}
        <div 
          ref={(el) => pinRefs.current[`inputA-input`] = el}
          className="pin-handle absolute -top-3 left-1/4 -translate-x-1/2 cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
          onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, 'inputA', false, false); }}
        >
          <div className="absolute w-6 h-6 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
            <Calculator className={`w-3 h-3 ${hasInputConnection('inputA') ? 'text-cyan-400' : 'text-slate-500'} z-10`} />
          </div>
        </div>

        {/* Input B Pin - Top */}
        <div 
          ref={(el) => pinRefs.current[`inputB-input`] = el}
          className="pin-handle absolute -top-3 left-3/4 -translate-x-1/2 cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
          onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, 'inputB', false, false); }}
        >
          <div className="absolute w-6 h-6 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
            <Calculator className={`w-3 h-3 ${hasInputConnection('inputB') ? 'text-cyan-400' : 'text-slate-500'} z-10`} />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-blue-600/5 rounded-md border border-blue-500/20">
            <Calculator className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-2xl font-bold text-blue-400 select-none">{OPERATOR_SYMBOLS[node.type]}</span>
        </div>

        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <span className="text-[9px] text-slate-400 block text-center mb-1">A</span>
            <Input
              type="number"
              value={inputAValue}
              onChange={(e) => onPinValueChange(node.id, 'inputA', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-7 text-xs bg-[#0b0d12] border-white/10 text-gray-300 text-center focus:border-blue-500/50 focus:ring-0 font-mono"
            />
          </div>

          <div className="flex-1">
            <span className="text-[9px] text-slate-400 block text-center mb-1">B</span>
            <Input
              type="number"
              value={inputBValue}
              onChange={(e) => onPinValueChange(node.id, 'inputB', e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="h-7 text-xs bg-[#0b0d12] border-white/10 text-gray-300 text-center focus:border-blue-500/50 focus:ring-0 font-mono"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 text-center">
          <span className="text-xs text-gray-500 font-mono select-none">= {outputValue}</span>
        </div>

        {/* Output Pin - Bottom */}
        <div 
          ref={(el) => pinRefs.current[`output-output`] = el}
          className="pin-handle absolute -bottom-3 left-1/2 -translate-x-1/2 cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
          onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, node.id, 'output', true, false); }}
        >
          <div className="absolute w-5 h-5 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
            {renderDataPin('output', true, isOutputSnapTarget('output'), hasOutputConnection('output'), '#fbbf24')}
          </div>
        </div>
      </div>
    </div>
  );
}