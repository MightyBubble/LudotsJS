import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import PageActions from '@/components/shell/PageActions';
import { S, ToolButton, IconButton } from '@/components/shell/ui';
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
    <div className={S.page}>
      <PageActions>
        {proto && (
          <ToolButton icon={Plus} tone="primary" onClick={() => setRelations([...list, { relation_definition_id: relations[0]?.relation_id || '', target_prototype_id: '', attribute_values: {} }])}>
            添加关系
          </ToolButton>
        )}
      </PageActions>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-[#15171C] border-r border-[#2A2E37] overflow-y-auto p-2 space-y-1 shrink-0">
          {prototypes.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left px-2 py-1.5 rounded text-xs flex justify-between items-center ${p.id === selectedId ? 'bg-[#D97706] text-black' : 'text-gray-300 hover:bg-[#1E2128]'}`}
            >
              <span className="truncate">{p.name}</span>
              <span className="text-[10px] opacity-70">{(p.static_relations || []).length}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 min-w-0">
          {!proto ? (
            <div className={S.empty}>从左侧选择一个原型以配置静态关系</div>
          ) : list.length === 0 ? (
            <div className={S.empty}>暂无静态关系</div>
          ) : (
            <div className="max-w-2xl">
              {list.map((rel, idx) => {
                const def = relations.find(r => r.relation_id === rel.relation_definition_id);
                const patchRel = (p) => setRelations(list.map((x, i) => (i === idx ? { ...x, ...p } : x)));
                return (
                  <Section
                    key={idx}
                    title={`${def?.name || rel.relation_definition_id || '未选择关系'} → ${rel.target_prototype_id || '未选择目标'}`}
                    right={<IconButton icon={Trash2} tone="danger" title="删除" onClick={() => setRelations(list.filter((_, i) => i !== idx))} />}
                  >
                    <SelectField
                      label="关系类型 relation_definition_id"
                      value={rel.relation_definition_id}
                      options={relations.map(r => ({ value: r.relation_id, label: r.name }))}
                      onChange={(v) => patchRel({ relation_definition_id: v, attribute_values: {} })}
                    />
                    <SelectField
                      label="目标原型 target_prototype_id"
                      value={rel.target_prototype_id}
                      options={prototypes.filter(p => p.prototype_id !== proto.prototype_id).map(p => ({ value: p.prototype_id, label: p.name }))}
                      onChange={(v) => patchRel({ target_prototype_id: v })}
                    />
                    {(def?.relation_attributes || []).map(attrId => {
                      const attr = attributes.find(a => a.attribute_id === attrId);
                      return (
                        <NumberField
                          key={attrId}
                          label={`${attr?.name || attrId} 默认值`}
                          value={rel.attribute_values?.[attrId]}
                          onChange={(v) => patchRel({ attribute_values: { ...(rel.attribute_values || {}), [attrId]: v ?? 0 } })}
                        />
                      );
                    })}
                  </Section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}