import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getAvailableNodes, getCategories } from './nodeConfigs';

export default function UnifiedNodeLibrary({ graphType, onAddNode, onClose }) {
  const [activeTab, setActiveTab] = useState(
    graphType === 'query' ? 'query' : graphType === 'function' ? 'function' : 'compute'
  );
  
  const availableNodes = getAvailableNodes(graphType);
  const categories = getCategories(graphType);
  
  // 区分不同类型的节点
  const queryNodes = availableNodes.filter(n => 
    ['源', '过滤', '空间', '逻辑', '排序', '限制', '输出'].includes(n.category)
  );
  const functionNodes = availableNodes.filter(n => 
    n.category.startsWith('函数-')
  );
  const computeNodes = availableNodes.filter(n => 
    ['基础', '数学', '聚合', '向量', '高级', '黑板'].includes(n.category)
  );
  
  let currentNodes = availableNodes;
  if (graphType === 'query') {
    currentNodes = activeTab === 'query' ? queryNodes : computeNodes;
  } else if (graphType === 'function') {
    currentNodes = activeTab === 'function' ? functionNodes : computeNodes;
  }
    
  const currentCategories = [...new Set(currentNodes.map(n => n.category))];

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-64 bg-[#252526] border-r border-[#3e3e42] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[#3e3e42]">
        <span className="text-sm font-semibold text-white/90">节点库</span>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {(graphType === 'query' || graphType === 'function') && (
        <div className="flex border-b border-[#3e3e42]">
          <button
            onClick={() => setActiveTab(graphType === 'query' ? 'query' : 'function')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === (graphType === 'query' ? 'query' : 'function')
                ? 'bg-[#0e639c] text-white' 
                : 'text-white/60 hover:text-white/90 hover:bg-[#2d2d30]'
            }`}
          >
            {graphType === 'query' ? '查询节点' : '函数节点'}
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
      )}
      
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
        {currentCategories.map(category => (
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