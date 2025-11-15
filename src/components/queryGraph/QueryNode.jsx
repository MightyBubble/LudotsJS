import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import NodePort from '../graph/NodePort';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const nodeAccentColors = {
  'entity_source': '#0e639c',
  'filter_prototype': '#70ad47',
  'filter_attribute': '#9b6bb3',
  'filter_tag': '#ffc000',
  'filter_relation': '#e67e22',
  'spatial_distance': '#c97fff',
  'spatial_pathfinding': '#c97fff',
  'spatial_area': '#c97fff',
  'spatial_nearest': '#c97fff',
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
  'spatial_pathfinding': '寻路查询',
  'spatial_area': '区域查询',
  'spatial_nearest': '最近查询',
  'logic_and': '逻辑与',
  'logic_or': '逻辑或',
  'logic_not': '逻辑非',
  'output': '输出'
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
  const accentColor = nodeAccentColors[node?.type] || '#6b7280';

  if (!node || !node.position) {
    return null;
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    
    if (e.target.closest('.node-port') || 
        e.target.closest('.delete-button') || 
        e.target.closest('input') ||
        e.target.closest('button[role="combobox"]')) {
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

  const renderInlineInputs = () => {
    if (!node.data) {
      node.data = {};
    }

    if (node.type === 'entity_source') {
      return <div className="text-white/60 text-xs">所有实体</div>;
    }

    if (node.type === 'filter_prototype') {
      return (
        <div className="space-y-2">
          <Select
            value={node.data?.prototypeId || ''}
            onValueChange={(val) => onUpdateData(node.id, { prototypeId: val })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="选择原型" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
              {prototypes.map(p => (
                <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (node.type === 'filter_attribute') {
      return (
        <div className="space-y-2">
          <Select
            value={node.data?.attributeId || ''}
            onValueChange={(val) => onUpdateData(node.id, { attributeId: val, key: '' })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="选择属性" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
              {attributes.map(a => (
                <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {node.data?.attributeId && (
            <Select
              value={node.data?.key || ''}
              onValueChange={(val) => onUpdateData(node.id, { key: val })}
            >
              <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
                <SelectValue placeholder="选择键" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                {getAttributeKeys(node.data.attributeId).map(k => (
                  <SelectItem key={k} value={k} className="text-white text-xs">
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex gap-2">
            <Select
              value={node.data?.operator || 'gt'}
              onValueChange={(val) => onUpdateData(node.id, { operator: val })}
            >
              <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                <SelectItem value="gt" className="text-white text-xs">&gt;</SelectItem>
                <SelectItem value="gte" className="text-white text-xs">≥</SelectItem>
                <SelectItem value="lt" className="text-white text-xs">&lt;</SelectItem>
                <SelectItem value="lte" className="text-white text-xs">≤</SelectItem>
                <SelectItem value="eq" className="text-white text-xs">=</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="值"
              value={node.data?.threshold ?? 0}
              onChange={(e) => onUpdateData(node.id, { threshold: parseFloat(e.target.value) || 0 })}
              className="h-7 text-xs bg-[#2d2d30] border-[#434343] text-white flex-1"
            />
          </div>
        </div>
      );
    }

    if (node.type === 'filter_tag') {
      return (
        <div className="space-y-2">
          <Select
            value={node.data?.tagPath || ''}
            onValueChange={(val) => onUpdateData(node.id, { tagPath: val })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="选择标签" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42] max-h-60">
              {tags.map(t => (
                <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                  {t.full_path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={node.data?.mode || 'has'}
            onValueChange={(val) => onUpdateData(node.id, { mode: val })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
              <SelectItem value="has" className="text-white text-xs">拥有</SelectItem>
              <SelectItem value="not_has" className="text-white text-xs">不拥有</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (node.type === 'filter_relation') {
      return (
        <div className="space-y-2">
          <Select
            value={node.data?.relationId || ''}
            onValueChange={(val) => onUpdateData(node.id, { relationId: val })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="选择关系" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
              {relations.map(r => (
                <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={node.data?.direction || 'source'}
            onValueChange={(val) => onUpdateData(node.id, { direction: val })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
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
          <Input
            type="number"
            placeholder="最大距离"
            value={node.data?.maxDistance ?? 100}
            onChange={(e) => onUpdateData(node.id, { maxDistance: parseFloat(e.target.value) || 0 })}
            className="h-7 text-xs bg-[#2d2d30] border-[#434343] text-white"
          />
          <div className="grid grid-cols-3 gap-1">
            <Input type="number" placeholder="X" value={node.data?.x ?? 0} onChange={(e) => onUpdateData(node.id, { x: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Y" value={node.data?.y ?? 0} onChange={(e) => onUpdateData(node.id, { y: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Z" value={node.data?.z ?? 0} onChange={(e) => onUpdateData(node.id, { z: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
          </div>
        </div>
      );
    }

    if (node.type === 'spatial_pathfinding') {
      return (
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="最大路径长度"
            value={node.data?.maxPathLength ?? 1000}
            onChange={(e) => onUpdateData(node.id, { maxPathLength: parseFloat(e.target.value) || 0 })}
            className="h-7 text-xs bg-[#2d2d30] border-[#434343] text-white"
          />
          <div className="text-[10px] text-white/40">起点</div>
          <div className="grid grid-cols-3 gap-1">
            <Input type="number" placeholder="X" value={node.data?.startX ?? 0} onChange={(e) => onUpdateData(node.id, { startX: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Y" value={node.data?.startY ?? 0} onChange={(e) => onUpdateData(node.id, { startY: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Z" value={node.data?.startZ ?? 0} onChange={(e) => onUpdateData(node.id, { startZ: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
          </div>
          <div className="text-[10px] text-white/40">终点</div>
          <div className="grid grid-cols-3 gap-1">
            <Input type="number" placeholder="X" value={node.data?.endX ?? 0} onChange={(e) => onUpdateData(node.id, { endX: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Y" value={node.data?.endY ?? 0} onChange={(e) => onUpdateData(node.id, { endY: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Z" value={node.data?.endZ ?? 0} onChange={(e) => onUpdateData(node.id, { endZ: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
          </div>
        </div>
      );
    }

    if (node.type === 'spatial_area') {
      return (
        <div className="space-y-2">
          <Select
            value={node.data?.shape || 'sphere'}
            onValueChange={(val) => onUpdateData(node.id, { shape: val })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
              <SelectItem value="sphere" className="text-white text-xs">球体</SelectItem>
              <SelectItem value="box" className="text-white text-xs">方块</SelectItem>
              <SelectItem value="cylinder" className="text-white text-xs">圆柱</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-[10px] text-white/40">中心点</div>
          <div className="grid grid-cols-3 gap-1">
            <Input type="number" placeholder="X" value={node.data?.centerX ?? 0} onChange={(e) => onUpdateData(node.id, { centerX: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Y" value={node.data?.centerY ?? 0} onChange={(e) => onUpdateData(node.id, { centerY: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Z" value={node.data?.centerZ ?? 0} onChange={(e) => onUpdateData(node.id, { centerZ: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
          </div>
          <div className="text-[10px] text-white/40">大小</div>
          <div className="grid grid-cols-3 gap-1">
            <Input type="number" placeholder="W" value={node.data?.sizeX ?? 10} onChange={(e) => onUpdateData(node.id, { sizeX: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="H" value={node.data?.sizeY ?? 10} onChange={(e) => onUpdateData(node.id, { sizeY: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="D" value={node.data?.sizeZ ?? 10} onChange={(e) => onUpdateData(node.id, { sizeZ: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
          </div>
        </div>
      );
    }

    if (node.type === 'spatial_nearest') {
      return (
        <div className="space-y-2">
          <Input
            type="number"
            placeholder="返回数量"
            value={node.data?.count ?? 1}
            onChange={(e) => onUpdateData(node.id, { count: parseInt(e.target.value) || 1 })}
            className="h-7 text-xs bg-[#2d2d30] border-[#434343] text-white"
          />
          <div className="text-[10px] text-white/40">参考点</div>
          <div className="grid grid-cols-3 gap-1">
            <Input type="number" placeholder="X" value={node.data?.refX ?? 0} onChange={(e) => onUpdateData(node.id, { refX: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Y" value={node.data?.refY ?? 0} onChange={(e) => onUpdateData(node.id, { refY: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
            <Input type="number" placeholder="Z" value={node.data?.refZ ?? 0} onChange={(e) => onUpdateData(node.id, { refZ: parseFloat(e.target.value) || 0 })} className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white" />
          </div>
        </div>
      );
    }

    if (node.inputs && node.inputs.length > 0) {
      return (
        <div className="space-y-1.5">
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
          {nodeLabels[node.type] || node.type}
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
        {renderInlineInputs()}

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