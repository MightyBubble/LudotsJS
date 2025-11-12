import React, { useEffect, useRef, useState, useMemo } from "react";
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GraphView({ tags, onSelectTag, selectedTag, categories }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [layoutType, setLayoutType] = useState('hierarchical'); // 'hierarchical' or 'tree'

  // 获取分类颜色
  const getCategoryColor = (categoryKey) => {
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  // 构建层级结构（学习 React Flow 的层级布局）
  const hierarchicalLayout = useMemo(() => {
    if (!tags || tags.length === 0) return { nodes: [], edges: [] };

    // 按深度分组
    const levelGroups = {};
    tags.forEach(tag => {
      const level = tag.depth || 0;
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(tag);
    });

    const maxLevel = Math.max(...Object.keys(levelGroups).map(Number));
    const nodes = [];
    const edges = [];

    // 计算每层的布局
    Object.keys(levelGroups).forEach(level => {
      const levelTags = levelGroups[level];
      const levelNum = parseInt(level);
      
      // 水平间距
      const horizontalSpacing = 200;
      const verticalSpacing = 120;
      
      // 计算该层的起始 X 坐标（居中）
      const totalWidth = (levelTags.length - 1) * horizontalSpacing;
      const startX = 400 - totalWidth / 2;
      
      levelTags.forEach((tag, index) => {
        const x = startX + index * horizontalSpacing;
        const y = 100 + levelNum * verticalSpacing;
        
        nodes.push({
          id: tag.id,
          tag: tag,
          x: x,
          y: y,
          width: 160,
          height: 60
        });

        // 创建边
        if (tag.parent_path) {
          const parent = tags.find(t => t.full_path === tag.parent_path);
          if (parent) {
            edges.push({
              source: parent.id,
              target: tag.id
            });
          }
        }
      });
    });

    return { nodes, edges };
  }, [tags]);

  // 树形布局（更紧凑）
  const treeLayout = useMemo(() => {
    if (!tags || tags.length === 0) return { nodes: [], edges: [] };

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    // 构建树结构
    const roots = tags.filter(t => !t.parent_path || t.parent_path === '');
    
    // 计算每个节点的子节点数（用于分配空间）
    const getSubtreeWidth = (tag) => {
      const children = tags.filter(t => t.parent_path === tag.full_path);
      if (children.length === 0) return 1;
      return children.reduce((sum, child) => sum + getSubtreeWidth(child), 0);
    };

    // 递归布局
    const layoutNode = (tag, x, y, availableWidth) => {
      nodes.push({
        id: tag.id,
        tag: tag,
        x: x,
        y: y,
        width: 140,
        height: 50
      });

      nodeMap.set(tag.id, { x, y });

      const children = tags.filter(t => t.parent_path === tag.full_path);
      if (children.length === 0) return;

      // 计算子节点布局
      const childY = y + 100;
      let currentX = x - availableWidth / 2;

      children.forEach(child => {
        const childWidth = getSubtreeWidth(child);
        const childSpace = (availableWidth * childWidth) / children.reduce((sum, c) => sum + getSubtreeWidth(c), 0);
        const childX = currentX + childSpace / 2;

        // 创建边
        edges.push({
          source: tag.id,
          target: child.id
        });

        layoutNode(child, childX, childY, childSpace * 0.9);
        currentX += childSpace;
      });
    };

    // 布局根节点
    const rootSpacing = 300;
    roots.forEach((root, index) => {
      const rootX = 400 + (index - roots.length / 2 + 0.5) * rootSpacing;
      layoutNode(root, rootX, 80, 280);
    });

    return { nodes, edges };
  }, [tags]);

  const layout = layoutType === 'hierarchical' ? hierarchicalLayout : treeLayout;

  // 绘制（学习 React Flow 的渲染风格）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layout.nodes.length) return;

    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x + canvas.width / 2, offset.y + canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-400, -400);

    // 绘制网格背景（学习 React Flow 的网格）
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1;
    const gridSize = 20;
    const startX = Math.floor((-offset.x / scale - canvas.width / 2) / gridSize) * gridSize;
    const startY = Math.floor((-offset.y / scale - canvas.height / 2) / gridSize) * gridSize;
    const endX = startX + canvas.width / scale + gridSize * 2;
    const endY = startY + canvas.height / scale + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // 绘制边（平滑曲线，学习 React Flow 的贝塞尔曲线）
    layout.edges.forEach(edge => {
      const sourceNode = layout.nodes.find(n => n.id === edge.source);
      const targetNode = layout.nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const startX = sourceNode.x;
      const startY = sourceNode.y + sourceNode.height / 2;
      const endX = targetNode.x;
      const endY = targetNode.y - targetNode.height / 2;

      // 贝塞尔曲线控制点
      const cp1y = startY + (endY - startY) * 0.5;
      const cp2y = endY - (endY - startY) * 0.5;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(startX, cp1y, endX, cp2y, endX, endY);
      ctx.strokeStyle = '#4a4a4a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 箭头
      const arrowSize = 8;
      ctx.fillStyle = '#4a4a4a';
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - arrowSize / 2, endY - arrowSize);
      ctx.lineTo(endX + arrowSize / 2, endY - arrowSize);
      ctx.closePath();
      ctx.fill();
    });

    // 绘制节点（圆角矩形，学习 React Flow 的节点样式）
    layout.nodes.forEach(node => {
      const isSelected = selectedTag?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      
      const x = node.x - node.width / 2;
      const y = node.y - node.height / 2;
      const radius = 8;

      // 阴影
      if (isHovered || isSelected) {
        ctx.shadowColor = 'rgba(14, 99, 156, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
      }

      // 节点背景
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + node.width - radius, y);
      ctx.quadraticCurveTo(x + node.width, y, x + node.width, y + radius);
      ctx.lineTo(x + node.width, y + node.height - radius);
      ctx.quadraticCurveTo(x + node.width, y + node.height, x + node.width - radius, y + node.height);
      ctx.lineTo(x + radius, y + node.height);
      ctx.quadraticCurveTo(x, y + node.height, x, y + node.height - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      ctx.fillStyle = isSelected ? '#094771' : '#252526';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 边框
      ctx.strokeStyle = isSelected ? '#0e639c' : isHovered ? '#3d3d3d' : '#2d2d2d';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // 分类色条
      const categoryColor = getCategoryColor(node.tag.category_key);
      ctx.fillStyle = categoryColor;
      ctx.fillRect(x, y, 4, node.height);

      // 节点文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = node.tag.name;
      const maxWidth = node.width - 20;
      let displayText = text;
      
      // 文字截断
      if (ctx.measureText(text).width > maxWidth) {
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        displayText = truncated + '...';
      }
      
      ctx.fillText(displayText, node.x, node.y - 8);

      // 子标题
      ctx.fillStyle = '#888888';
      ctx.font = '10px sans-serif';
      const depth = `Level ${node.tag.depth}`;
      ctx.fillText(depth, node.x, node.y + 8);

      // 锁定图标
      if (node.tag.is_locked) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = '12px sans-serif';
        ctx.fillText('🔒', x + node.width - 15, y + 15);
      }
    });

    ctx.restore();
  }, [layout, scale, offset, selectedTag, hoveredNode, categories]);

  // 鼠标交互
  const getNodeAtPosition = (x, y) => {
    const canvas = canvasRef.current;
    const canvasX = (x - canvas.width / 2 - offset.x) / scale + 400;
    const canvasY = (y - canvas.height / 2 - offset.y) / scale + 400;

    return layout.nodes.find(node => {
      const nodeX = node.x - node.width / 2;
      const nodeY = node.y - node.height / 2;
      return canvasX >= nodeX && canvasX <= nodeX + node.width &&
             canvasY >= nodeY && canvasY <= nodeY + node.height;
    });
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = getNodeAtPosition(x, y);

    if (clickedNode) {
      onSelectTag(clickedNode.tag);
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hoveredNode = getNodeAtPosition(x, y);
    setHoveredNode(hoveredNode || null);

    if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.3), 2));
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const zoomToFit = () => {
    if (!layout.nodes.length) return;

    const minX = Math.min(...layout.nodes.map(n => n.x - n.width / 2));
    const maxX = Math.max(...layout.nodes.map(n => n.x + n.width / 2));
    const minY = Math.min(...layout.nodes.map(n => n.y - n.height / 2));
    const maxY = Math.max(...layout.nodes.map(n => n.y + n.height / 2));

    const width = maxX - minX;
    const height = maxY - minY;

    const canvas = canvasRef.current;
    const scaleX = (canvas.width * 0.8) / width;
    const scaleY = (canvas.height * 0.8) / height;
    const newScale = Math.min(scaleX, scaleY, 1);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setScale(newScale);
    setOffset({
      x: (canvas.width / 2 - centerX * newScale),
      y: (canvas.height / 2 - centerY * newScale)
    });
  };

  useEffect(() => {
    // 初始化时自动适配
    if (layout.nodes.length > 0) {
      setTimeout(zoomToFit, 100);
    }
  }, [layout.nodes.length]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#1e1e1e]">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isDraggingCanvas ? 'cursor-grabbing' : hoveredNode ? 'cursor-pointer' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* 控制面板 */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded p-1 flex flex-col gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale(s => Math.min(s * 1.2, 2))}
            className="h-8 w-8 p-0 hover:bg-[#3d3d3d] text-gray-200"
            title="放大"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setScale(s => Math.max(s * 0.8, 0.3))}
            className="h-8 w-8 p-0 hover:bg-[#3d3d3d] text-gray-200"
            title="缩小"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={zoomToFit}
            className="h-8 w-8 p-0 hover:bg-[#3d3d3d] text-gray-200"
            title="适配视图"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* 布局切换 */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded p-1 flex flex-col gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLayoutType('hierarchical')}
            className={`h-8 w-8 p-0 hover:bg-[#3d3d3d] ${layoutType === 'hierarchical' ? 'bg-[#0e639c] text-white' : 'text-gray-200'}`}
            title="层级布局"
          >
            <Layers className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLayoutType('tree')}
            className={`h-8 w-8 p-0 hover:bg-[#3d3d3d] ${layoutType === 'tree' ? 'bg-[#0e639c] text-white' : 'text-gray-200'}`}
            title="树形布局"
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 提示信息 */}
      <div className="absolute bottom-4 left-4 bg-[#2d2d2d] border border-[#3d3d3d] rounded p-3 text-xs text-gray-400 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="font-semibold text-white">图形视图</span>
        </div>
        <div className="space-y-1">
          <div>• 点击节点查看详情</div>
          <div>• 拖动空白处移动视图</div>
          <div>• 滚轮缩放</div>
          <div>• 彩色条表示分类</div>
        </div>
        {hoveredNode && (
          <div className="mt-2 pt-2 border-t border-[#3d3d3d]">
            <div className="font-semibold text-white">{hoveredNode.tag.name}</div>
            <div className="text-gray-500 font-mono text-xs">{hoveredNode.tag.full_path}</div>
          </div>
        )}
      </div>

      {/* 缩放比例 */}
      <div className="absolute bottom-4 right-4 bg-[#2d2d2d] border border-[#3d3d3d] rounded px-3 py-1 text-xs text-gray-400">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}