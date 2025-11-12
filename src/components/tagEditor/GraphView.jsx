import React, { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GraphView({ tags, onSelectTag, selectedTag }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 构建节点数据结构
  useEffect(() => {
    if (!tags || tags.length === 0) return;

    const nodeMap = new Map();
    const newNodes = [];

    // 创建节点
    tags.forEach((tag, index) => {
      const node = {
        id: tag.id,
        tag: tag,
        x: Math.random() * 800 + 100,
        y: Math.random() * 600 + 100,
        vx: 0,
        vy: 0,
        radius: 20 + tag.depth * 5,
      };
      nodeMap.set(tag.id, node);
      newNodes.push(node);
    });

    // 建立连接关系
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

  // 力导向算法
  useEffect(() => {
    if (nodes.length === 0) return;

    const animate = () => {
      const newNodes = [...nodes];
      
      // 应用力
      newNodes.forEach((node, i) => {
        let fx = 0, fy = 0;

        // 中心引力
        const centerX = 500;
        const centerY = 400;
        fx += (centerX - node.x) * 0.001;
        fy += (centerY - node.y) * 0.001;

        // 节点间排斥力
        newNodes.forEach((other, j) => {
          if (i === j) return;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (node.radius + other.radius + 50) / dist;
          fx += dx * force * 0.1;
          fy += dy * force * 0.1;
        });

        // 父子连接吸引力
        if (node.parent) {
          const dx = node.parent.x - node.x;
          const dy = node.parent.y - node.y;
          fx += dx * 0.05;
          fy += dy * 0.05;
        }

        // 更新速度和位置
        node.vx = (node.vx + fx) * 0.85;
        node.vy = (node.vy + fy) * 0.85;
        node.x += node.vx;
        node.y += node.vy;
      });

      setNodes(newNodes);
    };

    const interval = setInterval(animate, 30);
    return () => clearInterval(interval);
  }, [nodes]);

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
      
      // 节点圆圈
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      
      // 根据分类设置颜色
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

      // 选中状态
      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#2d2d2d';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 标签文字
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.tag.name, node.x, node.y);
    });

    ctx.restore();
  }, [nodes, scale, offset, selectedTag]);

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
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
        className="w-full h-full cursor-move"
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
          className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d]"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setScale(s => Math.max(s * 0.8, 0.1))}
          className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d]"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={resetView}
          className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d]"
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
          • 拖动画布移动视图<br />
          • 滚轮缩放<br />
          • 点击节点查看详情
        </div>
      </div>
    </div>
  );
}