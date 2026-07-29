import React, { useState, useRef } from "react";
import { Trash2, Sparkles, Zap, Wand2 } from "lucide-react";

export default function TimelineEvent({ 
  event, 
  scale, 
  trackIndex, 
  isSelected, 
  onSelect, 
  onDrag,
  onDelete,
  onDragStart,
  onDragEnd,
  snapInterval = 100
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, initialStartTime: 0 });

  const snapToGrid = (value) => {
    return Math.round(value / snapInterval) * snapInterval;
  };

  const left = event.startTime * scale;
  const top = 60 + trackIndex * 80;

  const handleMouseDown = (e) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    dragStartRef.current = { 
      x: e.clientX,
      initialStartTime: event.startTime
    };
    onDragStart?.();
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const totalDeltaX = e.clientX - dragStartRef.current.x;
      const deltaTime = totalDeltaX / scale;
      const rawStartTime = dragStartRef.current.initialStartTime + deltaTime;
      const newStartTime = Math.max(0, snapToGrid(rawStartTime));
      
      onDrag(event.id, {
        startTime: newStartTime
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    onDragEnd?.();
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  // 根据类型选择颜色和图标
  const getEventStyle = () => {
    if (event.type === 'instant_effect_frame') {
      return {
        color: '#fbbf24',
        icon: <Sparkles className="w-3 h-3 text-black" />,
        label: '即时'
      };
    } else if (event.type === 'custom_event_frame') {
      return {
        color: '#06b6d4',
        icon: <Zap className="w-3 h-3 text-black" />,
        label: '事件'
      };
    } else if (event.type === 'gameplay_cue_frame') {
        return {
            color: '#3b82f6',
            icon: <Wand2 className="w-3 h-3 text-white" />,
            label: 'Cue'
        };
    }
    return {
      color: '#06b6d4',
      icon: <Zap className="w-3 h-3 text-black" />,
      label: ''
    };
  };

  const eventStyle = getEventStyle();

  return (
    <div
      className="absolute cursor-move select-none group"
      style={{
        left: left - 12,
        top: top + 8,
        width: '24px',
        height: '48px',
        transition: 'none'
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Event marker line */}
      <div
        className="absolute left-1/2 top-0 w-px h-full -translate-x-1/2 bg-white/20"
      />

      {/* Event icon */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded bg-[#1a1d23] border-2 flex items-center justify-center ${
          isSelected ? 'border-amber-500' : 'border-white/20 group-hover:border-white/40'
        }`}
        style={{
          borderColor: isSelected ? '#f59e0b' : eventStyle.color
        }}
      >
        {React.cloneElement(eventStyle.icon, { className: "w-3 h-3", style: { color: eventStyle.color } })}
      </div>

      {/* Event name tooltip */}
      <div className="absolute left-1/2 -translate-x-1/2 top-[-24px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
        <div className="bg-[#0f1116] border border-white/10 text-gray-300 text-xs px-2 py-1 rounded whitespace-nowrap shadow-xl">
          <div className="font-bold uppercase tracking-wide text-[10px] text-amber-500">{event.name}</div>
          <div className="text-[9px] text-gray-500 font-mono">{event.startTime}ms</div>
        </div>
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400"
        style={{ transition: 'opacity 0.2s' }}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}