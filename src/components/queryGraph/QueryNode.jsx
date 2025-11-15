
import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import NodePort from '../graph/NodePort';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const nodeAccentColors = {
  entity_source: '#0e639c',
  filter_prototype: '#70ad47',
  filter_attribute: '#9b6bb3',
  filter_tag: '#ffc000',
  filter_relation: '#e67e22',
  filter_relation_attribute: '#e67e22', // New
  filter_relation_tag: '#e67e22', // New
  filter_related_entity_attribute: '#9b6bb3', // New
  filter_related_entity_tag: '#ffc000', // New
  spatial_distance: '#c97fff',
  spatial_area: '#c97fff',
  logic_intersect: '#d9534f',
  logic_union: '#d9534f',
  logic_difference: '#d9534f',
  sort_by_attribute: '#5bc0de',
  sort_by_relation: '#5bc0de',
  sort_by_tag: '#5bc0de',
  limit_top: '#17a2b8',
  limit_bottom: '#17a2b8',
  limit_percent_top: '#17a2b8',
  limit_percent_bottom: '#17a2b8',
  output: '#5cb85c'
};

const nodeLabels = {
  entity_source: '实体源',
  filter_prototype: '原型过滤',
  filter_attribute: '属性过滤',
  filter_tag: '标签过滤',
  filter_relation: '关系过滤',
  filter_relation_attribute: '关系属性过滤', // New
  filter_relation_tag: '关系标签过滤', // New
  filter_related_entity_attribute: '关联实体属性过滤', // New
  filter_related_entity_tag: '关联实体标签过滤', // New
  spatial_distance: '距离查询',
  spatial_area: '区域查询',
  logic_intersect: '交集',
  logic_union: '并集',
  logic_difference: '差集',
  sort_by_attribute: '按属性排序',
  sort_by_relation: '按关系排序',
  sort_by_tag: '按标签排序',
  limit_top: '取前N名',
  limit_bottom: '取后N名',
  limit_percent_top: '取前N%',
  limit_percent_bottom: '取后N%',
  output: '输出'
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
  onEndConnection 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const accentColor = nodeAccentColors[node?.type] || '#6c757d';

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  if (!node || !node.position) {
    return null;
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    
    if (e.target.closest('.node-port') || e.target.closest('.delete-button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('[role="combobox"]')) {
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

  const getRelationAttributes = (relationId) => {
    const relation = relations.find(r => r.relation_id === relationId);
    return (relation?.relation_attributes || []);
  };

  const renderNodeContent = () => {
    const data = node.data || {};

    switch (node.type) {
      case 'entity_source':
        return <div className="text-xs text-white/60">所有实体</div>;

      case 'filter_prototype':
        return (
          <div className="space-y-2">
            <Select value={data.prototypeId || ''} onValueChange={(v) => onUpdateData(node.id, { prototypeId: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择原型" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {prototypes.map(p => (
                  <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                    {p.name} ({p.prototype_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'filter_attribute':
        const attrKeys = getAttributeKeys(data.attributeId);
        return (
          <div className="space-y-2">
            <Select value={data.attributeId || ''} onValueChange={(v) => onUpdateData(node.id, { attributeId: v, key: '' })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择属性" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {attributes.map(attr => (
                  <SelectItem key={attr.id} value={attr.attribute_id} className="text-white text-xs">
                    {attr.name} ({attr.attribute_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data.attributeId && (
              <Select value={data.key || ''} onValueChange={(v) => onUpdateData(node.id, { key: v })}>
                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                  <SelectValue placeholder="选择键" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#434343]">
                  {attrKeys.map(key => (
                    <SelectItem key={key} value={key} className="text-white text-xs">
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={data.operator || 'gt'} onValueChange={(v) => onUpdateData(node.id, { operator: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="gt" className="text-white text-xs">大于</SelectItem>
                <SelectItem value="gte" className="text-white text-xs">大于等于</SelectItem>
                <SelectItem value="lt" className="text-white text-xs">小于</SelectItem>
                <SelectItem value="lte" className="text-white text-xs">小于等于</SelectItem>
                <SelectItem value="eq" className="text-white text-xs">等于</SelectItem>
                <SelectItem value="ne" className="text-white text-xs">不等于</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="阈值"
              value={data.threshold ?? 0}
              onChange={(e) => onUpdateData(node.id, { threshold: parseFloat(e.target.value) || 0 })}
              className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
            />
          </div>
        );

      case 'filter_tag':
        return (
          <div className="space-y-2">
            <Select value={data.tagPath || ''} onValueChange={(v) => onUpdateData(node.id, { tagPath: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.full_path} className="text-white text-xs">
                    {tag.name} ({tag.full_path})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.mode || 'has'} onValueChange={(v) => onUpdateData(node.id, { mode: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="has" className="text-white text-xs">拥有</SelectItem>
                <SelectItem value="not_has" className="text-white text-xs">不拥有</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'filter_relation':
        return (
          <div className="space-y-2">
            <Select value={data.relationId || ''} onValueChange={(v) => onUpdateData(node.id, { relationId: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {relations.map(rel => (
                  <SelectItem key={rel.id} value={rel.relation_id} className="text-white text-xs">
                    {rel.name} ({rel.relation_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.direction || 'source'} onValueChange={(v) => onUpdateData(node.id, { direction: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="source" className="text-white text-xs">作为源</SelectItem>
                <SelectItem value="target" className="text-white text-xs">作为目标</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'filter_relation_attribute':
        const relAttrIds = getRelationAttributes(data.relationId);
        const relAttrKeys = getAttributeKeys(data.attributeId);
        return (
          <div className="space-y-2">
            <Select value={data.relationId || ''} onValueChange={(v) => onUpdateData(node.id, { relationId: v, attributeId: '', key: '' })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {relations.map(rel => (
                  <SelectItem key={rel.id} value={rel.relation_id} className="text-white text-xs">
                    {rel.name} ({rel.relation_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data.relationId && (
              <Select value={data.attributeId || ''} onValueChange={(v) => onUpdateData(node.id, { attributeId: v, key: '' })}>
                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                  <SelectValue placeholder="选择属性" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#434343]">
                  {relAttrIds.map(attrId => {
                    const attr = attributes.find(a => a.attribute_id === attrId);
                    return attr ? (
                      <SelectItem key={attr.id} value={attr.attribute_id} className="text-white text-xs">
                        {attr.name} ({attr.attribute_id})
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            )}
            {data.attributeId && (
              <Select value={data.key || ''} onValueChange={(v) => onUpdateData(node.id, { key: v })}>
                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                  <SelectValue placeholder="选择键" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#434343]">
                  {relAttrKeys.map(key => (
                    <SelectItem key={key} value={key} className="text-white text-xs">
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={data.operator || 'gt'} onValueChange={(v) => onUpdateData(node.id, { operator: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="gt" className="text-white text-xs">大于</SelectItem>
                <SelectItem value="gte" className="text-white text-xs">大于等于</SelectItem>
                <SelectItem value="lt" className="text-white text-xs">小于</SelectItem>
                <SelectItem value="lte" className="text-white text-xs">小于等于</SelectItem>
                <SelectItem value="eq" className="text-white text-xs">等于</SelectItem>
                <SelectItem value="ne" className="text-white text-xs">不等于</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="阈值"
              value={data.threshold ?? 0}
              onChange={(e) => onUpdateData(node.id, { threshold: parseFloat(e.target.value) || 0 })}
              className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
            />
          </div>
        );

      case 'filter_relation_tag':
        return (
          <div className="space-y-2">
            <Select value={data.relationId || ''} onValueChange={(v) => onUpdateData(node.id, { relationId: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {relations.map(rel => (
                  <SelectItem key={rel.id} value={rel.relation_id} className="text-white text-xs">
                    {rel.name} ({rel.relation_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.tagPath || ''} onValueChange={(v) => onUpdateData(node.id, { tagPath: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.full_path} className="text-white text-xs">
                    {tag.name} ({tag.full_path})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.mode || 'has'} onValueChange={(v) => onUpdateData(node.id, { mode: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="has" className="text-white text-xs">拥有</SelectItem>
                <SelectItem value="not_has" className="text-white text-xs">不拥有</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'filter_related_entity_attribute':
        const relatedAttrKeys = getAttributeKeys(data.attributeId);
        return (
          <div className="space-y-2">
            <Select value={data.relationId || ''} onValueChange={(v) => onUpdateData(node.id, { relationId: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {relations.map(rel => (
                  <SelectItem key={rel.id} value={rel.relation_id} className="text-white text-xs">
                    {rel.name} ({rel.relation_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.attributeId || ''} onValueChange={(v) => onUpdateData(node.id, { attributeId: v, key: '' })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择属性" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {attributes.map(attr => (
                  <SelectItem key={attr.id} value={attr.attribute_id} className="text-white text-xs">
                    {attr.name} ({attr.attribute_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data.attributeId && (
              <Select value={data.key || ''} onValueChange={(v) => onUpdateData(node.id, { key: v })}>
                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                  <SelectValue placeholder="选择键" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#434343]">
                  {relatedAttrKeys.map(key => (
                    <SelectItem key={key} value={key} className="text-white text-xs">
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={data.operator || 'gt'} onValueChange={(v) => onUpdateData(node.id, { operator: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="gt" className="text-white text-xs">大于</SelectItem>
                <SelectItem value="gte" className="text-white text-xs">大于等于</SelectItem>
                <SelectItem value="lt" className="text-white text-xs">小于</SelectItem>
                <SelectItem value="lte" className="text-white text-xs">小于等于</SelectItem>
                <SelectItem value="eq" className="text-white text-xs">等于</SelectItem>
                <SelectItem value="ne" className="text-white text-xs">不等于</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="阈值"
              value={data.threshold ?? 0}
              onChange={(e) => onUpdateData(node.id, { threshold: parseFloat(e.target.value) || 0 })}
              className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
            />
          </div>
        );

      case 'filter_related_entity_tag':
        return (
          <div className="space-y-2">
            <Select value={data.relationId || ''} onValueChange={(v) => onUpdateData(node.id, { relationId: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {relations.map(rel => (
                  <SelectItem key={rel.id} value={rel.relation_id} className="text-white text-xs">
                    {rel.name} ({rel.relation_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.tagPath || ''} onValueChange={(v) => onUpdateData(node.id, { tagPath: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.full_path} className="text-white text-xs">
                    {tag.name} ({tag.full_path})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.mode || 'has'} onValueChange={(v) => onUpdateData(node.id, { mode: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="has" className="text-white text-xs">拥有</SelectItem>
                <SelectItem value="not_has" className="text-white text-xs">不拥有</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'spatial_distance':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="最大距离"
              value={data.maxDistance ?? 100}
              onChange={(e) => onUpdateData(node.id, { maxDistance: parseFloat(e.target.value) || 0 })}
              className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
            />
            <div className="grid grid-cols-3 gap-1">
              <Input
                type="number"
                placeholder="X"
                value={data.x ?? 0}
                onChange={(e) => onUpdateData(node.id, { x: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
              <Input
                type="number"
                placeholder="Y"
                value={data.y ?? 0}
                onChange={(e) => onUpdateData(node.id, { y: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
              <Input
                type="number"
                placeholder="Z"
                value={data.z ?? 0}
                onChange={(e) => onUpdateData(node.id, { z: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
            </div>
          </div>
        );

      case 'spatial_area':
        return (
          <div className="space-y-2">
            <Select value={data.shape || 'sphere'} onValueChange={(v) => onUpdateData(node.id, { shape: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="sphere" className="text-white text-xs">球形</SelectItem>
                <SelectItem value="box" className="text-white text-xs">方形</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-[10px] text-white/40">中心点</div>
            <div className="grid grid-cols-3 gap-1">
              <Input
                type="number"
                placeholder="X"
                value={data.centerX ?? 0}
                onChange={(e) => onUpdateData(node.id, { centerX: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
              <Input
                type="number"
                placeholder="Y"
                value={data.centerY ?? 0}
                onChange={(e) => onUpdateData(node.id, { centerY: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
              <Input
                type="number"
                placeholder="Z"
                value={data.centerZ ?? 0}
                onChange={(e) => onUpdateData(node.id, { centerZ: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
            </div>
            <div className="text-[10px] text-white/40">大小</div>
            <div className="grid grid-cols-3 gap-1">
              <Input
                type="number"
                placeholder="X"
                value={data.sizeX ?? 10}
                onChange={(e) => onUpdateData(node.id, { sizeX: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
              <Input
                type="number"
                placeholder="Y"
                value={data.sizeY ?? 10}
                onChange={(e) => onUpdateData(node.id, { sizeY: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
              <Input
                type="number"
                placeholder="Z"
                value={data.sizeZ ?? 10}
                onChange={(e) => onUpdateData(node.id, { sizeZ: parseFloat(e.target.value) || 0 })}
                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
              />
            </div>
          </div>
        );

      case 'sort_by_attribute':
        const sortAttrKeys = getAttributeKeys(data.attributeId);
        return (
          <div className="space-y-2">
            <Select value={data.attributeId || ''} onValueChange={(v) => onUpdateData(node.id, { attributeId: v, key: '' })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择属性" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {attributes.map(attr => (
                  <SelectItem key={attr.id} value={attr.attribute_id} className="text-white text-xs">
                    {attr.name} ({attr.attribute_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {data.attributeId && (
              <Select value={data.key || ''} onValueChange={(v) => onUpdateData(node.id, { key: v })}>
                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                  <SelectValue placeholder="选择键" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#434343]">
                  {sortAttrKeys.map(key => (
                    <SelectItem key={key} value={key} className="text-white text-xs">
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={data.order || 'asc'} onValueChange={(v) => onUpdateData(node.id, { order: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="asc" className="text-white text-xs">升序</SelectItem>
                <SelectItem value="desc" className="text-white text-xs">降序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'sort_by_relation':
        return (
          <div className="space-y-2">
            <Select value={data.relationId || ''} onValueChange={(v) => onUpdateData(node.id, { relationId: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {relations.map(rel => (
                  <SelectItem key={rel.id} value={rel.relation_id} className="text-white text-xs">
                    {rel.name} ({rel.relation_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.order || 'asc'} onValueChange={(v) => onUpdateData(node.id, { order: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="asc" className="text-white text-xs">升序</SelectItem>
                <SelectItem value="desc" className="text-white text-xs">降序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'sort_by_tag':
        return (
          <div className="space-y-2">
            <Select value={data.tagPath || ''} onValueChange={(v) => onUpdateData(node.id, { tagPath: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.full_path} className="text-white text-xs">
                    {tag.name} ({tag.full_path})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={data.order || 'asc'} onValueChange={(v) => onUpdateData(node.id, { order: v })}>
              <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#434343]">
                <SelectItem value="asc" className="text-white text-xs">升序</SelectItem>
                <SelectItem value="desc" className="text-white text-xs">降序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'limit_top':
      case 'limit_bottom':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="数量"
              value={data.count ?? 10}
              onChange={(e) => onUpdateData(node.id, { count: parseInt(e.target.value) || 1 })}
              className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
            />
          </div>
        );

      case 'limit_percent_top':
      case 'limit_percent_bottom':
        return (
          <div className="space-y-2">
            <Input
              type="number"
              placeholder="百分比"
              value={data.percent ?? 10}
              onChange={(e) => onUpdateData(node.id, { percent: parseFloat(e.target.value) || 1 })}
              className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
            />
            <div className="text-[10px] text-white/40">0-100</div>
          </div>
        );

      default:
        return null;
    }
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
        border: selected ? `2px solid ${accentColor}` : '1px solid #1a1a1a',
        boxShadow: selected ? `0 0 0 2px ${accentColor}40, 0 4px 12px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.5)',
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

      <div className="p-3 space-y-2">
        {node.inputs && node.inputs.length > 0 && (
          <div className="space-y-1.5">
            {node.inputs.map(input => (
              <NodePort
                key={input.id}
                nodeId={node.id}
                port={input}
                type="input"
                onStartConnection={onStartConnection}
                onEndConnection={onEndConnection}
              />
            ))}
          </div>
        )}

        {renderNodeContent()}

        {node.outputs && node.outputs.length > 0 && (
          <div className="space-y-1.5">
            {node.outputs.map(output => (
              <NodePort
                key={output.id}
                nodeId={node.id}
                port={output}
                type="output"
                onStartConnection={onStartConnection}
                onEndConnection={onEndConnection}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
