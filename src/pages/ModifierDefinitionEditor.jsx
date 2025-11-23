import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, GitBranch, Edit3, Save, X } from "lucide-react";

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
    return dataGraphs.filter(g => g.graph_type === 'curve');
  }, [dataGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModifierDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
      setEditingRow(null);
      setEditData(null);
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
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      <div className="h-10 bg-[#141414] border-b border-[#262626] flex items-center px-4 gap-3">
        <GitBranch className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">修饰器定义</span>
        <span className="text-xs text-gray-500">共 {filteredModifiers.length} 个</span>
        
        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#0a0a0a] border-[#262626] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-white">
          <thead className="bg-[#141414] border-b border-[#262626] sticky top-0 z-10">
            <tr>
              <th className="text-left p-2 font-medium text-white/70 w-32">名称</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">曲线图</th>
              <th className="text-left p-2 font-medium text-white/70">输入映射</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">目标类型</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">目标</th>
              <th className="text-left p-2 font-medium text-white/70 w-24">最大次数</th>
              <th className="text-left p-2 font-medium text-white/70 w-16">激活</th>
              <th className="text-right p-2 font-medium text-white/70 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredModifiers.map((mod) => {
              const isEditing = editingRow === mod.id;
              const currentData = isEditing ? editData : mod;
              const targetAttr = attributes.find(a => a.attribute_id === currentData.target_attribute_id);
              const availableKeys = getAttributeKeys(currentData.target_attribute_id);
              const targetRelation = relations.find(r => r.relation_id === currentData.target_relation_id);
              
              return (
                <tr key={mod.id} className="border-b border-[#262626] hover:bg-[#141414]">
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.modifier_name}
                        onChange={(e) => setEditData({ ...editData, modifier_name: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90">{mod.modifier_name}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Select
                        value={editData.curve_data_graph_id}
                        onValueChange={(val) => setEditData({ ...editData, curve_data_graph_id: val })}
                      >
                        <SelectTrigger className="h-6 bg-[#0a0a0a] border-[#262626] text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-[#262626]">
                          {curveGraphs.map(g => (
                            <SelectItem key={g.id} value={g.graph_id} className="text-white hover:bg-[#262626] text-xs">
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-white/70 text-xs font-mono">{mod.curve_data_graph_id}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        {editData.curve_input_mappings.map((mapping, idx) => (
                          <div key={idx} className="flex gap-1 items-center flex-wrap">
                            <span className="text-white/50 text-xs">{mapping.graph_blackboard_key} ←</span>
                            
                            {mapping.source_type === 'tag_count' && (
                              <Select
                                value={mapping.tag_path || ''}
                                onValueChange={(val) => handleUpdateMapping(idx, 'tag_path', val)}
                              >
                                <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-32">
                                  <SelectValue placeholder="选择标签" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141414] border-[#262626] max-h-48">
                                  {tags.map(t => (
                                    <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                                      {t.full_path}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {mapping.source_type === 'attribute_key' && (
                              <>
                                <Select
                                  value={mapping.attribute_id || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'attribute_id', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="属性" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {attributes.map(a => (
                                      <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                                        {a.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={mapping.attribute_key || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'attribute_key', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="键" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {getAttributeKeys(mapping.attribute_id).map(k => (
                                      <SelectItem key={k} value={k} className="text-white text-xs">
                                        {k}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                            
                            {mapping.source_type === 'constant' && (
                              <Input
                                type="number"
                                step="0.1"
                                value={mapping.constant_value || 0}
                                onChange={(e) => handleUpdateMapping(idx, 'constant_value', parseFloat(e.target.value) || 0)}
                                className="h-5 w-16 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                              />
                            )}

                            {mapping.source_type === 'relation_entity_attribute' && (
                              <>
                                <Select
                                  value={mapping.relation_id || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'relation_id', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="关系" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {relations.map(r => (
                                      <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                                        {r.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={mapping.attribute_id || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'attribute_id', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="属性" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {attributes.map(a => (
                                      <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                                        {a.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={mapping.attribute_key || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'attribute_key', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="键" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {getAttributeKeys(mapping.attribute_id).map(k => (
                                      <SelectItem key={k} value={k} className="text-white text-xs">
                                        {k}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}

                            {mapping.source_type === 'relation_attribute' && (
                              <>
                                <Select
                                  value={mapping.relation_id || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'relation_id', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="关系" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {relations.map(r => (
                                      <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                                        {r.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={mapping.attribute_id || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'attribute_id', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="属性" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {getRelationAttributes(mapping.relation_id).map(attrId => {
                                      const attr = attributes.find(a => a.attribute_id === attrId);
                                      return (
                                        <SelectItem key={attrId} value={attrId} className="text-white text-xs">
                                          {attr?.name || attrId}
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={mapping.attribute_key || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'attribute_key', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="键" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {getAttributeKeys(mapping.attribute_id).map(k => (
                                      <SelectItem key={k} value={k} className="text-white text-xs">
                                        {k}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}

                            {mapping.source_type === 'relation_tag_count' && (
                              <>
                                <Select
                                  value={mapping.relation_id || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'relation_id', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-20">
                                    <SelectValue placeholder="关系" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626]">
                                    {relations.map(r => (
                                      <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                                        {r.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Select
                                  value={mapping.tag_path || ''}
                                  onValueChange={(val) => handleUpdateMapping(idx, 'tag_path', val)}
                                >
                                  <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-32">
                                    <SelectValue placeholder="选择标签" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#141414] border-[#262626] max-h-48">
                                    {tags.map(t => (
                                      <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                                        {t.full_path}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </>
                            )}
                            
                            <Select
                              value={mapping.source_type}
                              onValueChange={(val) => handleUpdateMapping(idx, 'source_type', val)}
                            >
                              <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#141414] border-[#262626]">
                                <SelectItem value="tag_count" className="text-white text-xs">标签计数</SelectItem>
                                <SelectItem value="attribute_key" className="text-white text-xs">属性键</SelectItem>
                                <SelectItem value="constant" className="text-white text-xs">常量</SelectItem>
                                <SelectItem value="relation_entity_attribute" className="text-white text-xs">关联实体属性</SelectItem>
                                <SelectItem value="relation_attribute" className="text-white text-xs">关系属性</SelectItem>
                                <SelectItem value="relation_tag_count" className="text-white text-xs">关系标签计数</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <button
                              onClick={() => handleRemoveMapping(idx)}
                              className="text-white/30 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          onClick={handleAddMapping}
                          className="h-5 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(mod.curve_input_mappings || []).map((mapping, idx) => (
                          <div key={idx} className="text-white/70 text-xs">
                            {mapping.graph_blackboard_key} ← {mapping.source_type === 'constant' ? mapping.constant_value : mapping.source_type}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Select
                        value={editData.target_type}
                        onValueChange={(val) => setEditData({ ...editData, target_type: val })}
                      >
                        <SelectTrigger className="h-6 bg-[#0a0a0a] border-[#262626] text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-[#262626]">
                          <SelectItem value="entity_attribute" className="text-white text-xs">实体自身属性</SelectItem>
                          <SelectItem value="related_entity_attribute" className="text-white text-xs">关联实体属性</SelectItem>
                          <SelectItem value="relation_attribute" className="text-white text-xs">关系属性</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-white/70 text-xs">
                        {getTargetTypeLabel(mod.target_type)}
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        {(editData.target_type === 'related_entity_attribute' || editData.target_type === 'relation_attribute') && (
                          <Select
                            value={editData.target_relation_id || ''}
                            onValueChange={(val) => setEditData({ ...editData, target_relation_id: val })}
                          >
                            <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs">
                              <SelectValue placeholder="关系" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141414] border-[#262626]">
                              {relations.map(r => (
                                <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Select
                          value={editData.target_attribute_id}
                          onValueChange={(val) => setEditData({ ...editData, target_attribute_id: val, output_key: '' })}
                        >
                          <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-[#262626]">
                            {attributes.map(a => (
                              <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={editData.output_key}
                          onValueChange={(val) => setEditData({ ...editData, output_key: val })}
                        >
                          <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#141414] border-[#262626]">
                            {availableKeys.map(k => (
                              <SelectItem key={k} value={k} className="text-white text-xs">
                                {k}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(mod.target_type === 'related_entity_attribute' || mod.target_type === 'relation_attribute') && targetRelation && (
                          <div className="text-white/60 text-xs">{targetRelation.name}</div>
                        )}
                        <div className="text-white/90 text-xs">{targetAttr?.name || mod.target_attribute_id}.{mod.output_key}</div>
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editData.max_trigger_times || ""}
                        onChange={(e) => setEditData({ ...editData, max_trigger_times: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="∞"
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white text-center"
                      />
                    ) : (
                      <span className="text-white/70">{mod.max_trigger_times || '∞'}</span>
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={editData.is_active}
                        onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                    ) : (
                      <span className="text-white/70">{mod.is_active ? '✓' : ''}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {isEditing ? (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          className="h-6 px-2 bg-[#f97316] hover:bg-[#ea580c]"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCancel}
                          className="h-6 px-2 bg-[#262626] hover:bg-[#4d4d4d]"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleEdit(mod)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mod.id)}
                          className="text-white/30 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredModifiers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无修饰器定义</p>
          </div>
        )}
      </div>
    </div>
  );
}