import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Layers, Edit3, Save, X, Zap, MinusSquare, Activity } from "lucide-react";
import ThresholdEventPanel from "../components/attribute/ThresholdEventPanel";
import ClampConfigPanel from "../components/attribute/ClampConfigPanel";
import RecoveryConfigPanel from "../components/attribute/RecoveryConfigPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AttributeEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState(null);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [showClampPanel, setShowClampPanel] = useState(false);
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);

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
    // 属性计算图：新建的 data 图（用途标记为 attribute_calculation/general）与遗留的 attribute_calculation 类型都可选
    return dataGraphs.filter(g =>
      g.graph_type === 'attribute_calculation' ||
      (g.graph_type === 'data' && (!g.usage || g.usage === 'general' || g.usage === 'attribute_calculation'))
    );
  }, [dataGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Attribute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      setEditingRow(null);
      setEditData(null);
    },
    onError: (error) => {
      console.error('创建失败:', error);
      alert('创建失败: ' + (error.message || '未知错误'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => {
      console.log('保存数据:', { id, data });
      return base44.entities.Attribute.update(id, data);
    },
    onSuccess: () => {
      console.log('保存成功');
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      setEditingRow(null);
      setEditData(null);
      setSelectedAttribute(null); // Clear selected attribute after update
      setShowClampPanel(false);
      setShowRecoveryPanel(false);
    },
    onError: (error) => {
      console.error('保存失败:', error);
      alert('保存失败: ' + (error.message || '未知错误'));
    }
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
      keys: [{ name: "base_value", type: "value" }],
      input_mappings: {},
      final_calculation_data_graph_id: attributeCalcGraphs[0]?.graph_id || ""
    };
    createMutation.mutate(newAttr);
  };

  const handleEdit = (attr) => {
    setEditingRow(attr.id);
    setEditData({ 
      ...attr, 
      keys: attr.keys || [],
      input_mappings: attr.input_mappings || {},
      description: attr.description || "",
      clamp_config: attr.clamp_config || { enabled: false },
      recovery_config: attr.recovery_config || { enabled: false }
    });
  };

  const handleSave = () => {
    console.log('开始保存，当前数据:', editData);
    
    if (!editData.attribute_id || !editData.name || !editData.final_calculation_data_graph_id) {
      alert('请填写必填项');
      return;
    }
    if (editData.keys.length === 0) {
      alert('请至少添加一个键');
      return;
    }
    
    const uniqueKeys = editData.keys.filter((key, index, self) => 
      index === self.findIndex(k => k.name === key.name)
    );
    
    const dataToSave = {
      attribute_id: editData.attribute_id,
      name: editData.name,
      description: editData.description || "",
      default_base_value: editData.default_base_value,
      keys: uniqueKeys,
      input_mappings: editData.input_mappings || {},
      final_calculation_data_graph_id: editData.final_calculation_data_graph_id,
      clamp_config: editData.clamp_config,
      recovery_config: editData.recovery_config
    };
    
    console.log('准备保存的数据:', dataToSave);
    updateMutation.mutate({ id: editData.id, data: dataToSave });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此属性吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddKey = () => {
    const existingNames = editData.keys.map(k => k.name);
    let newKeyName = "new_key";
    let counter = 1;
    
    while (existingNames.includes(newKeyName)) {
      newKeyName = `new_key_${counter}`;
      counter++;
    }
    
    setEditData({
      ...editData,
      keys: [...editData.keys, { name: newKeyName, type: "value" }]
    });
  };

  const handleUpdateKey = (index, field, value) => {
    const keys = [...editData.keys];
    keys[index] = { ...keys[index], [field]: value };
    setEditData({ ...editData, keys });
  };

  const handleRemoveKey = (index) => {
    setEditData({
      ...editData,
      keys: editData.keys.filter((_, i) => i !== index)
    });
  };

  const handleAddMapping = () => {
    const graph = dataGraphs.find(g => g.graph_id === editData.final_calculation_data_graph_id);
    if (!graph) return;

    const graphDef = typeof graph.graph_definition === 'string' 
      ? JSON.parse(graph.graph_definition) 
      : graph.graph_definition;
    const blackboard = graphDef?.blackboard || {};
    const publicKeys = Object.keys(blackboard).filter(k => blackboard[k]?.public === true);
    
    const newKey = publicKeys.find(k => !Object.keys(editData.input_mappings || {}).includes(k)) || publicKeys[0];
    if (!newKey) return;

    const attrKey = editData.keys.find(k => k.name)?.name || 'base_value';
    setEditData({
      ...editData,
      input_mappings: { ...(editData.input_mappings || {}), [newKey]: attrKey }
    });
  };

  const handleUpdateMapping = (graphKey, attrKey) => {
    setEditData({
      ...editData,
      input_mappings: { ...(editData.input_mappings || {}), [graphKey]: attrKey }
    });
  };

  const handleRemoveMapping = (graphKey) => {
    const mappings = { ...(editData.input_mappings || {}) };
    delete mappings[graphKey];
    setEditData({ ...editData, input_mappings: mappings });
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
    <div className="h-screen flex flex-col bg-[#0D0F14] text-white">
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] flex items-center px-2 md:px-4 gap-2 md:gap-3">
        <Layers className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性定义</span>
        <span className="text-xs text-gray-500 hidden sm:inline">共 {filteredAttributes.length} 个</span>
        
        <div className="flex-1" />

        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-2 md:px-3 bg-[#D97706] hover:bg-[#B45309] text-white text-xs">
          <Plus className="w-3 h-3 md:mr-1" />
          <span className="hidden md:inline">新建</span>
        </Button>
      </div>

      {/* 移动端搜索 */}
      <div className="md:hidden px-2 py-2 bg-[#15171C] border-b border-[#2A2E37]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 w-full bg-[#0D0F14] border-[#2A2E37] text-sm text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* 桌面端表格 */}
        <table className="w-full text-xs text-white hidden md:table">
          <thead className="bg-[#15171C] border-b border-[#2A2E37] sticky top-0 z-10">
            <tr>
              <th className="text-left p-2 font-medium text-white/70 w-32">属性ID</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">名称</th>
              <th className="text-left p-2 font-medium text-white/70 w-24">基础值</th>
              <th className="text-left p-2 font-medium text-white/70">键</th>
              <th className="text-left p-2 font-medium text-white/70 w-48">计算图</th>
              <th className="text-left p-2 font-medium text-white/70">输入映射</th>
              <th className="text-right p-2 font-medium text-white/70 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {filteredAttributes.map((attr) => {
              const isEditing = editingRow === attr.id;
              const currentData = isEditing ? editData : attr;
              const publicKeys = getPublicBlackboardKeys(currentData.final_calculation_data_graph_id);
              
              return (
                <tr key={attr.id} className="border-b border-[#2A2E37] hover:bg-[#15171C]">
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.attribute_id}
                        onChange={(e) => setEditData({ ...editData, attribute_id: e.target.value })}
                        className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90">{attr.attribute_id}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90">{attr.name}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editData.default_base_value}
                        onChange={(e) => setEditData({ ...editData, default_base_value: parseFloat(e.target.value) || 0 })}
                        className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90">{attr.default_base_value}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        {editData.keys.map((key, idx) => (
                          <div key={idx} className="flex gap-1">
                            <Input
                              value={key.name}
                              onChange={(e) => handleUpdateKey(idx, 'name', e.target.value)}
                              placeholder="键名"
                              className="h-5 bg-[#0D0F14] border-[#2A2E37] text-xs text-white flex-1"
                            />
                            <Select
                              value={key.type}
                              onValueChange={(val) => handleUpdateKey(idx, 'type', val)}
                            >
                              <SelectTrigger className="h-5 bg-[#0D0F14] border-[#2A2E37] text-white text-xs w-16">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                <SelectItem value="value" className="text-white text-xs">值</SelectItem>
                                <SelectItem value="array" className="text-white text-xs">数组</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              onClick={() => handleRemoveKey(idx)}
                              className="text-white/30 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          onClick={handleAddKey}
                          className="h-5 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(attr.keys || []).map((key, idx) => (
                          <div key={idx} className="text-white/70 text-xs">
                            {key.name} <span className="text-white/40">({key.type === 'value' ? '值' : '数组'})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Select
                        value={editData.final_calculation_data_graph_id}
                        onValueChange={(val) => setEditData({ ...editData, final_calculation_data_graph_id: val })}
                      >
                        <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                          {attributeCalcGraphs.map(g => (
                            <SelectItem key={g.id} value={g.graph_id} className="text-white text-xs">
                              {g.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-white/70 text-xs font-mono">{attr.final_calculation_data_graph_id}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        {Object.entries(editData.input_mappings || {}).map(([graphKey, attrKey]) => (
                          <div key={graphKey} className="flex gap-1 items-center">
                            <span className="text-white/50 text-xs">{graphKey} ←</span>
                            <Select
                              value={attrKey}
                              onValueChange={(val) => handleUpdateMapping(graphKey, val)}
                            >
                              <SelectTrigger className="h-5 bg-[#0D0F14] border-[#2A2E37] text-white text-xs w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                {editData.keys.filter(k => k.name).map(k => (
                                  <SelectItem key={k.name} value={k.name} className="text-white text-xs">
                                    {k.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <button
                              onClick={() => handleRemoveMapping(graphKey)}
                              className="text-white/30 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {publicKeys.length > 0 && (
                          <Button
                            size="sm"
                            onClick={handleAddMapping}
                            className="h-5 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {Object.entries(attr.input_mappings || {}).map(([graphKey, attrKey]) => (
                          <div key={graphKey} className="text-white/70 text-xs">
                            {graphKey} ← {attrKey}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {isEditing ? (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="h-6 px-2 bg-[#D97706] hover:bg-[#B45309]"
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
                          onClick={() => setSelectedAttribute(attr)}
                          className="text-white/30 hover:text-yellow-400"
                          title="事件"
                        >
                          <Zap className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedAttribute(attr); setShowClampPanel(true); }}
                          className="text-white/30 hover:text-orange-400"
                          title="钳制"
                        >
                          <MinusSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedAttribute(attr); setShowRecoveryPanel(true); }}
                          className="text-white/30 hover:text-green-400"
                          title="回复"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(attr)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(attr.id)}
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

        {/* 移动端卡片 */}
        <div className="md:hidden space-y-2 p-2">
          {filteredAttributes.map((attr) => {
            const isEditing = editingRow === attr.id;
            const currentData = isEditing ? editData : attr;

            return (
              <div key={attr.id} className="bg-[#15171C] rounded border border-[#3e3e42] p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{currentData.attribute_id}</div>
                    <div className="text-xs text-white/70">{currentData.name}</div>
                  </div>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-6 px-2 bg-[#D97706] hover:bg-[#B45309]">
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#262626] hover:bg-[#4d4d4d]">
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setSelectedAttribute(attr)} className="text-white/30 hover:text-yellow-400 p-1">
                          <Zap className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedAttribute(attr); setShowClampPanel(true); }}
                          className="text-white/30 hover:text-orange-400 p-1"
                          title="钳制"
                        >
                          <MinusSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedAttribute(attr); setShowRecoveryPanel(true); }}
                          className="text-white/30 hover:text-green-400 p-1"
                          title="回复"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(attr)} className="text-white/30 hover:text-blue-400 p-1">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(attr.id)} className="text-white/30 hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-white/50">
                  基础值: {currentData.default_base_value} | 键: {(currentData.keys || []).length}个
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredAttributes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无属性定义</p>
          </div>
        )}
      </div>

      {/* 阈值事件弹窗 */}
      <Dialog open={selectedAttribute && !showClampPanel && !showRecoveryPanel} onOpenChange={(open) => !open && setSelectedAttribute(null)}>
        <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              {selectedAttribute?.name} - 阈值事件
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedAttribute && (
              <ThresholdEventPanel 
                attributeId={selectedAttribute.attribute_id} 
                attributeKeys={selectedAttribute.keys || []}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 钳制配置弹窗 */}
      <Dialog open={showClampPanel} onOpenChange={(open) => { setShowClampPanel(open); if (!open) setSelectedAttribute(null); }}>
        <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <MinusSquare className="w-4 h-4 text-orange-400" />
              {selectedAttribute?.name} - 钳制约束
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedAttribute && (
              <ClampConfigPanel
                config={selectedAttribute.clamp_config}
                keys={selectedAttribute.keys || []}
                onChange={(config) => {
                  updateMutation.mutate({
                    id: selectedAttribute.id,
                    data: { clamp_config: config }
                  });
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 回复行为弹窗 */}
      <Dialog open={showRecoveryPanel} onOpenChange={(open) => { setShowRecoveryPanel(open); if (!open) setSelectedAttribute(null); }}>
        <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              {selectedAttribute?.name} - 回复行为
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedAttribute && (
              <RecoveryConfigPanel
                config={selectedAttribute.recovery_config}
                keys={selectedAttribute.keys || []}
                onChange={(config) => {
                  updateMutation.mutate({
                    id: selectedAttribute.id,
                    data: { recovery_config: config }
                  });
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}