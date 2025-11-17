import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ParameterSourceEditor({ value, onChange, label = "参数", allowEntityTag = true }) {
  const source = value || { source_type: 'literal', literal_value: '' };

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: constants = [] } = useQuery({
    queryKey: ['globalConstants'],
    queryFn: () => base44.entities.GlobalConstant.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const handleSourceTypeChange = (sourceType) => {
    const newSource = { source_type: sourceType };
    if (sourceType === 'literal') newSource.literal_value = '';
    if (sourceType === 'entity_attribute') {
      newSource.attribute_id = attributes[0]?.attribute_id || '';
      newSource.attribute_key = '';
    }
    if (sourceType === 'global_constant') newSource.constant_key = constants[0]?.constant_key || '';
    if (sourceType === 'entity_tag') newSource.tag_path = tags[0]?.full_path || '';
    onChange(newSource);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-white/70">{label}</label>
      <Select value={source.source_type} onValueChange={handleSourceTypeChange}>
        <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
          <SelectItem value="literal" className="text-white text-xs">字面量</SelectItem>
          <SelectItem value="entity_attribute" className="text-white text-xs">实体属性</SelectItem>
          {allowEntityTag && <SelectItem value="entity_tag" className="text-white text-xs">实体标签</SelectItem>}
          <SelectItem value="global_constant" className="text-white text-xs">全局常量</SelectItem>
        </SelectContent>
      </Select>

      {source.source_type === 'literal' && (
        <Input
          value={source.literal_value || ''}
          onChange={(e) => onChange({ ...source, literal_value: e.target.value })}
          placeholder="输入值"
          className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs"
        />
      )}

      {source.source_type === 'entity_attribute' && (
        <div className="space-y-1">
          <Select
            value={source.attribute_id || ''}
            onValueChange={(val) => onChange({ ...source, attribute_id: val, attribute_key: '' })}
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
          {source.attribute_id && (
            <Select
              value={source.attribute_key || ''}
              onValueChange={(val) => onChange({ ...source, attribute_key: val })}
            >
              <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
                <SelectValue placeholder="选择键" />
              </SelectTrigger>
              <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                {(attributes.find(a => a.attribute_id === source.attribute_id)?.keys || []).map(k => (
                  <SelectItem key={k.name} value={k.name} className="text-white text-xs">
                    {k.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {source.source_type === 'entity_tag' && (
        <Select
          value={source.tag_path || ''}
          onValueChange={(val) => onChange({ ...source, tag_path: val })}
        >
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择标签" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {tags.map(t => (
              <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                {t.full_path}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {source.source_type === 'global_constant' && (
        <Select
          value={source.constant_key || ''}
          onValueChange={(val) => onChange({ ...source, constant_key: val })}
        >
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择常量" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {constants.map(c => (
              <SelectItem key={c.id} value={c.constant_key} className="text-white text-xs">
                {c.constant_key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}