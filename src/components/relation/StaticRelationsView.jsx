import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import { ToolButton, IconButton } from '@/components/shell/ui';
import { Section, SelectField, NumberField } from '@/components/ludots/ui';

/** 原型上的静态关系配置（走统一的「左列表 + 右详情」排版） */
export default function StaticRelationsView() {
  const [selectedId, setSelectedId] = useState(null);
  const queryClient = useQueryClient();

  const { data: prototypes = [] } = useQuery({ queryKey: ['entityPrototypes'], queryFn: () => base44.entities.EntityPrototype.list(), initialData: [] });
  const { data: relations = [] } = useQuery({ queryKey: ['entityRelations'], queryFn: () => base44.entities.EntityRelation.list(), initialData: [] });
  const { data: attributes = [] } = useQuery({ queryKey: ['attributes'], queryFn: () => base44.entities.Attribute.list(), initialData: [] });

  const proto = prototypes.find(p => p.id === selectedId);
  const update = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityPrototype.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] }),
  });

  const setRelations = (list) => {
    const { id, created_date, updated_date, created_by_id, created_by, ...rest } = proto;
    update.mutate({ id: proto.id, data: { ...rest, static_relations: list } });
  };
  const list = proto?.static_relations || [];

  return (
    <RecordWorkspace
      entityName="StaticRelations"
      records={prototypes}
      toItem={(item) => ({ id: item.id, name: item.name, subtitle: `${item.prototype_id} · ${(item.static_relations || []).length} 条关系` })}
      columns={[
        { key: 'prototype_id', label: '原型 ID', width: 220 },
        { key: 'name', label: '名称', width: 180 },
        { key: 'static_relations', label: '静态关系', render: (item) => `${(item.static_relations || []).length} 条` },
      ]}
      selectedId={selectedId}
      onSelect={(item) => setSelectedId(item.id)}
      headerRight={proto && <ToolButton icon={Plus} onClick={() => setRelations([...list, { relation_definition_id: relations[0]?.relation_id || '', target_prototype_id: '', attribute_values: {} }])}>添加关系</ToolButton>}
      emptyHint="选择一个原型以配置静态关系"
    >
      {proto && (
        <div className="max-w-2xl">
          {list.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-gray-600">暂无静态关系</div>
          ) : list.map((rel, idx) => {
            const def = relations.find(r => r.relation_id === rel.relation_definition_id);
            const patchRel = (patch) => setRelations(list.map((item, index) => index === idx ? { ...item, ...patch } : item));
            return (
              <Section key={idx} title={`${def?.name || rel.relation_definition_id || '未选择关系'} → ${rel.target_prototype_id || '未选择目标'}`} right={<IconButton icon={Trash2} tone="danger" title="删除" onClick={() => setRelations(list.filter((_, index) => index !== idx))} />}>
                <SelectField label="关系类型 relation_definition_id" value={rel.relation_definition_id} options={relations.map(item => ({ value: item.relation_id, label: item.name }))} onChange={(value) => patchRel({ relation_definition_id: value, attribute_values: {} })} />
                <SelectField label="目标原型 target_prototype_id" value={rel.target_prototype_id} options={prototypes.filter(item => item.prototype_id !== proto.prototype_id).map(item => ({ value: item.prototype_id, label: item.name }))} onChange={(value) => patchRel({ target_prototype_id: value })} />
                {(def?.relation_attributes || []).map(attributeId => {
                  const attribute = attributes.find(item => item.attribute_id === attributeId);
                  return <NumberField key={attributeId} label={`${attribute?.name || attributeId} 默认值`} value={rel.attribute_values?.[attributeId]} onChange={(value) => patchRel({ attribute_values: { ...(rel.attribute_values || {}), [attributeId]: value ?? 0 } })} />;
                })}
              </Section>
            );
          })}
        </div>
      )}
    </RecordWorkspace>
  );
}