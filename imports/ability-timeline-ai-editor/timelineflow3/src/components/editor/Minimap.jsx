import React, { useRef, useState } from "react";

export default function Minimap({ 
  clips, 
  canvasWidth,
  canvasHeight,
  scale,
  offset,
  onNavigate
}) {
  const [isDragging, setIsDragging] = useState(false);
  const minimapRef = useRef(null);
  
  const MINIMAP_WIDTH = 200;
  const MINIMAP_HEIGHT = 150;
  const PADDING = 10;

  // 计算所有节点的边界
  const getBounds = () => {
    if (clips.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    clips.forEach(clip => {
      const x = clip.nodePosition.x;
      const y = clip.nodePosition.y;
      const width = 224;
      const height = 100;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    // 添加一些padding
    const paddingAmount = 100;
    return {
      minX: minX - paddingAmount,
      minY: minY - paddingAmount,
      maxX: maxX + paddingAmount,
      maxY: maxY + paddingAmount
    };
  };

  const bounds = getBounds();
  const worldWidth = bounds.maxX - bounds.minX;
  const worldHeight = bounds.maxY - bounds.minY;

  // 计算minimap的缩放比例
  const scaleX = (MINIMAP_WIDTH - PADDING * 2) / worldWidth;
  const scaleY = (MINIMAP_HEIGHT - PADDING * 2) / worldHeight;
  const minimapScale = Math.min(scaleX, scaleY);

  // 将世界坐标转换为minimap坐标
  const worldToMinimap = (x, y) => {
    return {
      x: (x - bounds.minX) * minimapScale + PADDING,
      y: (y - bounds.minY) * minimapScale + PADDING
    };
  };

  // 将minimap坐标转换为世界坐标
  const minimapToWorld = (x, y) => {
    return {
      x: (x - PADDING) / minimapScale + bounds.minX,
      y: (y - PADDING) / minimapScale + bounds.minY
    };
  };

  // 计算当前视口在minimap中的位置和大小
  const viewportInWorld = {
    x: -offset.x / scale,
    y: -offset.y / scale,
    width: canvasWidth / scale,
    height: canvasHeight / scale
  };

  const viewportInMinimap = {
    x: (viewportInWorld.x - bounds.minX) * minimapScale + PADDING,
    y: (viewportInWorld.y - bounds.minY) * minimapScale + PADDING,
    width: viewportInWorld.width * minimapScale,
    height: viewportInWorld.height * minimapScale
  };

  const handleMouseDown = (e) => {
    if (!minimapRef.current) return;
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = (e) => {
    if (!minimapRef.current) return;
    
    const rect = minimapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 转换为世界坐标
    const worldPos = minimapToWorld(x, y);
    
    // 居中显示
    const newOffset = {
      x: -worldPos.x * scale + canvasWidth / 2,
      y: -worldPos.y * scale + canvasHeight / 2
    };
    
    onNavigate(newOffset);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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

  return (
    <div
      ref={minimapRef}
      className="absolute bottom-4 right-4 bg-[#0f172a]/90 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl overflow-hidden"
      style={{
        width: MINIMAP_WIDTH,
        height: MINIMAP_HEIGHT,
        cursor: isDragging ? 'grabbing' : 'pointer',
        zIndex: 50
      }}
      onMouseDown={handleMouseDown}
    >
      <svg width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT}>
        {/* 网格背景 */}
        <defs>
          <pattern id="minimapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="#1e293b" />
          </pattern>
        </defs>
        <rect width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} fill="url(#minimapGrid)" />

        {/* 节点 */}
        {clips.map(clip => {
          const pos = worldToMinimap(clip.nodePosition.x, clip.nodePosition.y);
          const width = 224 * minimapScale;
          const height = 100 * minimapScale;
          
          return (
            <rect
              key={clip.id}
              x={pos.x}
              y={pos.y}
              width={width}
              height={height}
              rx="2"
              fill="#6366f1"
              opacity="0.7"
              stroke="#8b5cf6"
              strokeWidth="1"
            />
          );
        })}

        {/* 视口矩形 */}
        <rect
          x={Math.max(0, Math.min(MINIMAP_WIDTH, viewportInMinimap.x))}
          y={Math.max(0, Math.min(MINIMAP_HEIGHT, viewportInMinimap.y))}
          width={Math.min(MINIMAP_WIDTH, viewportInMinimap.width)}
          height={Math.min(MINIMAP_HEIGHT, viewportInMinimap.height)}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          opacity="0.8"
          rx="2"
        />
        
        {/* 视口填充 */}
        <rect
          x={Math.max(0, Math.min(MINIMAP_WIDTH, viewportInMinimap.x))}
          y={Math.max(0, Math.min(MINIMAP_HEIGHT, viewportInMinimap.y))}
          width={Math.min(MINIMAP_WIDTH, viewportInMinimap.width)}
          height={Math.min(MINIMAP_HEIGHT, viewportInMinimap.height)}
          fill="#06b6d4"
          opacity="0.1"
          rx="2"
        />
      </svg>
    </div>
  );
}