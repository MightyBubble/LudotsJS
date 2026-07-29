import React, { useState, useRef, useEffect } from "react";
import TimelineClip from "./TimelineClip";
import TimelineEvent from "./TimelineEvent";
import TimelineRuler from "./TimelineRuler";
import { Zap, Tag, Sparkles, Zap as Lightning, Wand2, Clapperboard, Layers } from "lucide-react";

export default function TimelineView({ 
  clips, 
  events, 
  selectedClipId, 
  onSelectClip, 
  onUpdateClip, 
  onDeleteClip, 
  onDragStart, 
  onDragEnd,
  onAddNode,
  onDiveIn
}) {
  const [scale, setScale] = useState(0.1);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [snapInterval, setSnapInterval] = useState(100);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0, time: 0 });
  const containerRef = useRef(null);
  const rulerRef = useRef(null);

  // 根据缩放级别自动调整吸附间隔
  useEffect(() => {
    if (scale < 0.05) {
      setSnapInterval(1000);
    } else if (scale < 0.1) {
      setSnapInterval(500);
    } else if (scale < 0.2) {
      setSnapInterval(100);
    } else {
      setSnapInterval(50);
    }
  }, [scale]);

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.01, Math.min(1, prev * delta)));
    } else {
      setScrollLeft(prev => Math.max(0, prev + e.deltaY));
    }
  };

  const handleRulerWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.01, Math.min(1, prev * delta)));
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + (containerRef.current.querySelector('.overflow-auto')?.scrollLeft || 0);
    const time = Math.round(x / scale);
    
    setContextMenuPosition({ 
      x: e.clientX, 
      y: e.clientY, 
      time: time 
    });
    setContextMenuVisible(true);
  };

  const handleAddNode = (nodeType) => {
    if (onAddNode && contextMenuPosition) {
      onAddNode(nodeType, contextMenuPosition.time);
    }
    setContextMenuVisible(false);
  };

  useEffect(() => {
    const handleClick = () => {
      if (contextMenuVisible) {
        setContextMenuVisible(false);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenuVisible]);

  const allItems = [...clips, ...events];
  const maxTime = Math.max(...allItems.map(item => {
    if (item.endTime !== undefined) return item.endTime;
    return item.startTime;
  }), 10000);
  const timelineWidth = maxTime * scale + 500;
  
  // Grid step size matching TimelineRuler
  const step = scale < 0.05 ? 5000 : scale < 0.1 ? 2000 : 1000;

  const handleClipDrag = (clipId, updates) => {
    onUpdateClip(clipId, updates);
  };

  const handleClipResize = (clipId, edge, updates) => {
    onUpdateClip(clipId, updates);
  };

  return (
    <div className="flex-1 bg-[#0b0d12] border-r border-white/5 flex flex-col overflow-hidden relative">
      <div className="h-8 bg-[#0b0d12] border-b border-white/5 flex items-center px-4 justify-between select-none z-20">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-amber-600/50" />
           <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Timeline Sequencer</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-sm bg-gray-700" />
             <span className="text-[9px] text-gray-600 font-mono uppercase">Snap: {snapInterval}ms</span>
          </div>
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 rounded-sm bg-gray-700" />
             <span className="text-[9px] text-gray-600 font-mono uppercase">Scale: {Math.round(scale * 100)}%</span>
          </div>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative bg-[#0f1116]"
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
        style={{ cursor: 'default' }}
      >
        <div className="absolute inset-0 overflow-auto" style={{ scrollBehavior: 'auto' }}>
          <div 
            style={{ 
              width: timelineWidth, 
              minHeight: '100%',
              backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: `${step * scale}px 100%`
            }}
          >
            <div ref={rulerRef} onWheel={handleRulerWheel}>
              <TimelineRuler maxTime={maxTime} scale={scale} />
            </div>

            <div className="relative h-full pt-4">
              {clips.map((clip, index) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  scale={scale}
                  trackIndex={index}
                  isSelected={clip.id === selectedClipId}
                  onSelect={() => onSelectClip(clip.id)}
                  onDrag={handleClipDrag}
                  onResize={handleClipResize}
                  onDelete={() => onDeleteClip(clip.id)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  snapInterval={snapInterval}
                  onDiveIn={onDiveIn}
                />
              ))}
              
              {events.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  scale={scale}
                  trackIndex={clips.length + index}
                  isSelected={event.id === selectedClipId}
                  onSelect={() => onSelectClip(event.id)}
                  onDrag={handleClipDrag}
                  onDelete={() => onDeleteClip(event.id)}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  snapInterval={snapInterval}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Custom Context Menu */}
        {contextMenuVisible && (
          <div
            className="fixed bg-[#15171c] border border-white/10 rounded-md shadow-2xl py-1 z-50"
            style={{
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              minWidth: '200px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Clips</div>
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('effect_clip')}
            >
              <Zap className="w-3 h-3 text-violet-400" />
              <span className="font-medium">Effect Clip</span>
            </div>
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('gameplay_tag_clip')}
            >
              <Tag className="w-3 h-3 text-pink-400" />
              <span className="font-medium">Gameplay Tag Clip</span>
            </div>
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('gameplay_cue_clip')}
            >
              <Wand2 className="w-3 h-3 text-blue-400" />
              <span className="font-medium">Gameplay Cue Clip</span>
            </div>
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('montage_clip')}
            >
              <Clapperboard className="w-3 h-3 text-stone-400" />
              <span className="font-medium">Montage Clip</span>
            </div>
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('composite_clip')}
            >
              <Layers className="w-3 h-3 text-emerald-400" />
              <span className="font-medium">Composite Clip</span>
            </div>
            
            <div className="border-t border-white/5 my-1"></div>
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Frames</div>
            
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('instant_effect_frame')}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span className="font-medium">Instant Effect Frame</span>
            </div>
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('custom_event_frame')}
            >
              <Lightning className="w-3 h-3 text-cyan-400" />
              <span className="font-medium">Custom Event Frame</span>
            </div>
            <div
              className="px-3 py-2 text-gray-400 hover:bg-white/5 hover:text-amber-500 cursor-pointer flex items-center gap-2 text-xs transition-colors"
              onClick={() => handleAddNode('gameplay_cue_frame')}
            >
              <Wand2 className="w-3 h-3 text-blue-400" />
              <span className="font-medium">Gameplay Cue Frame</span>
            </div>
            
            <div className="border-t border-white/5 my-1"></div>
            <div className="px-3 py-1 text-[10px] text-gray-600 font-mono">
              TIME: {contextMenuPosition.time}ms
            </div>
          </div>
        )}
      </div>
    </div>
  );
}