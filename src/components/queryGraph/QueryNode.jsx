import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import NodePort from '../graph/NodePort';

const nodeAccentColors = {
  'entity_source': '#0e639c',
  'filter_prototype': '#70ad47',
  'filter_attribute': '#9b6bb3',
  'filter_tag': '#ffc000',
  'filter_relation': '#e67e22',
  'spatial_distance': '#c97fff',
  'spatial_area': '#c97fff',
  'logic_and': '#d9534f',
  'logic_or': '#d9534f',
  'logic_not': '#d9534f',
  'output': '#5cb85c'
};

const nodeLabels = {
  'entity_source': '实体源',
  'filter_prototype': '原型过滤',
  'filter_attribute': '属性过滤',
  'filter_tag': '标签过滤',
  'filter_relation': '关系过滤',
  'spatial_distance': '距离查询',
  'spatial_area': '区域查询',
  'logic_and': '逻辑与',
  'logic_or': '逻辑或',
  'logic_not': '逻辑非',
  'output': '输出'
};

export default function QueryNode({ 
  node,
  selected = false,
  connectedInputPorts,
  onUpdatePosition,
  onUpdateData,
  onDelete,
  onSelect,
  onStartConnection,
  onEndConnection,
  prototypes = [],
  attributes = [],
  tags = [],
  relations = []
}) {
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const accentColor = nodeAccentColors[node?.type] || '#6b7280';

  if (!node || !node.position) {
    return null;
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    
    if (e.target.closest('.node-port') || e.target.closest('.delete-button')) {
      return;
    }
    
    const multiSelect = e.ctrlKey || e.metaKey;
    onSelect?.(node.id, multiSelect);
    
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: node.position.x || 0,
      nodeY: node.position.y || 0
    };
    e.stopPropagation();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const parent = nodeRef.current?.parentElement?.parentElement;
    if (!parent) return;

    const transform = parent.style.transform;
    const scaleMatch = transform.match(/scale\(([\d.]+)\)/);
    const scale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;

    const dx = (e.clientX - dragStartRef.current.x) / scale;
    const dy = (e.clientY - dragStartRef.current.y) / scale;

    onUpdatePosition(node.id, {
      x: dragStartRef.current.nodeX + dx,
      y: dragStartRef.current.nodeY + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div
      ref={nodeRef}
      className="absolute rounded shadow-2xl select-none cursor-move"
      style={{
        left: node.position.x ?? 0,
        top: node.position.y ?? 0,
        width: '220px',
        backgroundColor: '#3c3c3c',
        borderLeft: `3px solid ${accentColor}`,
        border: selected ? `2px solid ${accentColor}` : '1px solid #1a1a1a',
        boxShadow: selected ? `0 0 0 2px ${accentColor}40, 0 4px 12px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'border 0.2s, box-shadow 0.2s'
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#2a2a2a', background: 'linear-gradient(180deg, #3e3e42 0%, #3a3a3a 100%)' }}>
        <span className="font-medium text-xs text-white/95">{nodeLabels[node.type] || node.type}</span>
        <button className="delete-button text-white/30 hover:text-white/80 transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        <div className="text-white/60 text-xs">类型: {node.type}</div>
        
        {node.inputs && node.inputs.length > 0 && (
          <div className="space-y-1.5">
            {node.inputs.map(input => (
              <NodePort key={input.id} nodeId={node.id} port={input} type="input" onStartConnection={onStartConnection} onEndConnection={onEndConnection} />
            ))}
          </div>
        )}
        
        {node.outputs && node.outputs.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {node.outputs.map(output => (
              <NodePort key={output.id} nodeId={node.id} port={output} type="output" onStartConnection={onStartConnection} onEndConnection={onEndConnection} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}