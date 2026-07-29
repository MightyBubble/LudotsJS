import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Layers, Edit3, Save, X, Zap, MinusSquare, Activity } from "lucide-react";
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import { Section } from '@/components/ludots/ui';
import { ToolButton } from '@/components/shell/ui';
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
    // 属性计算：用途为 attribute_calculation/general 且出口为数值的图
    return dataGraphs.filter(g =>
      (g.usage === 'attribute_calculation' || g.usage === 'general') && g.return_type === 'number'
    );
  }, [dataGraphs]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Attribute.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['attributes'] });
      handleEdit(record);
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
    <>
      <RecordWorkspace
        entityName="Attribute"
        records={attributes}
        toItem={(item) => ({ id: item.id, name: item.name, subtitle: `${item.attribute_id} · ${(item.keys || []).length} 个键` })}
        columns={[
          { key: 'attribute_id', label: '属性 ID', width: 200, render: (item) => <span className="font-mono text-[#E2D8B3]">{item.attribute_id}</span> },
          { key: 'name', label: '名称', width: 160 },
          { key: 'default_base_value', label: '基础值', width: 90 },
          { key: 'keys', label: '键', render: (item) => (item.keys || []).map(key => key.name).join(', ') || '-' },
          { key: 'final_calculation_data_graph_id', label: '计算图', width: 220 },
          { key: 'input_mappings', label: '输入映射', render: (item) => `${Object.keys(item.input_mappings || {}).length} 项` },
        ]}
        selectedId={editingRow}
        onSelect={handleEdit}
        onCreate={handleCreate}
        onDelete={(item) => handleDelete(item.id)}
        onSave={handleSave}
        dirty={Boolean(editData)}
      >
        {editData && (
          <div className="max-w-3xl">
            <Section title="基础信息" right={<div className="flex gap-1"><ToolButton icon={Zap} onClick={() => setSelectedAttribute(editData)}>阈值</ToolButton><ToolButton icon={MinusSquare} onClick={() => { setSelectedAttribute(editData); setShowClampPanel(true); }}>钳制</ToolButton><ToolButton icon={Activity} onClick={() => { setSelectedAttribute(editData); setShowRecoveryPanel(true); }}>恢复</ToolButton></div>}>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-gray-400 mb-1">属性 ID</label><Input value={editData.attribute_id || ''} onChange={(e) => setEditData({ ...editData, attribute_id: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /></div><div><label className="block text-xs text-gray-400 mb-1">名称</label><Input value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /></div></div>
              <div><label className="block text-xs text-gray-400 mb-1">描述</label><Input value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">默认基础值</label><Input type="number" value={editData.default_base_value ?? 0} onChange={(e) => setEditData({ ...editData, default_base_value: Number(e.target.value) })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /></div>
            </Section>
            <Section title="属性键">
              <div className="space-y-2">{(editData.keys || []).map((key, index) => <div key={index} className="grid grid-cols-[1fr_140px_32px] gap-2"><Input value={key.name} onChange={(e) => handleUpdateKey(index, 'name', e.target.value)} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /><Select value={key.type} onValueChange={(value) => handleUpdateKey(index, 'type', value)}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]"><SelectItem value="value">值</SelectItem><SelectItem value="array">数组</SelectItem></SelectContent></Select><Button size="sm" variant="ghost" onClick={() => handleRemoveKey(index)} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button></div>)}</div>
              <Button size="sm" onClick={handleAddKey} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加键</Button>
            </Section>
            <Section title="计算图与输入映射">
              <Select value={editData.final_calculation_data_graph_id || ''} onValueChange={(value) => setEditData({ ...editData, final_calculation_data_graph_id: value, input_mappings: {} })}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue placeholder="选择计算图" /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{attributeCalcGraphs.map((graph) => <SelectItem key={graph.id} value={graph.graph_id}>{graph.name}</SelectItem>)}</SelectContent></Select>
              <div className="space-y-2">{Object.entries(editData.input_mappings || {}).map(([graphKey, attributeKey]) => <div key={graphKey} className="grid grid-cols-[1fr_1fr_32px] gap-2"><Input value={graphKey} disabled className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /><Select value={attributeKey} onValueChange={(value) => handleUpdateMapping(graphKey, value)}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{editData.keys.filter(key => key.name).map(key => <SelectItem key={key.name} value={key.name}>{key.name}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="ghost" onClick={() => handleRemoveMapping(graphKey)} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button></div>)}</div>
              {getPublicBlackboardKeys(editData.final_calculation_data_graph_id).length > Object.keys(editData.input_mappings || {}).length && <Button size="sm" onClick={handleAddMapping} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加映射</Button>}
            </Section>
          </div>
        )}
      </RecordWorkspace>

      <Dialog open={Boolean(selectedAttribute) && !showClampPanel && !showRecoveryPanel} onOpenChange={(open) => !open && setSelectedAttribute(null)}><DialogContent className="bg-[#15171C] border-[#2A2E37] text-white max-w-2xl max-h-[80vh] overflow-y-auto"><DialogHeader><DialogTitle>阈值事件</DialogTitle></DialogHeader>{selectedAttribute && <ThresholdEventPanel attributeId={selectedAttribute.attribute_id} attributeKeys={selectedAttribute.keys || []} />}</DialogContent></Dialog>
      <Dialog open={showClampPanel} onOpenChange={(open) => { setShowClampPanel(open); if (!open) setSelectedAttribute(null); }}><DialogContent className="bg-[#15171C] border-[#2A2E37] text-white max-w-xl"><DialogHeader><DialogTitle>钳制约束</DialogTitle></DialogHeader>{selectedAttribute && <ClampConfigPanel config={selectedAttribute.clamp_config} keys={selectedAttribute.keys || []} onChange={(config) => updateMutation.mutate({ id: selectedAttribute.id, data: { clamp_config: config } })} />}</DialogContent></Dialog>
      <Dialog open={showRecoveryPanel} onOpenChange={(open) => { setShowRecoveryPanel(open); if (!open) setSelectedAttribute(null); }}><DialogContent className="bg-[#15171C] border-[#2A2E37] text-white max-w-xl"><DialogHeader><DialogTitle>恢复行为</DialogTitle></DialogHeader>{selectedAttribute && <RecoveryConfigPanel config={selectedAttribute.recovery_config} keys={selectedAttribute.keys || []} onChange={(config) => updateMutation.mutate({ id: selectedAttribute.id, data: { recovery_config: config } })} />}</DialogContent></Dialog>
    </>
  );
}