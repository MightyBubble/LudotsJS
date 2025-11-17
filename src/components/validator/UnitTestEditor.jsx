import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function UnitTestEditor({ config, onChange }) {
  const testConfig = config || { test_type: 'has_tag' };

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

  const handleUpdate = (field, value) => {
    onChange({ ...testConfig, [field]: value });
  };

  const addTagPath = () => {
    const paths = testConfig.tag_paths || [];
    onChange({ ...testConfig, tag_paths: [...paths, ''] });
  };

  const updateTagPath = (index, value) => {
    const paths = [...(testConfig.tag_paths || [])];
    paths[index] = value;
    onChange({ ...testConfig, tag_paths: paths });
  };

  const removeTagPath = (index) => {
    const paths = (testConfig.tag_paths || []).filter((_, i) => i !== index);
    onChange({ ...testConfig, tag_paths: paths });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-white/70 mb-1 block">测试类型</label>
        <Select value={testConfig.test_type} onValueChange={(val) => handleUpdate('test_type', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            <SelectItem value="has_tag" className="text-white text-xs">拥有标签</SelectItem>
            <SelectItem value="has_any_tags" className="text-white text-xs">拥有任意标签</SelectItem>
            <SelectItem value="has_all_tags" className="text-white text-xs">拥有所有标签</SelectItem>
            <SelectItem value="is_prototype" className="text-white text-xs">是原型</SelectItem>
            <SelectItem value="is_alive" className="text-white text-xs">存活</SelectItem>
            <SelectItem value="has_attribute" className="text-white text-xs">拥有属性</SelectItem>
            <SelectItem value="has_relation" className="text-white text-xs">拥有关系</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {testConfig.test_type === 'has_tag' && (
        <Select value={testConfig.tag_path || ''} onValueChange={(val) => handleUpdate('tag_path', val)}>
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

      {(testConfig.test_type === 'has_any_tags' || testConfig.test_type === 'has_all_tags') && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/70">标签列表</label>
            <Button size="sm" onClick={addTagPath} className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
              <Plus className="w-3 h-3" />
            </Button>
          </div>
          {(testConfig.tag_paths || []).map((path, idx) => (
            <div key={idx} className="flex gap-2">
              <Select value={path} onValueChange={(val) => updateTagPath(idx, val)}>
                <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs flex-1">
                  <SelectValue placeholder="选择标签" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                  {tags.map(t => (
                    <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">{t.full_path}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button onClick={() => removeTagPath(idx)} className="text-white/30 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {testConfig.test_type === 'is_prototype' && (
        <Select value={testConfig.prototype_id || ''} onValueChange={(val) => handleUpdate('prototype_id', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择原型" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {prototypes.map(p => (
              <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {testConfig.test_type === 'has_attribute' && (
        <Select value={testConfig.attribute_id || ''} onValueChange={(val) => handleUpdate('attribute_id', val)}>
          <SelectTrigger className="h-7 bg-[#2d2d30] border-[#434343] text-white text-xs">
            <SelectValue placeholder="选择属性" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
            {attributes.map(a => (
              <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {testConfig.test_type === 'has_relation' && (
        <Select value={testConfig.relation_id || ''} onValueChange={(val) => handleUpdate('relation_id', val)}>
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
    </div>
  );
}