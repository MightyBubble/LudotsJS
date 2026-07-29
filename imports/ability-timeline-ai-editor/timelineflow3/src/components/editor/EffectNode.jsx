import React, { useState, useRef, useEffect } from "react";
import { Trash2, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function EffectNode({ 
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
      onPinPositionsUpdate?.(node.id, positions);
    };

    updatePinPositions();
  }, [node.position, node.id, onPinPositionsUpdate]);

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

  // Effect核心字段
  const contextFields = [
    { type: 'caster', label: 'Caster' },
    { type: 'target', label: 'Target' },
    { type: 'casterPos', label: 'CasterPos' },
    { type: 'targetPos', label: 'TargetPos' }
  ];

  const dataFields = [
    { type: 'duration', label: 'Duration', value: node.effectData?.duration || 0 },
    { type: 'magnitude', label: 'Magnitude', value: node.effectData?.magnitude || 0 },
    { type: 'stackCount', label: 'Stack', value: node.effectData?.stackCount || 1 }
  ];

  // 生命周期回调
  const lifecycleCallbacks = [
    { type: 'onTryAdd', label: 'OnTryAdd', color: '#64748b' },
    { type: 'onApplied', label: 'OnApplied', color: '#10b981' },
    { type: 'onTick', label: 'OnTick', color: '#3b82f6' },
    { type: 'onInterrupted', label: 'OnInterrupted', color: '#f59e0b' },
    { type: 'onTimeout', label: 'OnTimeout', color: '#8b5cf6' },
    { type: 'onRemoved', label: 'OnRemoved', color: '#ef4444' }
  ];

  const hasOutputConnection = (pinType) => {
    return node.connections?.[pinType]?.connectedTo;
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
        left: node.position.x,
        top: node.position.y,
        width: '260px',
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        transition: 'none'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="h-9 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-t px-3 flex items-center justify-between group">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-white" />
          <span className="text-xs font-medium text-white truncate">{node.name}</span>
        </div>
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

      {/* Content */}
      <div className="p-2 space-y-1">
        {/* Context Input Pins */}
        <div className="text-[9px] text-slate-500 mb-1 uppercase">上下文输入</div>
        {contextFields.map((field) => (
          <div key={field.type} className="flex items-center gap-2 h-7">
            <div 
              ref={(el) => pinRefs.current[`${field.type}-input`] = el}
              className="pin-handle relative flex-shrink-0 cursor-crosshair"
              style={{ width: '12px', height: '12px', pointerEvents: 'auto' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onPinMouseDown(e, node.id, field.type, false);
              }}
            >
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: isInputSnapTarget(field.type) ? '#fbbf24' : 'transparent',
                  borderColor: isInputSnapTarget(field.type) ? '#fbbf24' : '#64748b',
                  transform: isInputSnapTarget(field.type) ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: isInputSnapTarget(field.type) ? '0 0 8px #fbbf24' : 'none',
                  transition: 'transform 0.1s, box-shadow 0.1s'
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 flex-1">{field.label}</span>
          </div>
        ))}

        {/* Data Fields */}
        <div className="text-[9px] text-slate-500 mb-1 mt-2 uppercase">数据字段</div>
        {dataFields.map((field) => (
          <div key={field.type} className="flex items-center gap-2 h-8">
            <div 
              ref={(el) => pinRefs.current[`${field.type}-input`] = el}
              className="pin-handle relative flex-shrink-0 cursor-crosshair"
              style={{ width: '12px', height: '12px', pointerEvents: 'auto' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onPinMouseDown(e, node.id, field.type, false);
              }}
            >
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: isInputSnapTarget(field.type) ? '#fbbf24' : 'transparent',
                  borderColor: isInputSnapTarget(field.type) ? '#fbbf24' : '#64748b',
                  transform: isInputSnapTarget(field.type) ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: isInputSnapTarget(field.type) ? '0 0 8px #fbbf24' : 'none',
                  transition: 'transform 0.1s, box-shadow 0.1s'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-slate-400 mb-0.5 leading-none">{field.label}</div>
              <Input
                type="number"
                value={field.value}
                onChange={(e) => onPinValueChange(node.id, field.type, e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-5 text-[11px] bg-slate-900/50 border-slate-700 text-white px-2"
                style={{ pointerEvents: 'auto' }}
              />
            </div>
          </div>
        ))}

        {/* Lifecycle Callbacks */}
        <div className="text-[9px] text-slate-500 mb-1 mt-2 uppercase">生命周期回调</div>
        {lifecycleCallbacks.map((callback) => (
          <div key={callback.type} className="flex items-center gap-2 h-7">
            <span className="text-[10px] text-slate-400 flex-1">{callback.label}</span>
            <div 
              ref={(el) => pinRefs.current[`${callback.type}-output`] = el}
              className="pin-handle relative flex-shrink-0 cursor-crosshair"
              style={{ width: '12px', height: '12px', pointerEvents: 'auto' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onPinMouseDown(e, node.id, callback.type, true);
              }}
            >
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: hasOutputConnection(callback.type) ? callback.color : isOutputSnapTarget(callback.type) ? '#fbbf24' : 'transparent',
                  borderColor: hasOutputConnection(callback.type) ? callback.color : isOutputSnapTarget(callback.type) ? '#fbbf24' : '#64748b',
                  transform: isOutputSnapTarget(callback.type) ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: hasOutputConnection(callback.type) ? `0 0 6px ${callback.color}` : isOutputSnapTarget(callback.type) ? '0 0 8px #fbbf24' : 'none',
                  transition: 'transform 0.1s, box-shadow 0.1s'
                }}
              />
            </div>
          </div>
        ))}

        {/* Context Output Pins */}
        <div className="text-[9px] text-slate-500 mb-1 mt-2 uppercase">上下文输出</div>
        {contextFields.map((field) => (
          <div key={`${field.type}-out`} className="flex items-center gap-2 h-7">
            <span className="text-[10px] text-slate-400 flex-1">{field.label}</span>
            <div 
              ref={(el) => pinRefs.current[`${field.type}-output`] = el}
              className="pin-handle relative flex-shrink-0 cursor-crosshair"
              style={{ width: '12px', height: '12px', pointerEvents: 'auto' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                onPinMouseDown(e, node.id, field.type, true);
              }}
            >
              <div
                className="w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: hasOutputConnection(field.type) ? '#06b6d4' : isOutputSnapTarget(field.type) ? '#fbbf24' : 'transparent',
                  borderColor: hasOutputConnection(field.type) ? '#06b6d4' : isOutputSnapTarget(field.type) ? '#fbbf24' : '#64748b',
                  transform: isOutputSnapTarget(field.type) ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: hasOutputConnection(field.type) ? '0 0 6px #06b6d4' : isOutputSnapTarget(field.type) ? '0 0 8px #fbbf24' : 'none',
                  transition: 'transform 0.1s, box-shadow 0.1s'
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}