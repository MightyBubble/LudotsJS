import React from 'react';
import { Section, SelectField, TextField } from '@/components/ludots/ui';

export default function ControlPlaneDetails({ draft, patch, queryGraphs }) {
  const options = queryGraphs.map(query => ({
    value: query.query_name,
    label: query.query_name,
  }));

  return (
    <Section title="控制面配置">
      <TextField label="Control Plane ID" value={draft.control_plane_id}
        onChange={control_plane_id => patch({ control_plane_id })} />
      <SelectField label="Entity Query Graph" value={draft.entity_query_graph_ref}
        options={options} onChange={entity_query_graph_ref => patch({ entity_query_graph_ref })}
        hint="查询以当前控制者化身为上下文，输出该客户端可控制的 Actor 集合。" />
      {!options.length && <p className="text-[10px] text-gray-500">请先在实体查询图中创建控制域查询。</p>}
    </Section>
  );
}