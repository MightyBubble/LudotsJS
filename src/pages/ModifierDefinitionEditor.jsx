import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Trash2, X, Save, GitBranch } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CurveInputMapper from '../components/modifier/CurveInputMapper';

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

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
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

  const selectedAttribute = useMemo(() => {
    if (!editData?.target_attribute_id) return null;
    return attributes.find(a => a.attribute_id === editData.target_attribute_id);
  }, [editData?.target_attribute_id, attributes]);

  const availableAggregationKeys = useMemo(() => {
    return selectedAttribute?.aggregation_keys || [];
  }, [selectedAttribute]);

  const handleCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      modifier_name: "",
      description: "",
      curve_data_graph_id: "",
      curve_input_mappings: [],
      target_attribute_id: "",
      output_aggregation_key: "",
      max_trigger_times: null,
      is_active: true
    });
  };

  const handleEdit = (mod) => {
    setEditingId(mod.id);
    setCreatingNew(false);
    setEditData({ 
      ...mod,
      curve_input_mappings: mod.curve_input_mappings || []
    });
  };

  const handleSave = () => {
    if (!editData.modifier_name || !editData.curve_data_graph_id || !editData.target_attribute_id || !editData.output_aggregation_key) {
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

  const renderEditDialog = () => {
    if (!editData) return null;

    return (
      <Dialog open={!!editData} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {creatingNew ? '新建修饰器' : '编辑修饰器'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-white/70 mb-1.5 block">修饰器名称 *</label>
              <Input
                value={editData.modifier_name}
                onChange={(e) => setEditData({ ...editData, modifier_name: e.target.value })}
                placeholder="等级加成"
                className="bg-[#3c3c3c] border-[#434343] text-white"
              />
            </div>

            <div>
              <label className="text-sm text-white/70 mb-1.5 block">描述</label>
              <Textarea
                value={editData.description || ""}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="bg-[#3c3c3c] border-[#434343] text-white resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm text-white/70 mb-1.5 block">曲线 Data Graph *</label>
              <Select
                value={editData.curve_data_graph_id}
                onValueChange={(value) => setEditData({ ...editData, curve_data_graph_id: value })}
              >
                <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                  <SelectValue placeholder="选择曲线图" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                  {curveGraphs.map(g => (
                    <SelectItem key={g.id} value={g.graph_id} className="text-white hover:bg-[#3d3d3d]">
                      {g.name} ({g.graph_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border border-[#3d3d3d] rounded p-3">
              <CurveInputMapper
                curveGraphId={editData.curve_data_graph_id}
                dataGraphs={dataGraphs}
                attributes={attributes}
                mappings={editData.curve_input_mappings}
                onChange={(mappings) => setEditData({ ...editData, curve_input_mappings: mappings })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">目标属性 *</label>
                <Select
                  value={editData.target_attribute_id}
                  onValueChange={(value) => setEditData({ 
                    ...editData, 
                    target_attribute_id: value,
                    output_aggregation_key: ''
                  })}
                >
                  <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                    <SelectValue placeholder="选择属性" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                    {attributes.map(attr => (
                      <SelectItem key={attr.id} value={attr.attribute_id} className="text-white hover:bg-[#3d3d3d]">
                        {attr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-white/70 mb-1.5 block">输出聚合键 *</label>
                <Select
                  value={editData.output_aggregation_key}
                  onValueChange={(value) => setEditData({ ...editData, output_aggregation_key: value })}
                  disabled={!editData.target_attribute_id}
                >
                  <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                    <SelectValue placeholder={editData.target_attribute_id ? "选择聚合键" : "请先选择属性"} />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                    {availableAggregationKeys.map(key => (
                      <SelectItem key={key} value={key} className="text-white hover:bg-[#3d3d3d]">
                        {key}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">最大触发次数</label>
                <Input
                  type="number"
                  value={editData.max_trigger_times || ""}
                  onChange={(e) => setEditData({ ...editData, max_trigger_times: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="无限制"
                  className="bg-[#3c3c3c] border-[#434343] text-white"
                />
              </div>

              <div>
                <label className="text-sm text-white/70 mb-1.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editData.is_active}
                    onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  激活状态
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={handleCancel} className="bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                取消
              </Button>
              <Button onClick={handleSave} className="bg-[#0e639c] hover:bg-[#1177bb]">
                保存
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredModifiers.map((mod) => {
            const targetAttr = attributes.find(a => a.attribute_id === mod.target_attribute_id);
            
            return (
              <div key={mod.id} className="bg-[#252526] rounded border border-[#3e3e42] p-4 hover:border-[#0e639c] transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-medium">{mod.modifier_name}</h3>
                    <p className="text-white/60 text-xs mt-1">{mod.description || '暂无描述'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => handleEdit(mod)} className="h-7 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" onClick={() => handleDelete(mod.id)} className="h-7 px-2 bg-[#3d3d3d] hover:bg-[#5a1e1e]">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded font-mono">
                    {mod.curve_data_graph_id}
                  </span>
                  {targetAttr && (
                    <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                      → {targetAttr.name}.{mod.output_aggregation_key}
                    </span>
                  )}
                  <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded">
                    输入映射: {(mod.curve_input_mappings || []).length}
                  </span>
                  {mod.is_active ? (
                    <span className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded">激活</span>
                  ) : (
                    <span className="bg-gray-700/50 text-gray-400 px-2 py-0.5 rounded">未激活</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredModifiers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无修饰器定义</p>
          </div>
        )}
      </div>

      {renderEditDialog()}
    </div>
  );
}