import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, GitBranch } from "lucide-react";

export default function ModifierDefinitionEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);

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

  const curveGraphs = useMemo(() => {
    return dataGraphs.filter(g => g.graph_type === 'curve');
  }, [dataGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModifierDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModifierDefinition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
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
      target_attribute_id: attributes[0]?.attribute_id || "",
      output_aggregation_key: attributes[0]?.aggregation_keys?.[0] || "",
      max_trigger_times: null,
      is_active: true
    };
    createMutation.mutate(newMod);
  };

  const handleUpdate = (id, field, value) => {
    const mod = modifiers.find(m => m.id === id);
    if (!mod) return;
    
    const updated = { ...mod, [field]: value };
    updateMutation.mutate({ id, data: updated });
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddMapping = (modId) => {
    const mod = modifiers.find(m => m.id === modId);
    if (!mod) return;

    const graph = dataGraphs.find(g => g.graph_id === mod.curve_data_graph_id);
    if (!graph) return;

    const graphDef = typeof graph.graph_definition === 'string' 
      ? JSON.parse(graph.graph_definition) 
      : graph.graph_definition;
    const blackboard = graphDef?.blackboard || {};
    const publicKeys = Object.keys(blackboard).filter(k => blackboard[k]?.public === true);
    
    const newKey = publicKeys.find(k => !(mod.curve_input_mappings || []).some(m => m.graph_blackboard_key === k)) || publicKeys[0];
    if (!newKey) return;

    const newMapping = {
      graph_blackboard_key: newKey,
      source_type: 'constant',
      constant_value: 0,
      step_size: 1
    };

    updateMutation.mutate({
      id: modId,
      data: {
        ...mod,
        curve_input_mappings: [...(mod.curve_input_mappings || []), newMapping]
      }
    });
  };

  const handleUpdateMapping = (modId, mappingIndex, field, value) => {
    const mod = modifiers.find(m => m.id === modId);
    if (!mod) return;

    const mappings = [...(mod.curve_input_mappings || [])];
    mappings[mappingIndex] = { ...mappings[mappingIndex], [field]: value };

    updateMutation.mutate({
      id: modId,
      data: { ...mod, curve_input_mappings: mappings }
    });
  };

  const handleRemoveMapping = (modId, mappingIndex) => {
    const mod = modifiers.find(m => m.id === modId);
    if (!mod) return;

    const mappings = (mod.curve_input_mappings || []).filter((_, i) => i !== mappingIndex);
    updateMutation.mutate({
      id: modId,
      data: { ...mod, curve_input_mappings: mappings }
    });
  };

  const getAttributeKeys = (attributeId) => {
    const attr = attributes.find(a => a.attribute_id === attributeId);
    if (!attr) return [];
    
    const keys = [...(attr.aggregation_keys || [])];
    if (attr.extra_keys && Array.isArray(attr.extra_keys)) {
      attr.extra_keys.forEach(ek => {
        if (ek.key) keys.push(ek.key);
      });
    }
    return keys;
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
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
            className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-white">
          <thead className="bg-[#2d2d2d] border-b border-[#3d3d3d] sticky top-0 z-10">
            <tr>
              <th className="text-left p-2 font-medium text-white/70 w-40">名称</th>
              <th className="text-left p-2 font-medium text-white/70 w-48">曲线图</th>
              <th className="text-left p-2 font-medium text-white/70">输入映射</th>
              <th className="text-left p-2 font-medium text-white/70 w-40">目标属性</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">输出键</th>
              <th className="text-left p-2 font-medium text-white/70 w-24">最大次数</th>
              <th className="text-left p-2 font-medium text-white/70 w-16">激活</th>
              <th className="text-right p-2 font-medium text-white/70 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filteredModifiers.map((mod) => {
              const targetAttr = attributes.find(a => a.attribute_id === mod.target_attribute_id);
              const availableKeys = targetAttr?.aggregation_keys || [];
              
              return (
                <tr key={mod.id} className="border-b border-[#3d3d3d] hover:bg-[#2d2d2d]">
                  <td className="p-2">
                    <Input
                      value={mod.modifier_name}
                      onChange={(e) => handleUpdate(mod.id, 'modifier_name', e.target.value)}
                      className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                    />
                  </td>
                  <td className="p-2">
                    <Select
                      value={mod.curve_data_graph_id}
                      onValueChange={(val) => handleUpdate(mod.id, 'curve_data_graph_id', val)}
                    >
                      <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                        {curveGraphs.map(g => (
                          <SelectItem key={g.id} value={g.graph_id} className="text-white hover:bg-[#3d3d3d] text-xs">
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      {(mod.curve_input_mappings || []).map((mapping, idx) => (
                        <div key={idx} className="flex gap-1 items-center">
                          <span className="text-white/50 text-xs">{mapping.graph_blackboard_key} ←</span>
                          
                          {mapping.source_type === 'tag_count' && (
                            <>
                              <Select
                                value={mapping.tag_path || ''}
                                onValueChange={(val) => handleUpdateMapping(mod.id, idx, 'tag_path', val)}
                              >
                                <SelectTrigger className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-32">
                                  <SelectValue placeholder="标签" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d] max-h-48">
                                  {tags.map(t => (
                                    <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                                      {t.full_path}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                value={mapping.step_size || 1}
                                onChange={(e) => handleUpdateMapping(mod.id, idx, 'step_size', parseInt(e.target.value) || 1)}
                                className="h-5 w-12 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                              />
                            </>
                          )}
                          
                          {mapping.source_type === 'attribute_key' && (
                            <>
                              <Select
                                value={mapping.attribute_id || ''}
                                onValueChange={(val) => handleUpdateMapping(mod.id, idx, 'attribute_id', val)}
                              >
                                <SelectTrigger className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-24">
                                  <SelectValue placeholder="属性" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                                  {attributes.map(a => (
                                    <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                                      {a.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={mapping.attribute_key || ''}
                                onValueChange={(val) => handleUpdateMapping(mod.id, idx, 'attribute_key', val)}
                              >
                                <SelectTrigger className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-24">
                                  <SelectValue placeholder="键" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
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
                              onChange={(e) => handleUpdateMapping(mod.id, idx, 'constant_value', parseFloat(e.target.value) || 0)}
                              className="h-5 w-16 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                            />
                          )}
                          
                          <Select
                            value={mapping.source_type}
                            onValueChange={(val) => handleUpdateMapping(mod.id, idx, 'source_type', val)}
                          >
                            <SelectTrigger className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                              <SelectItem value="tag_count" className="text-white text-xs">标签</SelectItem>
                              <SelectItem value="attribute_key" className="text-white text-xs">属性</SelectItem>
                              <SelectItem value="constant" className="text-white text-xs">常量</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <button
                            onClick={() => handleRemoveMapping(mod.id, idx)}
                            className="text-white/30 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        onClick={() => handleAddMapping(mod.id)}
                        className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-2">
                    <Select
                      value={mod.target_attribute_id}
                      onValueChange={(val) => handleUpdate(mod.id, 'target_attribute_id', val)}
                    >
                      <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                        {attributes.map(a => (
                          <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select
                      value={mod.output_aggregation_key}
                      onValueChange={(val) => handleUpdate(mod.id, 'output_aggregation_key', val)}
                    >
                      <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                        {availableKeys.map(k => (
                          <SelectItem key={k} value={k} className="text-white text-xs">
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={mod.max_trigger_times || ""}
                      onChange={(e) => handleUpdate(mod.id, 'max_trigger_times', e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="∞"
                      className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white text-center"
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={mod.is_active}
                      onChange={(e) => handleUpdate(mod.id, 'is_active', e.target.checked)}
                      className="w-4 h-4"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleDelete(mod.id)}
                      className="text-white/30 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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