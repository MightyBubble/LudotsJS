import React from "react";
import { useLocation } from "react-router-dom";
import RecordWorkspace from "@/components/ludots/RecordWorkspace";
import useRecordEditor from "@/components/ludots/useRecordEditor";
import useCoreRefs from "@/components/ludots/useCoreRefs";
import RefListSelector from "@/components/ludots/RefListSelector";
import { Section, TextField, SelectField, ListField } from "@/components/ludots/ui";
import StaticRelationsView from "@/components/relation/StaticRelationsView";

export default function EntityRelationEditorPage() {
  const { search } = useLocation();
  return new URLSearchParams(search).get("view") === "static"
    ? <StaticRelationsView />
    : <RelationDefinitionsWorkspace />;
}

/** 关系定义：与其他数据实例完全一致的 RecordWorkspace（文件树+详情 / 二维表） */
function RelationDefinitionsWorkspace() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    "EntityRelation", "entityRelations",
    () => ({
      relation_id: `relation_${Date.now()}`, name: "新关系", description: "",
      relation_attributes: [], allowed_tags: [],
    })
  );
  const refs = useCoreRefs();
  const protoOptions = (refs.prototypes || []).map(p => ({ value: p.prototype_id, label: p.name }));

  const columns = [
    { key: "relation_id", label: "关系ID", width: 200, render: (r) => <span className="font-mono text-[#E2D8B3]">{r.relation_id}</span> },
    { key: "name", label: "名称", width: 160 },
    { key: "endpoints", label: "源 → 目标", render: (r) => `${r.source_prototype_id || "任意"} → ${r.target_prototype_id || "任意"}` },
    { key: "relation_attributes", label: "关系属性", render: (r) => (r.relation_attributes || []).join(", ") || "-" },
    { key: "allowed_tags", label: "允许标签", render: (r) => (r.allowed_tags || []).length },
  ];

  return (
    <RecordWorkspace
      entityName="EntityRelation"
      records={records}
      columns={columns}
      toItem={(r) => ({ id: r.id, name: r.name, subtitle: `${(r.relation_attributes || []).length} 属性` })}
      selectedId={selectedId} onSelect={(r) => setSelectedId(r.id)}
      onCreate={create}
      onDelete={(r) => window.confirm(`确定删除「${r.name}」吗？`) && remove(r.id)}
      onSave={save} dirty={dirty}
    >
      {draft && (
        <div className="max-w-2xl">
          <Section title="基础 Basic">
            <TextField label="关系 ID (relation_id)" value={draft.relation_id} onChange={(v) => patch({ relation_id: v })} />
            <TextField label="名称" value={draft.name} onChange={(v) => patch({ name: v })} />
            <TextField label="描述" value={draft.description} onChange={(v) => patch({ description: v })} />
          </Section>

          <Section title="端点 Endpoints">
            <SelectField label="源原型 source_prototype_id（留空表示任意）" value={draft.source_prototype_id} options={protoOptions} onChange={(v) => patch({ source_prototype_id: v })} />
            <SelectField label="目标原型 target_prototype_id（留空表示任意）" value={draft.target_prototype_id} options={protoOptions} onChange={(v) => patch({ target_prototype_id: v })} />
          </Section>

          <Section title="属性与标签">
            <RefListSelector
              label="关系属性 relation_attributes"
              value={draft.relation_attributes || []}
              options={(refs.attributes || []).map(a => ({ value: a.attribute_id, label: a.name }))}
              onChange={(v) => patch({ relation_attributes: v })}
            />
            <ListField label="允许标签 allowed_tags" value={draft.allowed_tags} onChange={(v) => patch({ allowed_tags: v })} />
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}