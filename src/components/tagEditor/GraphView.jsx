import React, { useEffect, useRef, useState, useMemo } from "react";
import { ZoomIn, ZoomOut, Maximize2, Play, Pause, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function GraphView({ tags, onSelectTag, selectedTag, categories }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [isSimulating, setIsSimulating] = useState(true);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // 关系过滤选项
  const [relationFilters, setRelationFilters] = useState({
    hierarchy: true,     // 父子关系
    required: true,      // 必需关系
    blocked: true,       // 阻止关系
    attached: false,     // 附加关系
    removed: false,      // 移除关系
    disabled_if: false,  // 禁用条件
    remove_if: false,    // 移除条件
  });
  
  // 力学模拟参数
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // 获取分类颜色
  const getCategoryColor = (categoryKey) => {
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  // 初始化节点和边
  useEffect(() => {
    if (!tags || tags.length === 0) return;

    // 初始化节点位置（随机分布）
    const initialNodes = tags.map(tag => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 200;
      return {
        id: tag.id,
        tag: tag,
        x: 400 + Math.cos(angle) * radius,
        y: 400 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        width: 140,
        height: 40,
        mass: 1
      };
    });

    // 初始化边
    const initialEdges = [];
    tags.forEach(tag => {
      // 父子关系
      if (tag.parent_path) {
        const parent = tags.find(t => t.full_path === tag.parent_path);
        if (parent) {
          initialEdges.push({
            source: parent.id,
            target: tag.id,
            type: 'hierarchy'
          });
        }
      }

      // 必需关系
      if (tag.required_tags) {
        tag.required_tags.forEach(reqPath => {
          const reqTag = tags.find(t => t.full_path === reqPath);
          if (reqTag) {
            initialEdges.push({
              source: tag.id,
              target: reqTag.id,
              type: 'required'
            });
          }
        });
      }

      // 阻止关系
      if (tag.blocked_tags) {
        tag.blocked_tags.forEach(blockPath => {
          const blockTag = tags.find(t => t.full_path === blockPath);
          if (blockTag) {
            initialEdges.push({
              source: tag.id,
              target: blockTag.id,
              type: 'blocked'
            });
          }
        });
      }

      // 附加关系
      if (tag.attached_tags) {
        tag.attached_tags.forEach(attachPath => {
          const attachTag = tags.find(t => t.full_path === attachPath);
          if (attachTag) {
            initialEdges.push({
              source: tag.id,
              target: attachTag.id,
              type: 'attached'
            });
          }
        });
      }

      // 移除关系
      if (tag.removed_tags) {
        tag.removed_tags.forEach(removePath => {
          const removeTag = tags.find(t => t.full_path === removePath);
          if (removeTag) {
            initialEdges.push({
              source: tag.id,
              target: removeTag.id,
              type: 'removed'
            });
          }
        });
      }

      // 禁用条件关系
      if (tag.disabled_if_tags && tag.disabled_if_tags.tags) {
        tag.disabled_if_tags.tags.forEach(disabledPath => {
          const disabledTag = tags.find(t => t.full_path === disabledPath);
          if (disabledTag) {
            initialEdges.push({
              source: tag.id,
              target: disabledTag.id,
              type: 'disabled_if'
            });
          }
        });
      }

      // 移除条件关系
      if (tag.remove_if_tags && tag.remove_if_tags.tags) {
        tag.remove_if_tags.tags.forEach(removeIfPath => {
          const removeIfTag = tags.find(t => t.full_path === removeIfPath);
          if (removeIfTag) {
            initialEdges.push({
              source: tag.id,
              target: removeIfTag.id,
              type: 'remove_if'
            });
          }
        });
      }
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [tags]);

  // 过滤后的边
  const filteredEdges = useMemo(() => {
    return edges.filter(edge => relationFilters[edge.type]);
  }, [edges, relationFilters]);

  // 力学模拟
  useEffect(() => {
    if (!isSimulating || nodes.length === 0) return;

    const simulate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node }));

        // 1. 斥力（节点之间互相排斥）
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x - newNodes[i].x;
            const dy = newNodes[j].y - newNodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 1) continue;

            // 库仑斥力：F = k / r^2
            const repelForce = 8000 / (distance * distance);
            const fx = (dx / distance) * repelForce;
            const fy = (dy / distance) * repelForce;

            newNodes[i].vx -= fx;
            newNodes[i].vy -= fy;
            newNodes[j].vx += fx;
            newNodes[j].vy += fy;
          }
        }

        // 2. 引力（连接的节点之间有弹簧引力）
        filteredEdges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 1) return;

          // 理想距离
          const idealDistance = edge.type === 'hierarchy' ? 150 : 100;
          
          // 胡克定律：F = k * (x - x0)
          const springForce = 0.01 * (distance - idealDistance);
          const fx = (dx / distance) * springForce;
          const fy = (dy / distance) * springForce;

          source.vx += fx;
          source.vy += fy;
          target.vx -= fx;
          target.vy -= fy;
        });

        // 3. 向中心的引力（防止节点飘走）
        newNodes.forEach(node => {
          const dx = 400 - node.x;
          const dy = 400 - node.y;
          node.vx += dx * 0.001;
          node.vy += dy * 0.001;
        });

        // 4. 更新位置，应用阻尼
        const damping = 0.85;
        newNodes.forEach(node => {
          if (draggedNode?.id === node.id) return; // 被拖动的节点不更新

          node.vx *= damping;
          node.vy *= damping;

          // 限制最大速度
          const maxSpeed = 10;
          const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
          if (speed > maxSpeed) {
            node.vx = (node.vx / speed) * maxSpeed;
            node.vy = (node.vy / speed) * maxSpeed;
          }

          node.x += node.vx;
          node.y += node.vy;
        });

        return newNodes;
      });

      animationFrameRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSimulating, nodes.length, filteredEdges, draggedNode]);

  // 绘制箭头的通用函数
  const drawArrow = (ctx, fromX, fromY, toX, toY, color, scale) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    const arrowSize = 10 / scale;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle - Math.PI / 6),
      toY - arrowSize * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - arrowSize * Math.cos(angle + Math.PI / 6),
      toY - arrowSize * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // 绘制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x + canvas.width / 2, offset.y + canvas.height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-400, -400);

    // 绘制无限网格背景
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1 / scale;
    const gridSize = 20;
    
    // 计算当前可见区域
    const viewX = (- offset.x - canvas.width / 2) / scale + 400;
    const viewY = (- offset.y - canvas.height / 2) / scale + 400;
    const viewWidth = canvas.width / scale;
    const viewHeight = canvas.height / scale;
    
    const startX = Math.floor((viewX) / gridSize) * gridSize;
    const startY = Math.floor((viewY) / gridSize) * gridSize;
    const endX = startX + viewWidth + gridSize;
    const endY = startY + viewHeight + gridSize;

    // 绘制垂直线
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // 绘制边
    filteredEdges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      // 计算连线的起点和终点（考虑节点大小，避免箭头被节点覆盖）
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 1) return;
      
      // 缩短连线，使其不进入节点内部
      const sourceRadius = sourceNode.height / 2;
      const targetRadius = targetNode.height / 2;
      const shortenStart = sourceRadius + 5;
      const shortenEnd = targetRadius + 5;
      
      const startX = sourceNode.x + (dx / distance) * shortenStart;
      const startY = sourceNode.y + (dy / distance) * shortenStart;
      const endX = targetNode.x - (dx / distance) * shortenEnd;
      const endY = targetNode.y - (dy / distance) * shortenEnd;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);

      // 根据类型设置样式
      let edgeColor;
      if (edge.type === 'hierarchy') {
        edgeColor = '#4a4a4a';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2.5 / scale;
        ctx.setLineDash([]);
      } else if (edge.type === 'required') {
        edgeColor = '#4ade80';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([6 / scale, 4 / scale]);
      } else if (edge.type === 'blocked') {
        edgeColor = '#f87171';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([6 / scale, 4 / scale]);
      } else if (edge.type === 'attached') {
        edgeColor = '#60a5fa';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([6 / scale, 4 / scale]);
      } else if (edge.type === 'removed') {
        edgeColor = '#fb923c';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([6 / scale, 4 / scale]);
      } else if (edge.type === 'disabled_if') {
        edgeColor = '#fbbf24';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([3 / scale, 3 / scale]);
      } else if (edge.type === 'remove_if') {
        edgeColor = '#a78bfa';
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([3 / scale, 3 / scale]);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);

      // 绘制箭头（所有类型的边都显示箭头）
      drawArrow(ctx, startX, startY, endX, endY, edgeColor, scale);
    });

    // 绘制节点（胶囊/标签形状）
    nodes.forEach(node => {
      const isSelected = selectedTag?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isDragged = draggedNode?.id === node.id;
      
      const x = node.x - node.width / 2;
      const y = node.y - node.height / 2;
      const radius = node.height / 2; // 两端半圆

      // 阴影
      if (isHovered || isSelected || isDragged) {
        ctx.shadowColor = 'rgba(14, 99, 156, 0.5)';
        ctx.shadowBlur = 15 / scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4 / scale;
      }

      // 绘制胶囊形状
      ctx.beginPath();
      // 左半圆
      ctx.arc(x + radius, y + radius, radius, Math.PI / 2, Math.PI * 3 / 2);
      // 上边
      ctx.lineTo(x + node.width - radius, y);
      // 右半圆
      ctx.arc(x + node.width - radius, y + radius, radius, Math.PI * 3 / 2, Math.PI / 2);
      // 下边
      ctx.lineTo(x + radius, y + node.height);
      ctx.closePath();

      // 白底
      ctx.fillStyle = isSelected ? '#e0f2fe' : '#ffffff';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // 边框
      ctx.strokeStyle = isSelected ? '#0e639c' : isHovered || isDragged ? '#3d3d3d' : '#cccccc';
      ctx.lineWidth = (isSelected ? 3 : 1.5) / scale;
      ctx.stroke();

      // 分类色条（左侧半圆部分）
      const categoryColor = getCategoryColor(node.tag.category_key);
      ctx.fillStyle = categoryColor;
      ctx.beginPath();
      ctx.arc(x + radius, y + radius, radius - 2 / scale, Math.PI / 2, Math.PI * 3 / 2);
      ctx.lineTo(x + radius, y + node.height - 2 / scale);
      ctx.closePath();
      ctx.fill();

      // 节点文字（黑色）
      ctx.fillStyle = '#000000';
      ctx.font = `bold ${12 / scale}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = node.tag.name;
      const maxWidth = node.width - 30;
      let displayText = text;
      
      if (ctx.measureText(text).width > maxWidth) {
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        displayText = truncated + '...';
      }
      
      ctx.fillText(displayText, node.x, node.y);

      // 锁定图标
      if (node.tag.is_locked) {
        ctx.fillStyle = '#ff6b6b';
        ctx.font = `${12 / scale}px sans-serif`;
        ctx.fillText('🔒', x + node.width - 10 / scale, y + 10 / scale);
      }
    });

    ctx.restore();
  }, [nodes, filteredEdges, scale, offset, selectedTag, hoveredNode, draggedNode, categories]);

  // 鼠标交互
  const getNodeAtPosition = (x, y) => {
    const canvas = canvasRef.current;
    const canvasX = (x - canvas.width / 2 - offset.x) / scale + 400;
    const canvasY = (y - canvas.height / 2 - offset.y) / scale + 400;

    return nodes.find(node => {
      const dx = canvasX - node.x;
      const dy = canvasY - node.y;
      
      // 胶囊形状碰撞检测
      const halfWidth = node.width / 2;
      const halfHeight = node.height / 2;
      
      // 中间矩形区域
      if (Math.abs(dx) <= halfWidth - halfHeight && Math.abs(dy) <= halfHeight) {
        return true;
      }
      
      // 左半圆
      if (dx < -(halfWidth - halfHeight)) {
        const circleX = node.x - (halfWidth - halfHeight);
        const dist = Math.sqrt((canvasX - circleX) ** 2 + (canvasY - node.y) ** 2);
        return dist <= halfHeight;
      }
      
      // 右半圆
      if (dx > (halfWidth - halfHeight)) {
        const circleX = node.x + (halfWidth - halfHeight);
        const dist = Math.sqrt((canvasX - circleX) ** 2 + (canvasY - node.y) ** 2);
        return dist <= halfHeight;
      }
      
      return false;
    });
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedNode = getNodeAtPosition(x, y);

    if (e.button === 2) {
      // 右键：拖动画布
      e.preventDefault();
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (e.button === 0) {
      // 左键：选中或拖动节点
      if (clickedNode) {
        setDraggedNode(clickedNode);
        onSelectTag(clickedNode.tag);
      }
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggedNode) {
      const canvasX = (x - canvas.width / 2 - offset.x) / scale + 400;
      const canvasY = (y - canvas.height / 2 - offset.y) / scale + 400;
      
      setNodes(prev => prev.map(node => 
        node.id === draggedNode.id 
          ? { ...node, x: canvasX, y: canvasY, vx: 0, vy: 0 }
          : node
      ));
    } else if (isDraggingCanvas) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    } else {
      const hoveredNode = getNodeAtPosition(x, y);
      setHoveredNode(hoveredNode || null);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggedNode(null);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.3), 2));
  };

  const resetSimulation = () => {
    // 重新随机初始化位置
    setNodes(prev => prev.map(node => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 200;
      return {
        ...node,
        x: 400 + Math.cos(angle) * radius,
        y: 400 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0
      };
    }));
    setIsSimulating(true);
  };

  const zoomToFit = () => {
    if (nodes.length === 0) return;

    const minX = Math.min(...nodes.map(n => n.x - n.width / 2));
    const maxX = Math.max(...nodes.map(n => n.x + n.width / 2));
    const minY = Math.min(...nodes.map(n => n.y - n.height / 2));
    const maxY = Math.max(...nodes.map(n => n.y + n.height / 2));

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

  const toggleFilter = (filterKey) => {
    setRelationFilters(prev => ({
      ...prev,
      [filterKey]: !prev[filterKey]
    }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#1e1e1e]">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${
          draggedNode ? 'cursor-grabbing' : 
          isDraggingCanvas ? 'cursor-grabbing' : 
          hoveredNode ? 'cursor-pointer' : 
          'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
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

        {/* 模拟控制 */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded p-1 flex flex-col gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`h-8 w-8 p-0 hover:bg-[#3d3d3d] ${isSimulating ? 'text-green-400' : 'text-gray-200'}`}
            title={isSimulating ? "暂停模拟" : "继续模拟"}
          >
            {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={resetSimulation}
            className="h-8 w-8 p-0 hover:bg-[#3d3d3d] text-gray-200"
            title="重置布局"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* 关系过滤 */}
        <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded p-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`h-8 w-8 p-0 hover:bg-[#3d3d3d] ${showFilterPanel ? 'text-blue-400' : 'text-gray-200'}`}
            title="过滤关系"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 关系过滤面板 */}
      {showFilterPanel && (
        <div className="absolute top-4 right-20 bg-[#2d2d2d] border border-[#3d3d3d] rounded p-3 min-w-[200px]">
          <div className="text-sm font-semibold text-white mb-3">关系类型</div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#3d3d3d] p-1 rounded">
              <Checkbox
                checked={relationFilters.hierarchy}
                onCheckedChange={() => toggleFilter('hierarchy')}
                className="border-gray-500"
              />
              <span className="text-xs text-gray-300">父子关系</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-6 h-0.5 bg-[#4a4a4a]" />
                <div className="text-gray-400">▶</div>
              </div>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#3d3d3d] p-1 rounded">
              <Checkbox
                checked={relationFilters.required}
                onCheckedChange={() => toggleFilter('required')}
                className="border-gray-500"
              />
              <span className="text-xs text-gray-300">必需关系</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-6 h-0.5 border-t border-dashed border-green-400" />
                <div className="text-green-400">▶</div>
              </div>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#3d3d3d] p-1 rounded">
              <Checkbox
                checked={relationFilters.blocked}
                onCheckedChange={() => toggleFilter('blocked')}
                className="border-gray-500"
              />
              <span className="text-xs text-gray-300">阻止关系</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-6 h-0.5 border-t border-dashed border-red-400" />
                <div className="text-red-400">▶</div>
              </div>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#3d3d3d] p-1 rounded">
              <Checkbox
                checked={relationFilters.attached}
                onCheckedChange={() => toggleFilter('attached')}
                className="border-gray-500"
              />
              <span className="text-xs text-gray-300">附加关系</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-6 h-0.5 border-t border-dashed border-blue-400" />
                <div className="text-blue-400">▶</div>
              </div>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#3d3d3d] p-1 rounded">
              <Checkbox
                checked={relationFilters.removed}
                onCheckedChange={() => toggleFilter('removed')}
                className="border-gray-500"
              />
              <span className="text-xs text-gray-300">移除关系</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-6 h-0.5 border-t border-dashed border-orange-400" />
                <div className="text-orange-400">▶</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#3d3d3d] p-1 rounded">
              <Checkbox
                checked={relationFilters.disabled_if}
                onCheckedChange={() => toggleFilter('disabled_if')}
                className="border-gray-500"
              />
              <span className="text-xs text-gray-300">禁用条件</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-6 h-0.5 border-t border-dashed border-yellow-400" />
                <div className="text-yellow-400">▶</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer hover:bg-[#3d3d3d] p-1 rounded">
              <Checkbox
                checked={relationFilters.remove_if}
                onCheckedChange={() => toggleFilter('remove_if')}
                className="border-gray-500"
              />
              <span className="text-xs text-gray-300">移除条件</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-6 h-0.5 border-t border-dashed border-purple-400" />
                <div className="text-purple-400">▶</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className="absolute bottom-4 left-4 bg-[#2d2d2d] border border-[#3d3d3d] rounded p-3 text-xs text-gray-400 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="font-semibold text-white">力学布局</span>
          <span className={`text-xs ${isSimulating ? 'text-green-400' : 'text-gray-500'}`}>
            {isSimulating ? '运行中' : '已暂停'}
          </span>
        </div>
        <div className="space-y-1">
          <div>• <span className="text-white">左键拖动</span>节点调整位置</div>
          <div>• <span className="text-white">右键拖动</span>移动画布视图</div>
          <div>• <span className="text-white">滚轮</span>缩放画布</div>
          <div>• <span className="text-white">箭头</span>表示关系方向</div>
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