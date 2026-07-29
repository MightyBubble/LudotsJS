import React, { useState, useRef } from "react";
import { Trash2, Zap, Tag, Wand2, Clapperboard, Layers } from "lucide-react";

export default function TimelineClip({ 
  clip, 
  scale, 
  trackIndex, 
  isSelected, 
  onSelect, 
  onDrag, 
  onResize,
  onDelete,
  onDragStart,
  onDragEnd,
  snapInterval = 100,
  onDiveIn
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(null);
  const dragStartRef = useRef({ x: 0, initialStartTime: 0, initialEndTime: 0 });

  const snapToGrid = (value) => {
    return Math.round(value / snapInterval) * snapInterval;
  };

  const left = clip.startTime * scale;
  const width = (clip.endTime - clip.startTime) * scale;
  const top = 60 + trackIndex * 80;

  const handleMouseDown = (e, type) => {
    e.stopPropagation();
    onSelect();

    if (type === 'move') {
      setIsDragging(true);
      dragStartRef.current = { 
        x: e.clientX,
        initialStartTime: clip.startTime,
        initialEndTime: clip.endTime
      };
      onDragStart?.();
    } else {
      setIsResizing(type);
      dragStartRef.current = { 
        x: e.clientX,
        initialStartTime: clip.startTime,
        initialEndTime: clip.endTime
      };
      onDragStart?.();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const totalDeltaX = e.clientX - dragStartRef.current.x;
      const deltaTime = totalDeltaX / scale;
      const rawStartTime = dragStartRef.current.initialStartTime + deltaTime;
      const newStartTime = Math.max(0, snapToGrid(rawStartTime));
      const duration = dragStartRef.current.initialEndTime - dragStartRef.current.initialStartTime;
      
      onDrag(clip.id, {
        startTime: newStartTime,
        endTime: newStartTime + duration
      });
    } else if (isResizing) {
      const totalDeltaX = e.clientX - dragStartRef.current.x;
      const deltaTime = totalDeltaX / scale;

      if (isResizing === 'left') {
        const rawStartTime = dragStartRef.current.initialStartTime + deltaTime;
        const newStartTime = Math.max(0, Math.min(
          dragStartRef.current.initialEndTime - snapInterval, 
          snapToGrid(rawStartTime)
        ));
        onResize(clip.id, isResizing, {
          startTime: newStartTime,
          duration: dragStartRef.current.initialEndTime - newStartTime
        });
      } else {
        const rawEndTime = dragStartRef.current.initialEndTime + deltaTime;
        const newEndTime = Math.max(
          dragStartRef.current.initialStartTime + snapInterval, 
          snapToGrid(rawEndTime)
        );
        onResize(clip.id, isResizing, {
          endTime: newEndTime,
          duration: newEndTime - dragStartRef.current.initialStartTime
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(null);
    onDragEnd?.();
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing]);

  // 根据类型选择颜色和图标
  const getClipStyle = () => {
    if (clip.type === 'effect_clip') {
      return {
        borderColor: '#8b5cf6',
        iconColor: 'text-violet-400',
        icon: <Zap className="w-3 h-3" />
      };
    } else if (clip.type === 'gameplay_tag_clip') {
      return {
        borderColor: '#ec4899',
        iconColor: 'text-pink-400',
        icon: <Tag className="w-3 h-3" />
      };
    } else if (clip.type === 'gameplay_cue_clip') {
      return {
        borderColor: '#3b82f6',
        iconColor: 'text-blue-400',
        icon: <Wand2 className="w-3 h-3" />
      };
    } else if (clip.type === 'montage_clip') {
      return {
        borderColor: '#78716c',
        iconColor: 'text-stone-400',
        icon: <Clapperboard className="w-3 h-3" />
      };
    } else if (clip.type === 'composite_clip') {
      return {
        borderColor: '#059669',
        iconColor: 'text-emerald-400',
        icon: <Layers className="w-3 h-3" />
      };
    }
    return {
      borderColor: '#8b5cf6',
      iconColor: 'text-violet-400',
      icon: null
    };
  };

  const clipStyle = getClipStyle();

  return (
    <div
      className={`absolute h-12 rounded cursor-move select-none group bg-[#1a1d23]/90 border-l-2 ${
        isSelected 
          ? 'border-t border-r border-b border-amber-500' 
          : 'border-t border-r border-b border-white/10 hover:border-white/20'
      }`}
      style={{
        left,
        width: Math.max(width, 50),
        top,
        borderLeftColor: clipStyle.borderColor,
        transition: 'none'
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (clip.type === 'composite_clip') {
            onDiveIn?.(clip.id);
        }
      }}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-cyan-400 opacity-0 group-hover:opacity-100"
        style={{ transition: 'opacity 0.2s' }}
        onMouseDown={(e) => handleMouseDown(e, 'left')}
      />

      {/* Clip content */}
      <div className="h-full px-2 flex items-center justify-between">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className={clipStyle.iconColor}>
             {clipStyle.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-gray-300 truncate uppercase tracking-wide">{clip.name}</div>
            <div className="text-[9px] text-gray-500 font-mono">
              {clip.duration}ms
            </div>
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 ml-1 p-1 hover:bg-white/10 rounded text-gray-500 hover:text-red-400"
          style={{ transition: 'opacity 0.2s' }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Right resize handle */}
      <div
        className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-cyan-400 opacity-0 group-hover:opacity-100"
        style={{ transition: 'opacity 0.2s' }}
        onMouseDown={(e) => handleMouseDown(e, 'right')}
      />
    </div>
  );
}