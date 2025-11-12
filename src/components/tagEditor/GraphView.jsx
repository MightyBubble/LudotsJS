import React, { useEffect, useRef, useState, useMemo } from "react";
import { ZoomIn, ZoomOut, Maximize2, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        height: 50,
        mass: 1
      };
    });

    // 初始化边
    const initialEdges = [];
    tags.forEach(tag => {
      if (tag.parent_path) {
        const parent = tags.find(t => t.full_path === tag.parent_path);
        if (parent) {
          initialEdges.push({
            source: parent.id,
            target: tag.id
          });
        }
      }

      // 添加规则关系边（虚线）
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
    });

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [tags]);

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
        edges.forEach(edge => {
          const source = newNodes.find(n => n.id === edge.source);
          const target = newNodes.find(n => n.id === edge.target);
          if (!source || !target) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 1) return;

          // 理想距离
          const idealDistance = edge.type ? 100 : 150;
          
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
  }, [isSimulating, nodes.length, edges, draggedNode]);

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

    // 绘制网格背景
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < 800; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 800);
      ctx.stroke();
    }
    for (let y = 0; y < 800; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(800, y);
      ctx.stroke();
    }

    // 绘制边
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);

      if (edge.type === 'required') {
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
      } else if (edge.type === 'blocked') {
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = '#4a4a4a';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);

      // 箭头
      if (!edge.type) {
        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const angle = Math.atan2(dy, dx);
        const arrowSize = 8;
        
        ctx.fillStyle = '#4a4a4a';
        ctx.beginPath();
        ctx.moveTo(targetNode.x, targetNode.y);
        ctx.lineTo(
          targetNode.x - arrowSize * Math.cos(angle - Math.PI / 6),
          targetNode.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          targetNode.x - arrowSize * Math.cos(angle + Math.PI / 6),
          targetNode.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    });

    // 绘制节点
    nodes.forEach(node => {
      const isSelected = selectedTag?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isDragged = draggedNode?.id === node.id;
      
      const x = node.x - node.width / 2;
      const y = node.y - node.height / 2;
      const radius = 8;

      // 阴影
      if (isHovered || isSelected || isDragged) {
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
      ctx.strokeStyle = isSelected ? '#0e639c' : isHovered || isDragged ? '#3d3d3d' : '#2d2d2d';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // 分类色条
      const categoryColor = getCategoryColor(node.tag.category_key);
      ctx.fillStyle = categoryColor;
      ctx.fillRect(x, y, 4, node.height);

      // 节点文字
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = node.tag.name;
      const maxWidth = node.width - 20;
      let displayText = text;
      
      if (ctx.measureText(text).width > maxWidth) {
        let truncated = text;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        displayText = truncated + '...';
      }
      
      ctx.fillText(displayText, node.x, node.y - 6);

      // 子标题
      ctx.fillStyle = '#888888';
      ctx.font = '9px sans-serif';
      const depth = `Level ${node.tag.depth}`;
      ctx.fillText(depth, node.x, node.y + 8);
    });

    ctx.restore();
  }, [nodes, edges, scale, offset, selectedTag, hoveredNode, draggedNode, categories]);

  // 鼠标交互
  const getNodeAtPosition = (x, y) => {
    const canvas = canvasRef.current;
    const canvasX = (x - canvas.width / 2 - offset.x) / scale + 400;
    const canvasY = (y - canvas.height / 2 - offset.y) / scale + 400;

    return nodes.find(node => {
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
      setDraggedNode(clickedNode);
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

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#1e1e1e]">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${
          draggedNode ? 'cursor-grabbing' : 
          isDraggingCanvas ? 'cursor-grabbing' : 
          hoveredNode ? 'cursor-pointer' : 
          'cursor-grab'
        }`}
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
      </div>

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
          <div>• <span className="text-white">拖动节点</span>调整位置</div>
          <div>• <span className="text-white">拖动空白</span>移动视图</div>
          <div>• <span className="text-white">滚轮</span>缩放画布</div>
          <div>• <span className="text-green-400">绿色虚线</span>必需关系</div>
          <div>• <span className="text-red-400">红色虚线</span>阻止关系</div>
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