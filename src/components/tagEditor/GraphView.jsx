import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GraphView({ tags, onSelectTag, selectedTag, categories }) {
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

  // 获取分类颜色
  const getCategoryColor = (categoryKey) => {
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  // 力导向参数
  const PARAMS = {
    stiffness: 400.0,
    repulsion: 400.0,
    damping: 0.5,
    minEnergyThreshold: 0.01,
    maxSpeed: 10
  };

  // 初始化节点
  useEffect(() => {
    if (!tags || tags.length === 0) return;

    const nodeMap = new Map();
    const newNodes = [];

    tags.forEach(tag => {
      const node = {
        id: tag.id,
        tag: tag,
        x: Math.random() * 800 + 100,
        y: Math.random() * 600 + 100,
        vx: 0,
        vy: 0,
        mass: 1.0,
        radius: 20,
        fixed: false,
      };
      nodeMap.set(tag.id, node);
      newNodes.push(node);
    });

    newNodes.forEach(node => {
      if (node.tag.parent_path) {
        const parent = tags.find(t => t.full_path === node.tag.parent_path);
        if (parent) {
          node.parent = nodeMap.get(parent.id);
        }
      }
    });

    setNodes(newNodes);
  }, [tags]);

  // Springy力导向算法
  useEffect(() => {
    if (nodes.length === 0) return;

    let lastTime = Date.now();
    
    const simulate = () => {
      const currentTime = Date.now();
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const newNodes = [...nodes];
      let totalKineticEnergy = 0;

      newNodes.forEach(node => {
        if (node.fixed) return;
        node.fx = 0;
        node.fy = 0;
      });

      // 弹簧力
      newNodes.forEach(node => {
        if (node.fixed || !node.parent) return;
        
        const parent = node.parent;
        const dx = parent.x - node.x;
        const dy = parent.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.01) return;
        
        const restLength = 100;
        const force = PARAMS.stiffness * (distance - restLength);
        
        const fx = (force * dx) / distance;
        const fy = (force * dy) / distance;
        
        node.fx += fx;
        node.fy += fy;
        
        if (!parent.fixed) {
          parent.fx -= fx;
          parent.fy -= fy;
        }
      });

      // 排斥力
      for (let i = 0; i < newNodes.length; i++) {
        const node1 = newNodes[i];
        if (node1.fixed) continue;
        
        for (let j = i + 1; j < newNodes.length; j++) {
          const node2 = newNodes[j];
          
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distanceSq = dx * dx + dy * dy;
          const distance = Math.sqrt(distanceSq);
          
          if (distance < 0.01) continue;
          
          const force = PARAMS.repulsion / distanceSq;
          
          const fx = (force * dx) / distance;
          const fy = (force * dy) / distance;
          
          node1.fx -= fx;
          node1.fy -= fy;
          
          if (!node2.fixed) {
            node2.fx += fx;
            node2.fy += fy;
          }
        }
      }

      // 更新速度和位置
      newNodes.forEach(node => {
        if (node.fixed) return;
        
        const ax = node.fx / node.mass;
        const ay = node.fy / node.mass;
        
        node.vx = (node.vx + ax * dt) * (1 - PARAMS.damping);
        node.vy = (node.vy + ay * dt) * (1 - PARAMS.damping);
        
        const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (speed > PARAMS.maxSpeed) {
          node.vx = (node.vx / speed) * PARAMS.maxSpeed;
          node.vy = (node.vy / speed) * PARAMS.maxSpeed;
        }
        
        node.x += node.vx * dt;
        node.y += node.vy * dt;
        
        totalKineticEnergy += 0.5 * node.mass * (node.vx * node.vx + node.vy * node.vy);
      });

      const meanEnergy = totalKineticEnergy / newNodes.length;
      
      setNodes(newNodes);
      
      if (meanEnergy > PARAMS.minEnergyThreshold) {
        animationRef.current = requestAnimationFrame(simulate);
      } else {
        animationRef.current = setTimeout(() => {
          animationRef.current = requestAnimationFrame(simulate);
        }, 500);
      }
    };

    animationRef.current = requestAnimationFrame(simulate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        clearTimeout(animationRef.current);
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
      
      ctx.fillStyle = getCategoryColor(node.tag.category_key);
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
  }, [nodes, scale, offset, selectedTag, draggedNode, categories]);

  // 鼠标交互
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2 - offset.x) / scale + 500;
    const y = (e.clientY - rect.top - canvas.height / 2 - offset.y) / scale + 400;

    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius;
    });

    if (clickedNode) {
      onSelectTag(clickedNode.tag);
      setDraggedNode(clickedNode);
      setDragNodeOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
      
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === clickedNode.id 
            ? { ...node, fixed: true, vx: 0, vy: 0 }
            : node
        )
      );
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
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === draggedNode.id 
            ? { ...node, x: x - dragNodeOffset.x, y: y - dragNodeOffset.y }
            : node
        )
      );
    } else if (isDraggingCanvas) {
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

      <div className="absolute bottom-4 left-4 bg-[#2d2d2d] border border-[#3d3d3d] rounded p-3 text-xs text-gray-400">
        • 拖动节点调整位置<br />
        • 拖动空白处移动视图<br />
        • 滚轮缩放<br />
        • 点击节点查看详情
      </div>
    </div>
  );
}