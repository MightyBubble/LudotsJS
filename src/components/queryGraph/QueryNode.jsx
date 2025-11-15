import React from "react";
import { Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import NodePort from "../graph/NodePort";

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
  onDelete, 
  onUpdateData, 
  onUpdatePosition,
  onConnectionStart,
  onConnectionEnd,
  isSelected,
  prototypes,
  attributes,
  tags,
  relations,
  hasConnectedInput
}) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const nodeRef = React.useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.node-port') || e.target.closest('input') || e.target.closest('select')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - node.position.x,
      y: e.clientY - node.position.y
    });
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      onUpdatePosition(node.id, {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, node.id, onUpdatePosition]);

  const color = nodeTypeColors[node.type] || '#6b7280';

  const getAttributeKeys = (attributeId) => {
    const attr = attributes.find(a => a.attribute_id === attributeId);
    return (attr?.keys || []).map(k => k.name).filter(k => k);
  };

  return (
    <div
      ref={nodeRef}
      onMouseDown={handleMouseDown}
      className={`absolute bg-[#2d2d2d] rounded border-2 ${isSelected ? 'border-blue-500' : 'border-[#3d3d3d]'} shadow-lg`}
      style={{
        left: node.position.x,
        top: node.position.y,
        minWidth: '200px',
        cursor: isDragging ? 'grabbing' : 'grab',
        borderTopColor: color
      }}
    >
      <div className="px-3 py-2 border-b border-[#3d3d3d] flex items-center justify-between" style={{ backgroundColor: `${color}20` }}>
        <span className="text-xs font-semibold text-white">{nodeTypeLabels[node.type]}</span>
        <button onClick={() => onDelete(node.id)} className="text-white/30 hover:text-red-400">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        {node.type === 'filter_prototype' && (
          <Select value={node.data?.prototype_id || ''} onValueChange={(val) => onUpdateData(node.id, { prototype_id: val })}>
            <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
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
        )}

        {node.type === 'filter_attribute' && (
          <>
            <Select value={node.data?.attribute_id || ''} onValueChange={(val) => onUpdateData(node.id, { attribute_id: val })}>
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
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
            <Select value={node.data?.attribute_key || ''} onValueChange={(val) => onUpdateData(node.id, { attribute_key: val })}>
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                <SelectValue placeholder="键" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                {getAttributeKeys(node.data?.attribute_id).map(k => (
                  <SelectItem key={k} value={k} className="text-white text-xs">
                    {k}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Select value={node.data?.operator || 'gt'} onValueChange={(val) => onUpdateData(node.id, { operator: val })}>
                <SelectTrigger className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
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
                value={node.data?.value || 0}
                onChange={(e) => onUpdateData(node.id, { value: parseFloat(e.target.value) || 0 })}
                className="h-6 w-20 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
          </>
        )}

        {node.type === 'filter_tag' && (
          <>
            <Select value={node.data?.operator || 'has'} onValueChange={(val) => onUpdateData(node.id, { operator: val })}>
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                <SelectItem value="has" className="text-white text-xs">拥有</SelectItem>
                <SelectItem value="not_has" className="text-white text-xs">没有</SelectItem>
              </SelectContent>
            </Select>
            <Select value={node.data?.tag_path || ''} onValueChange={(val) => onUpdateData(node.id, { tag_path: val })}>
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
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
          </>
        )}

        {node.type === 'filter_relation' && (
          <>
            <Select value={node.data?.relation_id || ''} onValueChange={(val) => onUpdateData(node.id, { relation_id: val })}>
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
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
            <Select value={node.data?.role || 'source'} onValueChange={(val) => onUpdateData(node.id, { role: val })}>
              <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                <SelectItem value="source" className="text-white text-xs">作为源实体</SelectItem>
                <SelectItem value="target" className="text-white text-xs">作为目标实体</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        {node.type === 'spatial_distance' && (
          <>
            <div className="text-[10px] text-white/50 mb-1">中心点坐标</div>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="X"
                value={node.data?.center_x || 0}
                onChange={(e) => onUpdateData(node.id, { center_x: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
              <Input
                type="number"
                placeholder="Y"
                value={node.data?.center_y || 0}
                onChange={(e) => onUpdateData(node.id, { center_y: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-xs text-white/70">半径 ≤</span>
              <Input
                type="number"
                value={node.data?.radius || 100}
                onChange={(e) => onUpdateData(node.id, { radius: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
          </>
        )}

        {node.type === 'spatial_pathfinding' && (
          <>
            <div className="text-[10px] text-white/50 mb-1">起点坐标</div>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="X"
                value={node.data?.start_x || 0}
                onChange={(e) => onUpdateData(node.id, { start_x: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
              <Input
                type="number"
                placeholder="Y"
                value={node.data?.start_y || 0}
                onChange={(e) => onUpdateData(node.id, { start_y: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-xs text-white/70">路径距离 ≤</span>
              <Input
                type="number"
                value={node.data?.max_distance || 100}
                onChange={(e) => onUpdateData(node.id, { max_distance: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
          </>
        )}

        {node.type === 'spatial_area' && (
          <>
            <div className="text-[10px] text-white/50 mb-1">区域范围</div>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="MinX"
                value={node.data?.min_x || 0}
                onChange={(e) => onUpdateData(node.id, { min_x: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
              <Input
                type="number"
                placeholder="MinY"
                value={node.data?.min_y || 0}
                onChange={(e) => onUpdateData(node.id, { min_y: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="MaxX"
                value={node.data?.max_x || 100}
                onChange={(e) => onUpdateData(node.id, { max_x: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
              <Input
                type="number"
                placeholder="MaxY"
                value={node.data?.max_y || 100}
                onChange={(e) => onUpdateData(node.id, { max_y: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
          </>
        )}

        {node.type === 'spatial_nearest' && (
          <>
            <div className="text-[10px] text-white/50 mb-1">参考点坐标</div>
            <div className="flex gap-1">
              <Input
                type="number"
                placeholder="X"
                value={node.data?.ref_x || 0}
                onChange={(e) => onUpdateData(node.id, { ref_x: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
              <Input
                type="number"
                placeholder="Y"
                value={node.data?.ref_y || 0}
                onChange={(e) => onUpdateData(node.id, { ref_y: parseFloat(e.target.value) || 0 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
            <div className="flex gap-1 items-center">
              <span className="text-xs text-white/70">取前</span>
              <Input
                type="number"
                value={node.data?.count || 5}
                onChange={(e) => onUpdateData(node.id, { count: parseInt(e.target.value) || 1 })}
                className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
              <span className="text-xs text-white/70">个</span>
            </div>
          </>
        )}
      </div>

      <div className="relative">
        {node.inputs?.map((input, idx) => (
          <NodePort
            key={input.id}
            port={input}
            nodeId={node.id}
            isInput={true}
            onConnectionStart={onConnectionStart}
            onConnectionEnd={onConnectionEnd}
            isConnected={hasConnectedInput(node.id, input.id)}
          />
        ))}
        {node.outputs?.map((output, idx) => (
          <NodePort
            key={output.id}
            port={output}
            nodeId={node.id}
            isInput={false}
            onConnectionStart={onConnectionStart}
            onConnectionEnd={onConnectionEnd}
          />
        ))}
      </div>
    </div>
  );
}