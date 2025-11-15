import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Trash2, X, Save, GitBranch } from "lucide-react";

export default function ModifierDefinitionEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
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

  const curveGraphs = useMemo(() => {
    return dataGraphs.filter(g => g.graph_type === 'curve');
  }, [dataGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModifierDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
      setCreatingNew(false);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModifierDefinition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifierDefinitions'] });
      setEditingId(null);
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
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      modifier_name: "",
      description: "",
      input_blackboard_key: "",
      base_value: 0,
      curve_data_graph_id: "",
      output_blackboard_aggregation_key: "",
      max_trigger_times: null,
      input_step_size: 1,
      is_active: true
    });
  };

  const handleEdit = (mod) => {
    setEditingId(mod.id);
    setCreatingNew(false);
    setEditData({ ...mod });
  };

  const handleSave = () => {
    if (!editData.modifier_name || !editData.input_blackboard_key || !editData.curve_data_graph_id || !editData.output_blackboard_aggregation_key) {
      alert('请填写必填项');
      return;
    }
    if (creatingNew) {
      createMutation.mutate(editData);
    } else {
      updateMutation.mutate({ id: editData.id, data: editData });
    }
  };

  const handleCancel = () => {
    setCreatingNew(false);
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除？')) {
      deleteMutation.mutate(id);
    }
  };

  const renderEditRow = () => {
    return (
      <tr className="border-b border-[#3d3d3d] bg-[#252526]">
        <td className="p-2">
          <Input
            value={editData.modifier_name}
            onChange={(e) => setEditData({ ...editData, modifier_name: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="修饰器名称"
          />
        </td>
        <td className="p-2">
          <Input
            value={editData.input_blackboard_key}
            onChange={(e) => setEditData({ ...editData, input_blackboard_key: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white font-mono"
            placeholder="player_level"
          />
        </td>
        <td className="p-2">
          <Input
            type="number"
            step="0.1"
            value={editData.base_value}
            onChange={(e) => setEditData({ ...editData, base_value: parseFloat(e.target.value) || 0 })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-20"
          />
        </td>
        <td className="p-2">
          <Select
            value={editData.curve_data_graph_id}
            onValueChange={(value) => setEditData({ ...editData, curve_data_graph_id: value })}
          >
            <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue placeholder="选择曲线图" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {curveGraphs.map(g => (
                <SelectItem key={g.id} value={g.graph_id} className="text-white hover:bg-[#3d3d3d] text-xs">
                  {g.name} ({g.graph_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <Input
            value={editData.output_blackboard_aggregation_key}
            onChange={(e) => setEditData({ ...editData, output_blackboard_aggregation_key: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white font-mono"
            placeholder="attack_add_zone"
          />
        </td>
        <td className="p-2">
          <Input
            type="number"
            value={editData.input_step_size}
            onChange={(e) => setEditData({ ...editData, input_step_size: parseInt(e.target.value) || 1 })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-16"
          />
        </td>
        <td className="p-2">
          <Input
            type="number"
            value={editData.max_trigger_times || ""}
            onChange={(e) => setEditData({ ...editData, max_trigger_times: e.target.value ? parseInt(e.target.value) : null })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-16"
            placeholder="∞"
          />
        </td>
        <td className="p-2">
          <input
            type="checkbox"
            checked={editData.is_active}
            onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
            className="w-3 h-3"
          />
        </td>
        <td className="p-2">
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <GitBranch className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">修饰器定义编辑器</span>
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

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#2d2d2d] border-b border-[#3d3d3d]">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">修饰器名称</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">输入黑板键</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">基础值</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-40">曲线 Data Graph</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-40">输出聚合键</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-16">步长</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-16">最大次数</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-12">状态</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && renderEditRow()}
            
            {filteredModifiers.map((mod) => {
              const isEditing = editingId === mod.id;
              
              if (isEditing && editData) {
                return <React.Fragment key={mod.id}>{renderEditRow()}</React.Fragment>;
              }
              
              return (
                <tr key={mod.id} className="border-b border-[#3d3d3d] hover:bg-[#252526]">
                  <td className="p-2 text-gray-300">{mod.modifier_name}</td>
                  <td className="p-2 text-gray-400 font-mono text-[10px]">{mod.input_blackboard_key}</td>
                  <td className="p-2 text-gray-300">{mod.base_value}</td>
                  <td className="p-2 text-gray-400 font-mono text-[10px]">{mod.curve_data_graph_id}</td>
                  <td className="p-2 text-gray-400 font-mono text-[10px]">{mod.output_blackboard_aggregation_key}</td>
                  <td className="p-2 text-gray-300">{mod.input_step_size}</td>
                  <td className="p-2 text-gray-300">{mod.max_trigger_times || "∞"}</td>
                  <td className="p-2">
                    {mod.is_active ? <span className="text-gray-300">✓</span> : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(mod)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(mod.id)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredModifiers.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无修饰器定义</div>
          </div>
        )}
      </div>
    </div>
  );
}