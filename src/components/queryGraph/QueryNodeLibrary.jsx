import React from 'react';
import { X, Database, Filter, Tag, Link, MapPin, Route, Box, Layers, GitMerge, GitBranch, GitCommit, FileOutput } from 'lucide-react';

const nodeTypes = [
  { type: 'entity_source', label: '实体源', icon: Database, color: '#0e639c', category: '源' },
  { type: 'filter_prototype', label: '原型过滤', icon: Filter, color: '#70ad47', category: '过滤' },
  { type: 'filter_attribute', label: '属性过滤', icon: Layers, color: '#9b6bb3', category: '过滤' },
  { type: 'filter_tag', label: '标签过滤', icon: Tag, color: '#ffc000', category: '过滤' },
  { type: 'filter_relation', label: '关系过滤', icon: Link, color: '#e67e22', category: '过滤' },
  { type: 'spatial_distance', label: '距离查询', icon: MapPin, color: '#c97fff', category: '空间' },
  { type: 'spatial_pathfinding', label: '寻路查询', icon: Route, color: '#c97fff', category: '空间' },
  { type: 'spatial_area', label: '区域查询', icon: Box, color: '#c97fff', category: '空间' },
  { type: 'spatial_nearest', label: '最近查询', icon: Layers, color: '#c97fff', category: '空间' },
  { type: 'logic_and', label: '逻辑与', icon: GitMerge, color: '#d9534f', category: '逻辑' },
  { type: 'logic_or', label: '逻辑或', icon: GitBranch, color: '#d9534f', category: '逻辑' },
  { type: 'logic_not', label: '逻辑非', icon: GitCommit, color: '#d9534f', category: '逻辑' },
  { type: 'output', label: '输出', icon: FileOutput, color: '#5cb85c', category: '输出' },
];

export default function QueryNodeLibrary({ onAddNode, onClose }) {
  const categories = [...new Set(nodeTypes.map(n => n.category))];

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3e3e42] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[#3e3e42]">
        <span className="text-sm font-semibold text-white/90">节点库</span>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ 
        scrollbarWidth: 'thin',
        scrollbarColor: '#4a4a4a #2d2d2d'
      }}>
        <style>{`
          .node-library-scroll::-webkit-scrollbar { width: 8px; }
          .node-library-scroll::-webkit-scrollbar-track { background: #2d2d2d; }
          .node-library-scroll::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 4px; }
          .node-library-scroll::-webkit-scrollbar-thumb:hover { background: #5a5a5a; }
        `}</style>
        <div className="p-3 space-y-4 node-library-scroll">
          {categories.map(category => (
            <div key={category}>
              <div className="text-xs font-semibold text-white/50 mb-2 px-1">{category}</div>
              <div className="space-y-1">
                {nodeTypes.filter(n => n.category === category).map(nodeType => {
                  const Icon = nodeType.icon;
                  return (
                    <div
                      key={nodeType.type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, nodeType.type)}
                      onClick={() => onAddNode(nodeType.type)}
                      className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all hover:bg-[#2d2d30] active:scale-95"
                      style={{ borderLeft: `3px solid ${nodeType.color}` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: nodeType.color }} />
                      <span className="text-xs text-white/90">{nodeType.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 border-t border-[#3e3e42] text-[10px] text-white/40">
        拖拽或点击添加节点
      </div>
    </div>
  );
}