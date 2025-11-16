import React, { useState } from 'react';
import { X, Database, Filter, Tag, Link, MapPin, Box, GitMerge, ArrowUpDown, Hash, Percent, Network, Plus, Minus, Divide, Sigma, TrendingUp, Move, Palette, Download, Upload } from 'lucide-react';

const queryNodeTypes = [
  { type: 'entity_source', label: '实体源', icon: Database, color: '#0e639c', category: '源' },
  { type: 'filter_prototype', label: '原型过滤', icon: Filter, color: '#70ad47', category: '过滤' },
  { type: 'filter_attribute', label: '属性过滤', icon: Filter, color: '#9b6bb3', category: '过滤' },
  { type: 'filter_tag', label: '标签过滤', icon: Tag, color: '#ffc000', category: '过滤' },
  { type: 'filter_relation', label: '关系过滤', icon: Link, color: '#e67e22', category: '过滤' },
  { type: 'filter_relation_attribute', label: '关系属性过滤', icon: Network, color: '#e67e22', category: '过滤' },
  { type: 'filter_relation_tag', label: '关系标签过滤', icon: Network, color: '#e67e22', category: '过滤' },
  { type: 'filter_related_entity_attribute', label: '关联实体属性过滤', icon: Network, color: '#e67e22', category: '过滤' },
  { type: 'filter_related_entity_tag', label: '关联实体标签过滤', icon: Network, color: '#e67e22', category: '过滤' },
  { type: 'spatial_distance', label: '距离查询', icon: MapPin, color: '#c97fff', category: '空间' },
  { type: 'spatial_area', label: '区域查询', icon: Box, color: '#c97fff', category: '空间' },
  { type: 'logic_intersect', label: '交集', icon: GitMerge, color: '#d9534f', category: '逻辑' },
  { type: 'logic_union', label: '并集', icon: GitMerge, color: '#d9534f', category: '逻辑' },
  { type: 'logic_difference', label: '差集', icon: GitMerge, color: '#d9534f', category: '逻辑' },
  { type: 'sort_by_attribute', label: '按属性排序', icon: ArrowUpDown, color: '#5bc0de', category: '排序' },
  { type: 'sort_by_relation', label: '按关系排序', icon: ArrowUpDown, color: '#5bc0de', category: '排序' },
  { type: 'sort_by_tag', label: '按标签排序', icon: ArrowUpDown, color: '#5bc0de', category: '排序' },
  { type: 'limit_top', label: '取前N名', icon: Hash, color: '#17a2b8', category: '限制' },
  { type: 'limit_bottom', label: '取后N名', icon: Hash, color: '#17a2b8', category: '限制' },
  { type: 'limit_percent_top', label: '取前N%', icon: Percent, color: '#17a2b8', category: '限制' },
  { type: 'limit_percent_bottom', label: '取后N%', icon: Percent, color: '#17a2b8', category: '限制' },
  { type: 'output', label: '输出', icon: Database, color: '#5cb85c', category: '输出' },
];

const computeNodeTypes = [
  { type: 'number', label: '数值', icon: Hash, color: '#5b9bd5', category: '基础' },
  { type: 'add', label: '加法', icon: Plus, color: '#9b6bb3', category: '数学' },
  { type: 'subtract', label: '减法', icon: Minus, color: '#9b6bb3', category: '数学' },
  { type: 'multiply', label: '乘法', icon: X, color: '#9b6bb3', category: '数学' },
  { type: 'divide', label: '除法', icon: Divide, color: '#9b6bb3', category: '数学' },
  { type: 'power', label: '幂运算', icon: TrendingUp, color: '#9b6bb3', category: '数学' },
  { type: 'sum', label: '求和', icon: Sigma, color: '#e67e22', category: '聚合' },
  { type: 'product', label: '求积', icon: Sigma, color: '#e67e22', category: '聚合' },
  { type: 'max', label: '最大值', icon: TrendingUp, color: '#e67e22', category: '聚合' },
  { type: 'min', label: '最小值', icon: TrendingUp, color: '#e67e22', category: '聚合' },
  { type: 'clamp', label: '钳制', icon: TrendingUp, color: '#e67e22', category: '聚合' },
  { type: 'vector2', label: '二维向量', icon: Move, color: '#70ad47', category: '向量' },
  { type: 'vector3', label: '三维向量', icon: Move, color: '#70ad47', category: '向量' },
  { type: 'vector4', label: '四维向量', icon: Move, color: '#70ad47', category: '向量' },
  { type: 'quaternion', label: '四元数', icon: Move, color: '#c97fff', category: '高级' },
  { type: 'color', label: '颜色', icon: Palette, color: '#ffc000', category: '高级' },
  { type: 'blackboard_get', label: 'Get', icon: Download, color: '#0e639c', category: '黑板' },
  { type: 'blackboard_set', label: 'Set', icon: Upload, color: '#16825d', category: '黑板' },
];

export default function QueryNodeLibrary({ onAddNode, onClose }) {
  const [activeTab, setActiveTab] = useState('query');
  
  const currentNodes = activeTab === 'query' ? queryNodeTypes : computeNodeTypes;
  const categories = [...new Set(currentNodes.map(n => n.category))];

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3e3e42] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[#3e3e42]">
        <span className="text-sm font-semibold text-white/90">节点库</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors"><X className="w-4 h-4" /></button>
      </div>
      
      <div className="flex border-b border-[#3e3e42]">
        <button
          onClick={() => setActiveTab('query')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'query' 
              ? 'bg-[#0e639c] text-white' 
              : 'text-white/60 hover:text-white/90 hover:bg-[#2d2d30]'
          }`}
        >
          查询节点
        </button>
        <button
          onClick={() => setActiveTab('compute')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'compute' 
              ? 'bg-[#0e639c] text-white' 
              : 'text-white/60 hover:text-white/90 hover:bg-[#2d2d30]'
          }`}
        >
          运算节点
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4a4a4a #2d2d2d'
      }}>
        <style>{`
          .flex-1::-webkit-scrollbar { width: 8px; }
          .flex-1::-webkit-scrollbar-track { background: #2d2d2d; }
          .flex-1::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 4px; }
          .flex-1::-webkit-scrollbar-thumb:hover { background: #5a5a5a; }
        `}</style>
        {categories.map(category => (
          <div key={category}>
            <div className="text-xs font-semibold text-white/50 mb-2 px-1">{category}</div>
            <div className="space-y-1">
              {currentNodes.filter(n => n.category === category).map(nodeType => {
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
      <div className="p-3 border-t border-[#3e3e42] text-[10px] text-white/40">拖拽或点击添加节点</div>
    </div>
  );
}