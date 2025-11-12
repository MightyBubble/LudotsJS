import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GraphView({ tags, onSelectTag, selectedTag }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);
  const [dragNodeOffset, setDragNodeOffset] = useState({ x: 0, y: 0 });
  const animationRef = useRef(null);

  // 构建节点数据结构 - 使用层级布局
  useEffect(() => {
    if (!tags || tags.length === 0) return;

    const nodeMap = new Map();
    const newNodes = [];
    const levelGroups = new Map();

    // 按深度分组
    tags.forEach(tag => {
      if (!levelGroups.has(tag.depth)) {
        levelGroups.set(tag.depth, []);
      }
      levelGroups.get(tag.depth).push(tag);
    });

    // 计算布局
    const verticalSpacing = 120;
    const horizontalSpacing = 150;

    tags.forEach(tag => {
      const levelTags = levelGroups.get(tag.depth);
      const indexInLevel = levelTags.indexOf(tag);
      
      const node = {
        id: tag.id,
        tag: tag,
        x: 500 + (indexInLevel - levelTags.length / 2) * horizontalSpacing + (Math.random() - 0.5) * 20,
        y: 200 + tag.depth * verticalSpacing + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        radius: 20,
        fixed: false,
      };
      nodeMap.set(tag.id, node);
      newNodes.push(node);
    });

    // 建立父子关系
    tags.forEach(tag => {
      const node = nodeMap.get(tag.id);
      if (tag.parent_path) {
        const parent = tags.find(t => t.full_path === tag.parent_path);
        if (parent) {
          node.parent = nodeMap.get(parent.id);
        }
      }
    });

    setNodes(newNodes);
  }, [tags]);

  // 优化的力导向算法
  useEffect(() => {
    if (nodes.length === 0) return;

    let frameCount = 0;
    const maxFrames = 300;

    const animate = () => {
      frameCount++;
      
      if (frameCount > maxFrames) {
        cancelAnimationFrame(animationRef.current);
        return;
      }

      const newNodes = [...nodes];
      let totalEnergy = 0;

      // 应用力
      newNodes.forEach((node, i) => {
        if (node.fixed) return; // 跳过被拖拽的节点
        
        let fx = 0, fy = 0;

        // 1. 父子吸引力
        if (node.parent && !node.parent.fixed) {
          const dx = node.parent.x - node.x;
          const dy = node.parent.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 100;
          const force = (dist - targetDist) * 0.03;
          fx += (dx / dist) * force;
          fy += (dy / dist) * force;
        }

        // 2. 节点排斥力
        newNodes.forEach((other, j) => {
          if (i === j || other.fixed) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;
          
          if (dist < 150) {
            const force = 800 / distSq;
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          }
        });

        // 3. 同层节点水平排列
        const sameDepthNodes = newNodes.filter(n => n.tag.depth === node.tag.depth && n.id !== node.id && !n.fixed);
        sameDepthNodes.forEach(other => {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (Math.abs(dx) < 120) {
            fx += (dx / dist) * 0.5;
          }
          if (Math.abs(dy) > 10) {
            fy -= dy * 0.01;
          }
        });

        // 4. 轻微的中心引力
        const centerX = 500;
        const centerY = 400;
        const toCenterDist = Math.sqrt((node.x - centerX) ** 2 + (node.y - centerY) ** 2);
        if (toCenterDist > 400) {
          fx += (centerX - node.x) * 0.001;
          fy += (centerY - node.y) * 0.001;
        }

        const damping = 0.7;
        node.vx = (node.vx + fx) * damping;
        node.vy = (node.vy + fy) * damping;

        const maxSpeed = 5;
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > maxSpeed) {
          node.vx = (node.vx / speed) * maxSpeed;
          node.vy = (node.vy / speed) * maxSpeed;
        }

        node.x += node.vx;
        node.y += node.vy;

        totalEnergy += speed;
      });

      if (totalEnergy < 0.1) {
        cancelAnimationFrame(animationRef.current);
        return;
      }

      setNodes(newNodes);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes.length]);

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
    ctx.translate(-500, -400);

    // 绘制连接线
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 2;
    nodes.forEach(node => {
      if (node.parent) {
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(node.parent.x, node.parent.y);
        ctx.stroke();
      }
    });

    // 绘制节点
    nodes.forEach(node => {
      const isSelected = selectedTag?.id === node.id;
      const isDragging = draggedNode?.id === node.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      const colorMap = {
        ability: '#60a5fa',
        state: '#34d399',
        effect: '#f472b6',
        item: '#fbbf24',
        event: '#a78bfa',
        ui: '#fb923c',
        audio: '#22d3ee',
        gameplay: '#4ade80',
        other: '#94a3b8',
      };
      ctx.fillStyle = colorMap[node.tag.category] || '#94a3b8';
      ctx.fill();

      if (isSelected || isDragging) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.tag.name, node.x, node.y);
    });

    ctx.restore();
  }, [nodes, scale, offset, selectedTag, draggedNode]);

  // 鼠标交互
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2 - offset.x) / scale + 500;
    const y = (e.clientY - rect.top - canvas.height / 2 - offset.y) / scale + 400;

    // 检查是否点击节点
    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    if (clickedNode) {
      onSelectTag(clickedNode.tag);
      setDraggedNode(clickedNode);
      setDragNodeOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
      clickedNode.fixed = true;
    } else {
      setIsDraggingCanvas(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2 - offset.x) / scale + 500;
    const y = (e.clientY - rect.top - canvas.height / 2 - offset.y) / scale + 400;

    if (draggedNode) {
      // 拖拽节点
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === draggedNode.id 
            ? { ...node, x: x - dragNodeOffset.x, y: y - dragNodeOffset.y, vx: 0, vy: 0 }
            : node
        )
      );
    } else if (isDraggingCanvas) {
      // 拖拽画布
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (draggedNode) {
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === draggedNode.id 
            ? { ...node, fixed: false }
            : node
        )
      );
      setDraggedNode(null);
    }
    setIsDraggingCanvas(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(s => Math.min(Math.max(s * delta, 0.1), 3));
  };

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#1e1e1e]">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${draggedNode ? 'cursor-grabbing' : isDraggingCanvas ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      
      {/* 控制按钮 */}
      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setScale(s => Math.min(s * 1.2, 3))}
          className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-200"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setScale(s => Math.max(s * 0.8, 0.1))}
          className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-200"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetView}
          className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-200"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* 图例 */}
      <div className="absolute bottom-4 left-4 bg-[#2d2d2d] border border-[#3d3d3d] rounded p-3 text-xs">
        <div className="font-semibold text-gray-300 mb-2">分类颜色</div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries({
            ability: '能力', state: '状态', effect: '效果',
            item: '物品', event: '事件', ui: '界面',
            audio: '音频', gameplay: '玩法', other: '其他'
          }).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full`} style={{
                backgroundColor: {
                  ability: '#60a5fa', state: '#34d399', effect: '#f472b6',
                  item: '#fbbf24', event: '#a78bfa', ui: '#fb923c',
                  audio: '#22d3ee', gameplay: '#4ade80', other: '#94a3b8'
                }[key]
              }} />
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-gray-500 text-xs">
          • 拖动节点调整位置<br />
          • 拖动空白处移动视图<br />
          • 滚轮缩放<br />
          • 点击节点查看详情
        </div>
      </div>
    </div>
  );
}