import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function UnitCompareEditor({ config, onChange }) {
  const compareConfig = config || { compare_type: 'attribute_value', operator: 'gte' };

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const { data: constants = [] } = useQuery({
    queryKey: ['globalConstants'],
    queryFn: () => base44.entities.GlobalConstant.list(),
    initialData: [],
  });

  const handleUpdate = (field, value) => {
    onChange({ ...compareConfig, [field]: value });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/70 mb-1 block">比较类型</label>
        <Select value={compareConfig.compare_type} onValueChange={(val) => handleUpdate('compare_type', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            <SelectItem value="attribute_value" className="text-white text-xs">属性值</SelectItem>
            <SelectItem value="tag_count" className="text-white text-xs">标签计数</SelectItem>
            <SelectItem value="relation_count" className="text-white text-xs">关系计数</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {compareConfig.compare_type === 'attribute_value' && (
        <div className="space-y-2">
          <Select value={compareConfig.attribute_id || ''} onValueChange={(val) => handleUpdate('attribute_id', val)}>
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
              <SelectValue placeholder="选择属性" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
              {attributes.map(a => (
                <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {compareConfig.attribute_id && (
            <Select value={compareConfig.attribute_key || ''} onValueChange={(val) => handleUpdate('attribute_key', val)}>
              <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
                <SelectValue placeholder="选择键" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                {(attributes.find(a => a.attribute_id === compareConfig.attribute_id)?.keys || []).map(k => (
                  <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {compareConfig.compare_type === 'tag_count' && (
        <Select value={compareConfig.tag_path || ''} onValueChange={(val) => handleUpdate('tag_path', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择标签" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {tags.map(t => (
              <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">{t.full_path}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {compareConfig.compare_type === 'relation_count' && (
        <Select value={compareConfig.relation_id || ''} onValueChange={(val) => handleUpdate('relation_id', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择关系" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {relations.map(r => (
              <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">{r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div>
        <label className="text-xs text-white/70 mb-1 block">操作符</label>
        <Select value={compareConfig.operator || 'gte'} onValueChange={(val) => handleUpdate('operator', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            <SelectItem value="eq" className="text-white text-xs">等于 (=)</SelectItem>
            <SelectItem value="neq" className="text-white text-xs">不等于 (≠)</SelectItem>
            <SelectItem value="gt" className="text-white text-xs">大于 (&gt;)</SelectItem>
            <SelectItem value="lt" className="text-white text-xs">小于 (&lt;)</SelectItem>
            <SelectItem value="gte" className="text-white text-xs">大于等于 (≥)</SelectItem>
            <SelectItem value="lte" className="text-white text-xs">小于等于 (≤)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs text-white/70 mb-1 block">比较值来源</label>
        <Select 
          value={compareConfig.compare_value_source?.source_type || 'literal'} 
          onValueChange={(val) => handleUpdate('compare_value_source', { source_type: val })}
        >
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            <SelectItem value="literal" className="text-white text-xs">字面量</SelectItem>
            <SelectItem value="global_constant" className="text-white text-xs">全局常量</SelectItem>
            <SelectItem value="target_attribute" className="text-white text-xs">目标属性</SelectItem>
          </SelectContent>
        </Select>

        {compareConfig.compare_value_source?.source_type === 'literal' && (
          <Input
            type="number"
            value={compareConfig.compare_value_source?.literal_value || ''}
            onChange={(e) => handleUpdate('compare_value_source', { ...compareConfig.compare_value_source, literal_value: e.target.value })}
            placeholder="输入值"
            className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs mt-2"
          />
        )}

        {compareConfig.compare_value_source?.source_type === 'global_constant' && (
          <Select 
            value={compareConfig.compare_value_source?.constant_key || ''} 
            onValueChange={(val) => handleUpdate('compare_value_source', { ...compareConfig.compare_value_source, constant_key: val })}
          >
            <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs mt-2">
              <SelectValue placeholder="选择常量" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
              {constants.map(c => (
                <SelectItem key={c.id} value={c.constant_key} className="text-white text-xs">{c.constant_key}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}