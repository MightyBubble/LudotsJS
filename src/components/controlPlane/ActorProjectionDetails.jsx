import React from 'react';
import { Section, SelectField, TextField } from '@/components/ludots/ui';

export default function ActorProjectionDetails({ draft, patch, queryGraphs = [], controlPlanes = [] }) {
  return (
    <Section title="Actor 投影">
      <div className="grid grid-cols-2 gap-2">
        <TextField label="投影键" value={draft.collection_key}
          onChange={collection_key => patch({ collection_key })}
          hint="消费方引用的稳定标识，如 Selection.All" />
        <TextField label="显示名" value={draft.label} onChange={label => patch({ label })} />
      </div>
      <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
      <SelectField label="所属控制面" value={draft.control_plane_ref}
        options={controlPlanes.map(c => ({ value: c.control_plane_id, label: c.control_plane_id }))}
        onChange={control_plane_ref => patch({ control_plane_ref })}
        hint="投影在该控制面输出的可控集合之上再取子集" />
      <SelectField label="投影规则（Entity Query Graph）" value={draft.entity_query_graph_ref}
        options={queryGraphs.map(q => ({ value: q.query_name, label: q.query_name }))}
        onChange={entity_query_graph_ref => patch({ entity_query_graph_ref })}
        hint="以控制面集合为上下文，输出本投影的 Actor 集合与顺序" />
    </Section>
  );
}