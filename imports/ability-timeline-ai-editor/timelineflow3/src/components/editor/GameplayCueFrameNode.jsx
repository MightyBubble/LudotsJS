import React, { useState, useRef, useEffect } from "react";
import { Wand2, User, Crosshair, MapPin, Clock, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function GameplayCueFrameNode({ 
  clip,
  isSelected, 
  onSelect, 
  onDrag, 
  onDelete,
  onPinMouseDown,
  onPinValueChange,
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
      onPinPositionsUpdate?.(clip.id, positions);
    };

    updatePinPositions();
  }, [clip.nodePosition, clip.id, onPinPositionsUpdate, scale, offset]);

  const handleMouseDown = (e) => {
    const target = e.target;
    if (
      target.tagName === 'INPUT' || 
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

  const contextFields = [
    { type: 'caster', label: 'Caster', icon: User },
    { type: 'target', label: 'Target', icon: Crosshair },
    { type: 'location', label: 'Location', icon: MapPin }
  ];

  const timeFields = [
    { type: 'startTime', label: 'Time', value: clip.startTime, icon: Clock, hasInput: true }
  ];

  const dataFields = [
    { type: 'cueTag', label: 'Tag', value: clip.cueTag || 'GameplayCue.', icon: Wand2, isText: true },
    { type: 'intensity', label: 'Intensity', value: clip.intensity || 1.0, icon: Sparkles }
  ];

  const hasInputConnection = (pinType) => {
    return false;
  };

  const hasOutputConnection = (pinType) => {
    const conn = clip.connections?.[pinType];
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

  const renderSection = (title, colorClass, borderClass, textClass, fields) => (
    <div className={`flex flex-col bg-[#1a1d23] border-y border-x-2 border-solid ${borderClass} rounded-md overflow-visible h-full relative`}>
      <div className="px-3 pt-5 pb-3 flex flex-col items-center gap-2 flex-1">
        <span className={`text-[11px] font-bold uppercase tracking-widest mb-2 opacity-90 ${textClass}`}>
          {title}
        </span>
        
        <div className="flex gap-4 items-start h-full mt-1">
          {fields.map((field) => (
            <div key={field.type} className="flex flex-col items-center justify-between gap-2 h-full min-w-[40px] relative group">
              {field.hasInput !== false && (
                <div 
                  ref={(el) => pinRefs.current[`${field.type}-input`] = el}
                  className="pin-handle absolute -top-[60px] cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
                  onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, clip.id, field.type, false, false); }}
                >
                  <div className="absolute w-6 h-6 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
                    <field.icon className={`w-3 h-3 ${hasInputConnection(field.type) ? 'text-cyan-400' : 'text-slate-500'} z-10`} />
                  </div>
                </div>
              )}
              
              <div className="flex flex-col items-center gap-1.5 mt-1 flex-1 justify-center">
                <span className="text-[9px] text-slate-400 font-medium text-center leading-tight">{field.label}</span>
                {field.value !== undefined && (
                  <Input
                    type={field.isText ? 'text' : 'number'}
                    value={field.value}
                    onChange={(e) => onPinValueChange(clip.id, field.type, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="h-4 w-14 text-[9px] bg-transparent border border-transparent hover:bg-[#0b0d12] hover:border-white/10 text-slate-300 px-0 rounded text-center focus:bg-[#0b0d12] focus:border-cyan-500/50 focus:ring-0 p-0 shadow-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              </div>

              <div 
                ref={(el) => pinRefs.current[`${field.type}-output`] = el}
                className="pin-handle absolute -bottom-[22px] cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform z-50"
                onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, clip.id, field.type, true, false); }}
              >
                <div className="absolute w-5 h-5 bg-[#1a1d23] rounded-full border border-white/10 flex items-center justify-center shadow-sm z-0">
                  {renderDataPin(field.type, true, isOutputSnapTarget(field.type), hasOutputConnection(field.type))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      ref={nodeRef}
      className={`absolute bg-[#111318] rounded-lg shadow-2xl select-none ${
        isSelected 
          ? 'ring-1 ring-white/40' 
          : 'ring-1 ring-white/5 hover:ring-white/10'
      }`}
      style={{
        left: clip.nodePosition.x,
        top: clip.nodePosition.y,
        width: 'fit-content',
        minWidth: '400px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        transition: 'none',
        zIndex: isSelected ? 50 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex flex-row items-stretch h-full min-h-[100px]">
        <div className="w-6 flex flex-col items-center bg-[#1a1d23] border-r border-white/5 rounded-l-lg z-10 relative pt-3">
          <div 
            ref={(el) => pinRefs.current[`exec-input`] = el}
            className="pin-handle absolute -left-3 top-3 cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform"
            style={{ pointerEvents: 'auto', zIndex: 50 }}
            onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, clip.id, 'exec', false, true); }}
          >
            {renderExecutionPin('exec', false, isInputSnapTarget('exec'), hasInputConnection('exec'), '#3b82f6')}
          </div>
        </div>

        <div className="flex-1 flex flex-row relative h-full p-1">
          <div className="absolute top-2 left-2 pointer-events-none z-0">
            <span className="text-[9px] font-bold text-blue-500/50 tracking-wider">EXEC</span>
          </div>

          <div className="flex flex-col justify-center gap-1 pl-6 pr-4 py-4 min-w-[120px] z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-blue-600/5 rounded-md border border-blue-500/20">
                <Wand2 className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-bold text-gray-200 uppercase tracking-wide text-shadow-sm whitespace-nowrap overflow-hidden text-ellipsis select-none">{clip.name}</span>
            </div>
            <span className="text-[9px] text-gray-500 font-mono select-none">Cue Frame</span>
          </div>

          <div className="flex flex-1 gap-2 pr-2 py-1 items-stretch z-10">
            {renderSection('Context', 'bg-slate-500', 'border-slate-500', 'text-slate-500', contextFields)}
            {renderSection('Time', 'bg-indigo-500', 'border-indigo-500', 'text-indigo-500', timeFields)}
            {renderSection('Data', 'bg-blue-500', 'border-blue-500', 'text-blue-500', dataFields)}
          </div>
        </div>

        <div className="w-6 flex flex-col justify-center items-center bg-[#1a1d23] border-l border-white/5 rounded-r-lg relative">
          <div 
            ref={(el) => pinRefs.current[`execOut-output`] = el}
            className="pin-handle absolute -right-3 cursor-crosshair flex items-center justify-center w-6 h-6 hover:scale-110 transition-transform"
            style={{ pointerEvents: 'auto', zIndex: 50 }}
            onMouseDown={(e) => { e.stopPropagation(); onPinMouseDown(e, clip.id, 'execOut', true, true); }}
          >
            {renderExecutionPin('execOut', true, isOutputSnapTarget('execOut'), hasOutputConnection('execOut'), '#3b82f6')}
          </div>
        </div>
      </div>
    </div>
  );
}