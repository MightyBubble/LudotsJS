import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import NodePort from '../graph/NodePort';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const nodeTypeColors = {
  entity_source: '#60a5fa',
  filter_prototype: '#34d399',
  filter_attribute: '#34d399',
  filter_tag: '#34d399',
  filter_relation: '#34d399',
  spatial_distance: '#f59e0b',
  spatial_pathfinding: '#f59e0b',
  spatial_area: '#f59e0b',
  spatial_nearest: '#f59e0b',
  logic_and: '#8b5cf6',
  logic_or: '#8b5cf6',
  logic_not: '#8b5cf6',
  output: '#ef4444'
};

const nodeTypeLabels = {
  entity_source: '实体源',
  filter_prototype: '原型过滤',
  filter_attribute: '属性过滤',
  filter_tag: '标签过滤',
  filter_relation: '关系过滤',
  spatial_distance: '直线距离',
  spatial_pathfinding: '寻路距离',
  spatial_area: '区域范围',
  spatial_nearest: '最近N个',
  logic_and: '逻辑与(AND)',
  logic_or: '逻辑或(OR)',
  logic_not: '逻辑非(NOT)',
  output: '输出结果'
};

export default function QueryNode({ 
  node,
  isSelected = false,
  onUpdatePosition,
  onUpdateData,
  onDelete,
  onSelect,
  onConnectionStart,
  onConnectionEnd,
  prototypes = [],
  attributes = [],
  tags = [],
  relations = []
}) {
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const accentColor = nodeTypeColors[node?.type] || '#6b7280';

  if (!node || !node.position) {
    return null;
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    
    if (e.target.closest('.node-port') || e.target.closest('.delete-button') || 
        e.target.closest('input') || e.target.closest('select') || e.target.closest('[role="combobox"]')) {
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

  const getAttributeKeys = (attributeId) => {
    const attr = attributes.find(a => a.attribute_id === attributeId);
    return (attr?.keys || []).map(k => k.name).filter(k => k);
  };

  const renderNodeContent = () => {
    const data = node.data || {};

    if (node.type === 'filter_prototype') {
      return (
        <Select value={data.prototype_id || ''} onValueChange={(val) => onUpdateData(node.id, { prototype_id: val })}>
          <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择原型" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
            {prototypes.map(p => (
              <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (node.type === 'filter_attribute') {
      return (
        <div className="space-y-2">
          <Select value={data.attribute_id || ''} onValueChange={(val) => onUpdateData(node.id, { attribute_id: val })}>
            <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="属性" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {attributes.map(a => (
                <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={data.attribute_key || ''} onValueChange={(val) => onUpdateData(node.id, { attribute_key: val })}>
            <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="键" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {getAttributeKeys(data.attribute_id).map(k => (
                <SelectItem key={k} value={k} className="text-white text-xs">
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Select value={data.operator || 'gt'} onValueChange={(val) => onUpdateData(node.id, { operator: val })}>
              <SelectTrigger className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                <SelectItem value="eq" className="text-white text-xs">=</SelectItem>
                <SelectItem value="ne" className="text-white text-xs">≠</SelectItem>
                <SelectItem value="gt" className="text-white text-xs">&gt;</SelectItem>
                <SelectItem value="gte" className="text-white text-xs">≥</SelectItem>
                <SelectItem value="lt" className="text-white text-xs">&lt;</SelectItem>
                <SelectItem value="lte" className="text-white text-xs">≤</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={data.value || 0}
              onChange={(e) => onUpdateData(node.id, { value: parseFloat(e.target.value) || 0 })}
              className="h-6 w-16 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
        </div>
      );
    }

    if (node.type === 'filter_tag') {
      return (
        <div className="space-y-2">
          <Select value={data.operator || 'has'} onValueChange={(val) => onUpdateData(node.id, { operator: val })}>
            <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="has" className="text-white text-xs">拥有</SelectItem>
              <SelectItem value="not_has" className="text-white text-xs">没有</SelectItem>
            </SelectContent>
          </Select>
          <Select value={data.tag_path || ''} onValueChange={(val) => onUpdateData(node.id, { tag_path: val })}>
            <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="选择标签" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d] max-h-48">
              {tags.map(t => (
                <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                  {t.full_path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (node.type === 'filter_relation') {
      return (
        <div className="space-y-2">
          <Select value={data.relation_id || ''} onValueChange={(val) => onUpdateData(node.id, { relation_id: val })}>
            <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="关系" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {relations.map(r => (
                <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={data.role || 'source'} onValueChange={(val) => onUpdateData(node.id, { role: val })}>
            <SelectTrigger className="h-6 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="source" className="text-white text-xs">作为源</SelectItem>
              <SelectItem value="target" className="text-white text-xs">作为目标</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (node.type === 'spatial_distance') {
      return (
        <div className="space-y-2">
          <div className="text-[10px] text-white/50">中心点</div>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="X"
              value={data.center_x || 0}
              onChange={(e) => onUpdateData(node.id, { center_x: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
            <Input
              type="number"
              placeholder="Y"
              value={data.center_y || 0}
              onChange={(e) => onUpdateData(node.id, { center_y: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-xs text-white/70">半径≤</span>
            <Input
              type="number"
              value={data.radius || 100}
              onChange={(e) => onUpdateData(node.id, { radius: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
        </div>
      );
    }

    if (node.type === 'spatial_pathfinding') {
      return (
        <div className="space-y-2">
          <div className="text-[10px] text-white/50">起点</div>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="X"
              value={data.start_x || 0}
              onChange={(e) => onUpdateData(node.id, { start_x: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
            <Input
              type="number"
              placeholder="Y"
              value={data.start_y || 0}
              onChange={(e) => onUpdateData(node.id, { start_y: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-xs text-white/70">路径≤</span>
            <Input
              type="number"
              value={data.max_distance || 100}
              onChange={(e) => onUpdateData(node.id, { max_distance: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
        </div>
      );
    }

    if (node.type === 'spatial_area') {
      return (
        <div className="space-y-2">
          <div className="text-[10px] text-white/50">区域</div>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="MinX"
              value={data.min_x || 0}
              onChange={(e) => onUpdateData(node.id, { min_x: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
            <Input
              type="number"
              placeholder="MinY"
              value={data.min_y || 0}
              onChange={(e) => onUpdateData(node.id, { min_y: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="MaxX"
              value={data.max_x || 100}
              onChange={(e) => onUpdateData(node.id, { max_x: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
            <Input
              type="number"
              placeholder="MaxY"
              value={data.max_y || 100}
              onChange={(e) => onUpdateData(node.id, { max_y: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
        </div>
      );
    }

    if (node.type === 'spatial_nearest') {
      return (
        <div className="space-y-2">
          <div className="text-[10px] text-white/50">参考点</div>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="X"
              value={data.ref_x || 0}
              onChange={(e) => onUpdateData(node.id, { ref_x: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
            <Input
              type="number"
              placeholder="Y"
              value={data.ref_y || 0}
              onChange={(e) => onUpdateData(node.id, { ref_y: parseFloat(e.target.value) || 0 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
          </div>
          <div className="flex gap-1 items-center">
            <span className="text-xs text-white/70">取前</span>
            <Input
              type="number"
              value={data.count || 5}
              onChange={(e) => onUpdateData(node.id, { count: parseInt(e.target.value) || 1 })}
              className="h-6 flex-1 bg-[#2d2d30] border-[#434343] text-xs text-white px-2"
            />
            <span className="text-xs text-white/70">个</span>
          </div>
        </div>
      );
    }

    return null;
  };

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
        border: isSelected ? `2px solid ${accentColor}` : '1px solid #1a1a1a',
        boxShadow: isSelected ? `0 0 0 2px ${accentColor}40, 0 4px 12px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.5)',
        transition: 'border 0.2s, box-shadow 0.2s'
      }}
      onMouseDown={handleMouseDown}
    >
      <div 
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ 
          borderColor: '#2a2a2a',
          background: 'linear-gradient(180deg, #3e3e42 0%, #3a3a3a 100%)'
        }}
      >
        <span className="font-medium text-xs text-white/95">
          {nodeTypeLabels[node.type] || node.type}
        </span>
        <button
          className="delete-button text-white/30 hover:text-white/80 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(node.id);
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-0">
        {node.inputs && node.inputs.length > 0 && (
          <div className="space-y-1.5 mb-2">
            {node.inputs.map(input => (
              <NodePort
                key={input.id}
                nodeId={node.id}
                port={input}
                type="input"
                onStartConnection={onConnectionStart}
                onEndConnection={onConnectionEnd}
              />
            ))}
          </div>
        )}

        {renderNodeContent()}

        {node.outputs && node.outputs.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {node.outputs.map(output => (
              <NodePort
                key={output.id}
                nodeId={node.id}
                port={output}
                type="output"
                onStartConnection={onConnectionStart}
                onEndConnection={onConnectionEnd}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}