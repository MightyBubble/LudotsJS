import React from 'react';
import { X, Hash, Plus, Minus, X as Multiply, Divide, Maximize, Activity, TrendingUp, Circle, Box, Rotate3d, Sigma, Asterisk, ArrowUp, ArrowDown, Compass, Palette, Maximize2 } from 'lucide-react';

const nodeTypes = [
  { type: 'number', label: '数值', icon: Hash, color: '#5b9bd5', category: '基础' },
  { type: 'add', label: '加法', icon: Plus, color: '#9b6bb3', category: '数学' },
  { type: 'subtract', label: '减法', icon: Minus, color: '#9b6bb3', category: '数学' },
  { type: 'multiply', label: '乘法', icon: Multiply, color: '#9b6bb3', category: '数学' },
  { type: 'divide', label: '除法', icon: Divide, color: '#9b6bb3', category: '数学' },
  { type: 'power', label: '幂运算', icon: TrendingUp, color: '#9b6bb3', category: '数学' },
  
  { type: 'sum', label: '求和', icon: Sigma, color: '#e67e22', category: '聚合' },
  { type: 'product', label: '求积', icon: Asterisk, color: '#e67e22', category: '聚合' },
  { type: 'max', label: '最大值', icon: ArrowUp, color: '#e67e22', category: '聚合' },
  { type: 'min', label: '最小值', icon: ArrowDown, color: '#e67e22', category: '聚合' },
  { type: 'clamp', label: '钳制', icon: Maximize, color: '#e67e22', category: '聚合' },
  
  { type: 'vector2', label: '二维向量', icon: Circle, color: '#70ad47', category: '向量' },
  { type: 'vector3', label: '三维向量', icon: Compass, color: '#70ad47', category: '向量' },
  { type: 'vector4', label: '四维向量', icon: Box, color: '#70ad47', category: '向量' },
  { type: 'vector_add', label: '向量加法', icon: Plus, color: '#70ad47', category: '向量' },
  { type: 'vector_subtract', label: '向量减法', icon: Minus, color: '#70ad47', category: '向量' },
  { type: 'vector_multiply', label: '向量乘法', icon: Multiply, color: '#70ad47', category: '向量' },
  { type: 'vector_dot', label: '点积', icon: Activity, color: '#70ad47', category: '向量' },
  { type: 'vector_cross', label: '叉积', icon: Maximize2, color: '#70ad47', category: '向量' },
  { type: 'vector_normalize', label: '归一化', icon: TrendingUp, color: '#70ad47', category: '向量' },
  { type: 'vector_length', label: '向量长度', icon: Activity, color: '#70ad47', category: '向量' },
  
  { type: 'quaternion', label: '四元数', icon: Rotate3d, color: '#c97fff', category: '高级' },
  { type: 'color', label: '颜色', icon: Palette, color: '#ffc000', category: '基础' },
];

const categories = ['基础', '数学', '聚合', '向量', '高级'];

export default function NodeLibrary({ onAddNode, onClose }) {
  const handleDragStart = (e, nodeType) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3e3e42] flex flex-col">
      <div className="p-3 border-b border-[#3e3e42] flex items-center justify-between">
        <h2 className="text-white font-medium text-sm">节点库</h2>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {categories.map(category => {
          const categoryNodes = nodeTypes.filter(n => n.category === category);
          if (categoryNodes.length === 0) return null;
          
          return (
            <div key={category} className="mb-4">
              <div className="text-white/40 text-xs font-medium px-2 py-1 mb-1">
                {category}
              </div>
              <div className="space-y-1">
                {categoryNodes.map((nodeType) => (
                  <button
                    key={nodeType.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeType.type)}
                    onClick={() => onAddNode(nodeType.type)}
                    className="w-full flex items-center gap-3 p-2 rounded hover:bg-[#2a2d2e] transition-colors group cursor-move"
                  >
                    <div 
                      className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: nodeType.color + '30' }}
                    >
                      <nodeType.icon className="w-3.5 h-3.5" style={{ color: nodeType.color }} />
                    </div>
                    <span className="text-white/80 text-xs font-medium">{nodeType.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3 border-t border-[#3e3e42]">
        <div className="bg-[#1e1e1e] border border-[#3e3e42] rounded p-2 text-xs text-white/60">
          拖拽节点到画布或点击添加
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #3e3e42;
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4e4e52;
        }
      `}</style>
    </div>
  );
}