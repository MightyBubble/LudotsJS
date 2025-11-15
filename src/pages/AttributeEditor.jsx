import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Trash2, X, Save, Layers, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AggregationInputMapper from '../components/attribute/AggregationInputMapper';
import ExtraKeysEditor from '../components/attribute/ExtraKeysEditor';

export default function AttributeEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

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
      setCreatingNew(false);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Attribute.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      setEditingId(null);
      setEditData(null);
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
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      attribute_id: "",
      name: "",
      description: "",
      default_base_value: 100,
      aggregation_keys: [],
      aggregation_inputs: {},
      extra_keys: [],
      final_calculation_data_graph_id: ""
    });
  };

  const handleEdit = (attr) => {
    setEditingId(attr.id);
    setCreatingNew(false);
    setEditData({ 
      ...attr,
      aggregation_keys: attr.aggregation_keys || [],
      extra_keys: attr.extra_keys || []
    });
  };

  const handleSave = () => {
    if (!editData.attribute_id || !editData.name || !editData.final_calculation_data_graph_id) {
      alert('请填写必填项：属性ID、名称和Data Graph');
      return;
    }
    if (editData.aggregation_keys.length === 0) {
      alert('请至少添加一个聚合键');
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
    setShowAdvancedConfig(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此属性吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddAggregationKey = () => {
    setEditData({
      ...editData,
      aggregation_keys: [...editData.aggregation_keys, '']
    });
  };

  const handleRemoveAggregationKey = (index) => {
    setEditData({
      ...editData,
      aggregation_keys: editData.aggregation_keys.filter((_, i) => i !== index)
    });
  };

  const handleUpdateAggregationKey = (index, value) => {
    const updated = [...editData.aggregation_keys];
    updated[index] = value;
    setEditData({
      ...editData,
      aggregation_keys: updated
    });
  };

  const renderEditDialog = () => {
    if (!editData) return null;

    return (
      <Dialog open={!!editData} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {creatingNew ? '新建属性' : '编辑属性'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">属性ID *</label>
                <Input
                  value={editData.attribute_id}
                  onChange={(e) => setEditData({ ...editData, attribute_id: e.target.value })}
                  placeholder="attack_power"
                  className="bg-[#3c3c3c] border-[#434343] text-white"
                />
              </div>
              <div>
                <label className="text-sm text-white/70 mb-1.5 block">名称 *</label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="攻击力"
                  className="bg-[#3c3c3c] border-[#434343] text-white"
                />
              </div>
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
              <label className="text-sm text-white/70 mb-1.5 block">默认基础值</label>
              <Input
                type="number"
                step="0.1"
                value={editData.default_base_value}
                onChange={(e) => setEditData({ ...editData, default_base_value: parseFloat(e.target.value) || 0 })}
                className="bg-[#3c3c3c] border-[#434343] text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-white/70">聚合键 *</label>
                <Button 
                  size="sm" 
                  onClick={handleAddAggregationKey}
                  className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
                >
                  <Plus className="w-3 h-3 mr-1" />添加
                </Button>
              </div>
              <div className="space-y-2">
                {editData.aggregation_keys.map((key, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={key}
                      onChange={(e) => handleUpdateAggregationKey(index, e.target.value)}
                      placeholder="attack_add_zone"
                      className="bg-[#3c3c3c] border-[#434343] text-white flex-1"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => handleRemoveAggregationKey(index)}
                      className="h-9 w-9 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-white/70 mb-1.5 block">计算 Data Graph *</label>
              <Select
                value={editData.final_calculation_data_graph_id}
                onValueChange={(value) => setEditData({ ...editData, final_calculation_data_graph_id: value })}
              >
                <SelectTrigger className="bg-[#3c3c3c] border-[#434343] text-white">
                  <SelectValue placeholder="选择 Data Graph" />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                  {attributeCalcGraphs.map(g => (
                    <SelectItem key={g.id} value={g.graph_id} className="text-white hover:bg-[#3d3d3d]">
                      {g.name} ({g.graph_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border border-[#3d3d3d] rounded p-3">
              <label className="text-sm text-white/70 mb-2 block">聚合输入映射</label>
              <AggregationInputMapper
                dataGraphId={editData.final_calculation_data_graph_id}
                dataGraphs={dataGraphs}
                aggregationKeys={editData.aggregation_keys}
                mappings={editData.aggregation_inputs}
                onChange={(mappings) => setEditData({ ...editData, aggregation_inputs: mappings })}
              />
            </div>

            <div className="border border-[#3d3d3d] rounded p-3">
              <ExtraKeysEditor
                extraKeys={editData.extra_keys}
                dataGraphs={dataGraphs}
                onChange={(keys) => setEditData({ ...editData, extra_keys: keys })}
              />
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
        <Layers className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性编辑器</span>
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
          新建属性
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 gap-3">
          {filteredAttributes.map((attr) => (
            <div key={attr.id} className="bg-[#252526] rounded border border-[#3e3e42] p-4 hover:border-[#0e639c] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-white font-medium">{attr.name}</h3>
                  <p className="text-white/40 text-xs font-mono mt-1">{attr.attribute_id}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => handleEdit(attr)} className="h-7 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button size="sm" onClick={() => handleDelete(attr.id)} className="h-7 px-2 bg-[#3d3d3d] hover:bg-[#5a1e1e]">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <p className="text-white/60 text-xs mb-3">{attr.description || '暂无描述'}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                  基础值: {attr.default_base_value}
                </span>
                <span className="bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">
                  聚合键: {(attr.aggregation_keys || []).length}
                </span>
                <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded font-mono">
                  {attr.final_calculation_data_graph_id}
                </span>
              </div>
            </div>
          ))}
        </div>
        
        {filteredAttributes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无属性定义</p>
          </div>
        )}
      </div>

      {renderEditDialog()}
    </div>
  );
}