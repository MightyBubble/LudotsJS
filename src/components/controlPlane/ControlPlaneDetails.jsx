import React from 'react';
import { Section, SelectField, TextField } from '@/components/ludots/ui';

export default function ControlPlaneDetails({ draft, patch, queryGraphs = [], collections = [] }) {
  return (
    <Section title="控制面配置">
      <TextField label="Control Plane ID" value={draft.control_plane_id}
        onChange={control_plane_id => patch({ control_plane_id })} />
      <SelectField label="Entity Query Graph" value={draft.entity_query_graph_ref}
        options={queryGraphs.map(q => ({ value: q.query_name, label: q.query_name }))}
        onChange={entity_query_graph_ref => patch({ entity_query_graph_ref })}
        hint="查询以当前控制者化身为上下文，输出该 entity 可控制的其他 entity 集合。" />
      {!queryGraphs.length && <p className="text-[10px] text-gray-500">请先在实体查询图中创建控制域查询。</p>}
      <SelectField label="投影到集合" value={draft.output_collection_key}
        options={collections.map(c => ({ value: c.collection_key, label: c.label ? `${c.collection_key} · ${c.label}` : c.collection_key }))}
        onChange={output_collection_key => patch({ output_collection_key })}
        hint="把查询结果写入哪个实体集合键；消费方（如命令面板）通过该键读取" />
      {!collections.length && <p className="text-[10px] text-gray-500">请先在「Entity Collections」中声明集合键。</p>}
    </Section>
  );
}