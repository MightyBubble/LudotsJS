import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getAvailableNodes, getCategories } from './nodeConfigs';
import { useI18n } from '@/i18n/I18nProvider';

export default function UnifiedNodeLibrary({ graphType = 'data', onAddNode, onClose }) {
  const [activeTab, setActiveTab] = useState(
    graphType === 'query' ? 'query' : graphType === 'function' ? 'function' : 'compute'
  );
  const { locale } = useI18n();
  const availableNodes = getAvailableNodes(graphType).map(node => ({ ...node, localized: node.getLocalizedText?.(locale) }));
  const categories = getCategories(graphType);
  
  // 区分不同类型的节点
  const queryNodes = availableNodes.filter(n => 
    ['源', '过滤', '空间', '逻辑', '排序', '限制', '输出'].includes(n.category)
  );
  const functionNodes = availableNodes.filter(n => 
    n.category.startsWith('函数-')
  );
  const computeNodes = availableNodes.filter(n => 
    ['基础', '数学', '聚合', '向量', '高级', '黑板', '数据表'].includes(n.category)
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
    <div className="w-56 bg-[#15171C] border-r border-[#2A2E37] flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-[#2A2E37]">
        <span className="text-xs font-semibold text-[#e5e5e5]">节点库</span>
        <button onClick={onClose} className="text-gray-500 hover:text-[#e5e5e5] transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {(graphType === 'query' || graphType === 'function') && (
        <div className="flex border-b border-[#2A2E37]">
          <button
            onClick={() => setActiveTab(graphType === 'query' ? 'query' : 'function')}
            className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
              activeTab === (graphType === 'query' ? 'query' : 'function')
                ? 'bg-[#D97706] text-black' 
                : 'text-gray-400 hover:text-[#e5e5e5] hover:bg-[#262626]'
            }`}
          >
            {graphType === 'query' ? '查询' : '函数'}
          </button>
          <button
            onClick={() => setActiveTab('compute')}
            className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
              activeTab === 'compute' 
                ? 'bg-[#D97706] text-black' 
                : 'text-gray-400 hover:text-[#e5e5e5] hover:bg-[#262626]'
            }`}
          >
            运算
          </button>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-2 space-y-3" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#333 #141414'
      }}>
        <style>{`
          .flex-1::-webkit-scrollbar { width: 8px; }
          .flex-1::-webkit-scrollbar-track { background: #15171C; }
          .flex-1::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
          .flex-1::-webkit-scrollbar-thumb:hover { background: #444; }
        `}</style>
        {currentCategories.map(category => (
          <div key={category}>
            <div className="text-[10px] font-semibold text-gray-500 mb-1 px-1">{category}</div>
            <div className="space-y-0.5">
              {currentNodes.filter(n => n.category === category).map(nodeType => {
                const Icon = nodeType.icon;
                return (
                  <div
                    key={nodeType.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, nodeType.type)}
                    onClick={() => onAddNode(nodeType.type)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-all hover:bg-[#262626] active:scale-95 border-l-2 border-[#2A2E37] hover:border-[#D97706]"
                  >
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="min-w-0">
                      <span className="block text-[11px] text-[#e5e5e5]">{nodeType.localized?.label || nodeType.label}</span>
                      {nodeType.localized && <span className="block truncate text-[9px] text-gray-500">{nodeType.localized.secondary} · {nodeType.localized.description}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-[#2A2E37] text-[10px] text-gray-600 text-center">拖拽或点击添加</div>
    </div>
  );
}