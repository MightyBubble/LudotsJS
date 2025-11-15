import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Layers } from "lucide-react";

export default function AttributeEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: dataGraphs = [] } = useQuery({
    queryKey: ['dataGraphs'],
    queryFn: () => base44.entities.DataGraph.list(),
    initialData: [],
  });

  const attributeCalcGraphs = useMemo(() => {
    return dataGraphs.filter(g => g.graph_type === 'attribute_calculation');
  }, [dataGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Attribute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attribute.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Attribute.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
    },
  });

  const filteredAttributes = useMemo(() => {
    if (!searchQuery) return attributes;
    return attributes.filter(attr => 
      attr.attribute_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attr.name && attr.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [attributes, searchQuery]);

  const handleCreate = () => {
    const newAttr = {
      attribute_id: "new_attribute",
      name: "新属性",
      description: "",
      default_base_value: 100,
      aggregation_keys: ["base"],
      aggregation_inputs: {},
      extra_keys: [],
      final_calculation_data_graph_id: attributeCalcGraphs[0]?.graph_id || ""
    };
    createMutation.mutate(newAttr);
  };

  const handleUpdate = (attr, updates) => {
    const updatedData = { ...attr, ...updates };
    updateMutation.mutate({ id: attr.id, data: updatedData });
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此属性吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddAggregationKey = (attr) => {
    handleUpdate(attr, {
      aggregation_keys: [...(attr.aggregation_keys || []), '']
    });
  };

  const handleUpdateAggregationKey = (attr, index, value) => {
    const keys = [...(attr.aggregation_keys || [])];
    keys[index] = value;
    handleUpdate(attr, { aggregation_keys: keys });
  };

  const handleRemoveAggregationKey = (attr, index) => {
    const keys = (attr.aggregation_keys || []).filter((_, i) => i !== index);
    handleUpdate(attr, { aggregation_keys: keys });
  };

  const handleAddMapping = (attr) => {
    const graph = dataGraphs.find(g => g.graph_id === attr.final_calculation_data_graph_id);
    if (!graph) return;

    const graphDef = typeof graph.graph_definition === 'string' 
      ? JSON.parse(graph.graph_definition) 
      : graph.graph_definition;
    const blackboard = graphDef?.blackboard || {};
    const publicKeys = Object.keys(blackboard).filter(k => blackboard[k]?.public === true);
    
    const newKey = publicKeys.find(k => !Object.keys(attr.aggregation_inputs || {}).includes(k)) || publicKeys[0];
    if (!newKey) return;

    const aggKey = (attr.aggregation_keys || [])[0] || '';
    handleUpdate(attr, {
      aggregation_inputs: { ...(attr.aggregation_inputs || {}), [newKey]: aggKey }
    });
  };

  const handleUpdateMapping = (attr, graphKey, aggKey) => {
    handleUpdate(attr, {
      aggregation_inputs: { ...(attr.aggregation_inputs || {}), [graphKey]: aggKey }
    });
  };

  const handleRemoveMapping = (attr, graphKey) => {
    const mappings = { ...(attr.aggregation_inputs || {}) };
    delete mappings[graphKey];
    handleUpdate(attr, { aggregation_inputs: mappings });
  };

  const getPublicBlackboardKeys = (graphId) => {
    const graph = dataGraphs.find(g => g.graph_id === graphId);
    if (!graph) return [];
    
    try {
      const graphDef = typeof graph.graph_definition === 'string' 
        ? JSON.parse(graph.graph_definition) 
        : graph.graph_definition;
      const blackboard = graphDef?.blackboard || {};
      return Object.keys(blackboard).filter(k => blackboard[k]?.public === true);
    } catch {
      return [];
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Layers className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性定义</span>
        <span className="text-xs text-gray-500">共 {filteredAttributes.length} 个</span>
        
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
              <th className="text-left p-2 font-medium text-white/70 w-32">属性ID</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">名称</th>
              <th className="text-left p-2 font-medium text-white/70 w-24">基础值</th>
              <th className="text-left p-2 font-medium text-white/70">聚合键</th>
              <th className="text-left p-2 font-medium text-white/70 w-48">计算图</th>
              <th className="text-left p-2 font-medium text-white/70">输入映射</th>
              <th className="text-right p-2 font-medium text-white/70 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filteredAttributes.map((attr) => {
              const publicKeys = getPublicBlackboardKeys(attr.final_calculation_data_graph_id);
              
              return (
                <tr key={attr.id} className="border-b border-[#3d3d3d] hover:bg-[#2d2d2d]">
                  <td className="p-2">
                    <Input
                      value={attr.attribute_id}
                      onChange={(e) => handleUpdate(attr, { attribute_id: e.target.value })}
                      className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      value={attr.name}
                      onChange={(e) => handleUpdate(attr, { name: e.target.value })}
                      className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={attr.default_base_value}
                      onChange={(e) => handleUpdate(attr, { default_base_value: parseFloat(e.target.value) || 0 })}
                      className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                    />
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      {(attr.aggregation_keys || []).map((key, idx) => (
                        <div key={idx} className="flex gap-1">
                          <Input
                            value={key}
                            onChange={(e) => handleUpdateAggregationKey(attr, idx, e.target.value)}
                            className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white flex-1"
                          />
                          <button
                            onClick={() => handleRemoveAggregationKey(attr, idx)}
                            className="text-white/30 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        onClick={() => handleAddAggregationKey(attr)}
                        className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                  <td className="p-2">
                    <Select
                      value={attr.final_calculation_data_graph_id}
                      onValueChange={(val) => handleUpdate(attr, { final_calculation_data_graph_id: val })}
                    >
                      <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                        {attributeCalcGraphs.map(g => (
                          <SelectItem key={g.id} value={g.graph_id} className="text-white text-xs">
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      {Object.entries(attr.aggregation_inputs || {}).map(([graphKey, aggKey]) => (
                        <div key={graphKey} className="flex gap-1 items-center">
                          <span className="text-white/50 text-xs">{graphKey} ←</span>
                          <Select
                            value={aggKey}
                            onValueChange={(val) => handleUpdateMapping(attr, graphKey, val)}
                          >
                            <SelectTrigger className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                              {(attr.aggregation_keys || []).map(k => (
                                <SelectItem key={k} value={k} className="text-white text-xs">
                                  {k}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => handleRemoveMapping(attr, graphKey)}
                            className="text-white/30 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {publicKeys.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => handleAddMapping(attr)}
                          className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleDelete(attr.id)}
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
        
        {filteredAttributes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无属性定义</p>
          </div>
        )}
      </div>
    </div>
  );
}