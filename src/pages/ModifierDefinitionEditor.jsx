import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, GitBranch, Edit3, Save, X } from "lucide-react";
import RecordWorkspace from "@/components/ludots/RecordWorkspace";
import { Section } from "@/components/ludots/ui";

export default function ModifierDefinitionEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: modifiers = [] } = useQuery({
    queryKey: ['modifierDefinitions'],
    queryFn: () => base44.entities.ModifierDefinition.list(),
    initialData: [],
  });

  const { data: dataGraphs = [] } = useQuery({
    queryKey: ['dataGraphs'],
    queryFn: () => base44.entities.DataGraph.list(),
    initialData: [],
  });

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

  const curveGraphs = useMemo(() => {
    // 曲线：用途为 curve/general 且出口为数值的图
    return dataGraphs.filter(g =>
      (g.usage === 'curve' || g.usage === 'general') && g.return_type === 'number'
    );
  }, [dataGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModifierDefinition.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
      setEditingRow(record.id);
      setEditData({ ...record, curve_input_mappings: record.curve_input_mappings || [] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModifierDefinition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ModifierDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
    },
  });

  const filteredModifiers = useMemo(() => {
    if (!searchQuery) return modifiers;
    return modifiers.filter(mod => 
      mod.modifier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (mod.description && mod.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [modifiers, searchQuery]);

  const handleCreate = () => {
    const newMod = {
      modifier_name: "新修饰器",
      description: "",
      curve_data_graph_id: curveGraphs[0]?.graph_id || "",
      curve_input_mappings: [],
      target_type: "entity_attribute",
      target_attribute_id: attributes[0]?.attribute_id || "",
      output_key: attributes[0]?.keys?.[0]?.name || "",
      target_relation_id: "",
      max_trigger_times: null,
      is_active: true
    };
    createMutation.mutate(newMod);
  };

  const handleEdit = (mod) => {
    setEditingRow(mod.id);
    setEditData({ 
      ...mod, 
      curve_input_mappings: mod.curve_input_mappings || [],
      target_type: mod.target_type || "entity_attribute",
      target_relation_id: mod.target_relation_id || ""
    });
  };

  const handleSave = () => {
    if (!editData.modifier_name || !editData.curve_data_graph_id || !editData.target_attribute_id || !editData.output_key) {
      alert('请填写必填项');
      return;
    }
    
    const dataToSave = {
      modifier_name: editData.modifier_name,
      description: editData.description,
      curve_data_graph_id: editData.curve_data_graph_id,
      curve_input_mappings: editData.curve_input_mappings,
      target_type: editData.target_type,
      target_attribute_id: editData.target_attribute_id,
      output_key: editData.output_key,
      target_relation_id: editData.target_relation_id || "",
      max_trigger_times: editData.max_trigger_times,
      is_active: editData.is_active
    };
    
    updateMutation.mutate({ id: editData.id, data: dataToSave });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddMapping = () => {
    const graph = dataGraphs.find(g => g.graph_id === editData.curve_data_graph_id);
    if (!graph) return;

    const graphDef = typeof graph.graph_definition === 'string' 
      ? JSON.parse(graph.graph_definition) 
      : graph.graph_definition;
    const blackboard = graphDef?.blackboard || {};
    const publicKeys = Object.keys(blackboard).filter(k => blackboard[k]?.public === true);
    
    const newKey = publicKeys.find(k => !editData.curve_input_mappings.some(m => m.graph_blackboard_key === k)) || publicKeys[0];
    if (!newKey) return;

    const newMapping = {
      graph_blackboard_key: newKey,
      source_type: 'constant',
      constant_value: 0
    };

    setEditData({
      ...editData,
      curve_input_mappings: [...editData.curve_input_mappings, newMapping]
    });
  };

  const handleUpdateMapping = (mappingIndex, field, value) => {
    const mappings = [...editData.curve_input_mappings];
    mappings[mappingIndex] = { ...mappings[mappingIndex], [field]: value };
    setEditData({ ...editData, curve_input_mappings: mappings });
  };

  const handleRemoveMapping = (mappingIndex) => {
    const mappings = editData.curve_input_mappings.filter((_, i) => i !== mappingIndex);
    setEditData({ ...editData, curve_input_mappings: mappings });
  };

  const getAttributeKeys = (attributeId) => {
    const attr = attributes.find(a => a.attribute_id === attributeId);
    return (attr?.keys || []).map(k => k.name).filter(k => k);
  };

  const getRelationAttributes = (relationId) => {
    const relation = relations.find(r => r.relation_id === relationId);
    return (relation?.relation_attributes || []);
  };

  const getTargetTypeLabel = (type) => {
    const labels = {
      'entity_attribute': '实体自身属性',
      'related_entity_attribute': '关联实体属性',
      'relation_attribute': '关系属性'
    };
    return labels[type] || type;
  };

  return (
    <RecordWorkspace
      entityName="ModifierDefinition"
      records={modifiers}
      toItem={(mod) => ({
        id: mod.id,
        name: mod.modifier_name,
        subtitle: `${getTargetTypeLabel(mod.target_type)} · ${mod.target_attribute_id || '未设置'}`,
      })}
      columns={[
        { key: 'modifier_name', label: '名称', width: 180 },
        { key: 'curve_data_graph_id', label: '曲线图', width: 180 },
        { key: 'curve_input_mappings', label: '输入映射', render: (mod) => `${(mod.curve_input_mappings || []).length} 项` },
        { key: 'target_type', label: '目标类型', width: 150, render: (mod) => getTargetTypeLabel(mod.target_type) },
        { key: 'target_attribute_id', label: '目标', render: (mod) => `${mod.target_attribute_id || '-'}${mod.output_key ? `.${mod.output_key}` : ''}` },
        { key: 'max_trigger_times', label: '最大次数', width: 90, render: (mod) => mod.max_trigger_times || '∞' },
        { key: 'is_active', label: '激活', width: 70, render: (mod) => mod.is_active ? '是' : '否' },
      ]}
      selectedId={editingRow}
      onSelect={handleEdit}
      onCreate={handleCreate}
      onDelete={(mod) => handleDelete(mod.id)}
      onSave={handleSave}
      dirty={Boolean(editData)}
    >
      {editData && (
        <div className="max-w-3xl space-y-3">
          <Section title="基础信息">
            <label className="block text-xs text-gray-400">名称</label>
            <Input value={editData.modifier_name || ''} onChange={(e) => setEditData({ ...editData, modifier_name: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
            <label className="block text-xs text-gray-400">描述</label>
            <Input value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
            <label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" checked={editData.is_active !== false} onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })} />启用</label>
          </Section>

          <Section title="曲线与输入映射">
            <Select value={editData.curve_data_graph_id || ''} onValueChange={(value) => setEditData({ ...editData, curve_data_graph_id: value, curve_input_mappings: [] })}>
              <SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue placeholder="选择曲线图" /></SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">{curveGraphs.map((graph) => <SelectItem key={graph.id} value={graph.graph_id}>{graph.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="space-y-2">
              {(editData.curve_input_mappings || []).map((mapping, index) => (
                <div key={`${mapping.graph_blackboard_key}-${index}`} className="grid grid-cols-[1fr_150px_1fr_28px] gap-2 items-center rounded border border-[#2A2E37] p-2">
                  <Input value={mapping.graph_blackboard_key || ''} disabled className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
                  <Select value={mapping.source_type || 'constant'} onValueChange={(value) => handleUpdateMapping(index, 'source_type', value)}>
                    <SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      <SelectItem value="constant">常量</SelectItem><SelectItem value="tag_count">标签计数</SelectItem><SelectItem value="attribute_key">属性键</SelectItem><SelectItem value="relation_entity_attribute">关联实体属性</SelectItem><SelectItem value="relation_attribute">关系属性</SelectItem><SelectItem value="relation_tag_count">关系标签计数</SelectItem>
                    </SelectContent>
                  </Select>
                  {mapping.source_type === 'constant' ? <Input type="number" value={mapping.constant_value ?? 0} onChange={(e) => handleUpdateMapping(index, 'constant_value', Number(e.target.value))} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /> : mapping.source_type?.includes('tag_count') ? <Input value={mapping.tag_path || ''} onChange={(e) => handleUpdateMapping(index, 'tag_path', e.target.value)} placeholder="标签路径" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /> : <Input value={mapping.attribute_id || ''} onChange={(e) => handleUpdateMapping(index, 'attribute_id', e.target.value)} placeholder="属性 ID" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />}
                  <button onClick={() => handleRemoveMapping(index)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <Button size="sm" onClick={handleAddMapping} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加映射</Button>
          </Section>

          <Section title="目标与次数">
            <div className="grid grid-cols-2 gap-3">
              <Select value={editData.target_type || 'entity_attribute'} onValueChange={(value) => setEditData({ ...editData, target_type: value })}>
                <SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]"><SelectItem value="entity_attribute">实体自身属性</SelectItem><SelectItem value="related_entity_attribute">关联实体属性</SelectItem><SelectItem value="relation_attribute">关系属性</SelectItem></SelectContent>
              </Select>
              {(editData.target_type === 'related_entity_attribute' || editData.target_type === 'relation_attribute') && <Select value={editData.target_relation_id || ''} onValueChange={(value) => setEditData({ ...editData, target_relation_id: value })}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue placeholder="选择关系" /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{relations.map((relation) => <SelectItem key={relation.id} value={relation.relation_id}>{relation.name}</SelectItem>)}</SelectContent></Select>}
              <Select value={editData.target_attribute_id || ''} onValueChange={(value) => setEditData({ ...editData, target_attribute_id: value, output_key: '' })}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue placeholder="目标属性" /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{attributes.map((attribute) => <SelectItem key={attribute.id} value={attribute.attribute_id}>{attribute.name}</SelectItem>)}</SelectContent></Select>
              <Select value={editData.output_key || ''} onValueChange={(value) => setEditData({ ...editData, output_key: value })}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue placeholder="输出键" /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{getAttributeKeys(editData.target_attribute_id).map((key) => <SelectItem key={key} value={key}>{key}</SelectItem>)}</SelectContent></Select>
              <Input type="number" value={editData.max_trigger_times ?? ''} onChange={(e) => setEditData({ ...editData, max_trigger_times: e.target.value ? Number(e.target.value) : null })} placeholder="最大次数（空为无限）" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
            </div>
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}