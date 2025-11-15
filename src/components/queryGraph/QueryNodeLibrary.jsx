import React from "react";
import { X, Box, Filter, Tag, Link as LinkIcon, MapPin, Ruler, Route, Circle } from "lucide-react";

const nodeTypes = [
  { type: 'entity_source', label: '实体源', icon: Box, color: '#60a5fa', category: '输入' },
  
  { type: 'filter_prototype', label: '原型过滤', icon: Filter, color: '#34d399', category: '过滤' },
  { type: 'filter_attribute', label: '属性过滤', icon: Filter, color: '#34d399', category: '过滤' },
  { type: 'filter_tag', label: '标签过滤', icon: Tag, color: '#34d399', category: '过滤' },
  { type: 'filter_relation', label: '关系过滤', icon: LinkIcon, color: '#34d399', category: '过滤' },
  
  { type: 'spatial_distance', label: '直线距离', icon: Ruler, color: '#f59e0b', category: '空间' },
  { type: 'spatial_pathfinding', label: '寻路距离', icon: Route, color: '#f59e0b', category: '空间' },
  { type: 'spatial_area', label: '区域范围', icon: Circle, color: '#f59e0b', category: '空间' },
  { type: 'spatial_nearest', label: '最近N个', icon: MapPin, color: '#f59e0b', category: '空间' },
  
  { type: 'logic_and', label: '逻辑与', icon: Filter, color: '#8b5cf6', category: '逻辑' },
  { type: 'logic_or', label: '逻辑或', icon: Filter, color: '#8b5cf6', category: '逻辑' },
  { type: 'logic_not', label: '逻辑非', icon: Filter, color: '#8b5cf6', category: '逻辑' },
  
  { type: 'output', label: '输出结果', icon: Box, color: '#ef4444', category: '输出' }
];

const categories = ['输入', '过滤', '空间', '逻辑', '输出'];

export default function QueryNodeLibrary({ onAddNode, onClose }) {
  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3d3d3d] flex flex-col h-full overflow-hidden">
      <div className="p-3 border-b border-[#3d3d3d] flex items-center justify-between">
        <span className="text-sm font-semibold text-white">节点库</span>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4a4a4a #2d2d2d'
      }}>
        {categories.map(category => (
          <div key={category}>
            <div className="text-xs text-white/50 font-semibold mb-2 px-2">{category}</div>
            <div className="space-y-1">
              {nodeTypes.filter(n => n.category === category).map(node => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, node.type)}
                    onClick={() => onAddNode(node.type)}
                    className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[#2d2d2d] transition-colors"
                    style={{ borderLeft: `3px solid ${node.color}` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: node.color }} />
                    <span className="text-xs text-white/90">{node.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}