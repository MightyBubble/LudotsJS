import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Trash2, X, Save, TrendingUp } from "lucide-react";

export default function AttributeModifiersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: modifiers = [] } = useQuery({
    queryKey: ['attributeModifiers'],
    queryFn: () => base44.entities.AttributeModifier.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AttributeModifier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeModifiers'] });
      setCreatingNew(false);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AttributeModifier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeModifiers'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AttributeModifier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attributeModifiers'] });
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
      tag_path: "",
      tag_count_per_step: 1,
      affected_attribute_id: "",
      operation_type: "add",
      base_value: 0,
      curve_type: "linear",
      curve_config: {},
      max_stacks: null,
      is_active: true,
      priority: 0
    });
  };

  const handleEdit = (modifier) => {
    setEditingId(modifier.id);
    setCreatingNew(false);
    setEditData({
      ...modifier,
      curve_config: modifier.curve_config || {}
    });
  };

  const handleSave = () => {
    if (!editData.modifier_name || !editData.tag_path || !editData.affected_attribute_id) {
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

  const updateCurveConfig = (key, value) => {
    setEditData({
      ...editData,
      curve_config: {
        ...editData.curve_config,
        [key]: value
      }
    });
  };

  const renderCurveConfig = () => {
    if (!editData) return null;

    if (editData.curve_type === 'exponential') {
      return (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">指数底数</label>
          <Input
            type="number"
            step="0.1"
            value={editData.curve_config?.exponential_base || 1.5}
            onChange={(e) => updateCurveConfig('exponential_base', parseFloat(e.target.value))}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="例如：1.5"
          />
        </div>
      );
    }

    if (editData.curve_type === 'logarithmic') {
      return (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">对数底数</label>
          <Input
            type="number"
            step="1"
            value={editData.curve_config?.logarithmic_base || 10}
            onChange={(e) => updateCurveConfig('logarithmic_base', parseFloat(e.target.value))}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="例如：10"
          />
        </div>
      );
    }

    if (editData.curve_type === 'custom') {
      const points = editData.curve_config?.custom_points || [];
      return (
        <div>
          <label className="text-xs text-gray-400 mb-1 block">自定义曲线点</label>
          <div className="space-y-1 mb-2">
            {points.map((point, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  type="number"
                  value={point.tag_count}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[idx].tag_count = parseInt(e.target.value);
                    updateCurveConfig('custom_points', newPoints);
                  }}
                  className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-20"
                  placeholder="标签数"
                />
                <span className="text-gray-500">→</span>
                <Input
                  type="number"
                  step="0.1"
                  value={point.value}
                  onChange={(e) => {
                    const newPoints = [...points];
                    newPoints[idx].value = parseFloat(e.target.value);
                    updateCurveConfig('custom_points', newPoints);
                  }}
                  className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white flex-1"
                  placeholder="属性值"
                />
                <button
                  onClick={() => {
                    const newPoints = points.filter((_, i) => i !== idx);
                    updateCurveConfig('custom_points', newPoints);
                  }}
                  className="text-gray-500 hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => {
              updateCurveConfig('custom_points', [...points, { tag_count: 0, value: 0 }]);
            }}
            className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            添加点
          </Button>
        </div>
      );
    }

    return null;
  };

  const renderEditRow = (mod, isNew) => {
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
            value={editData.tag_path}
            onChange={(e) => setEditData({ ...editData, tag_path: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            list="tags-datalist"
            placeholder="标签路径"
          />
        </td>
        <td className="p-2">
          <Input
            type="number"
            value={editData.tag_count_per_step}
            onChange={(e) => setEditData({ ...editData, tag_count_per_step: parseInt(e.target.value) || 1 })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-16"
          />
        </td>
        <td className="p-2">
          <Input
            value={editData.affected_attribute_id}
            onChange={(e) => setEditData({ ...editData, affected_attribute_id: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="属性ID"
          />
        </td>
        <td className="p-2">
          <Select
            value={editData.operation_type}
            onValueChange={(value) => setEditData({ ...editData, operation_type: value })}
          >
            <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="add" className="text-white hover:bg-[#3d3d3d] text-xs">Add</SelectItem>
              <SelectItem value="multiply" className="text-white hover:bg-[#3d3d3d] text-xs">Multiply</SelectItem>
              <SelectItem value="flat_add" className="text-white hover:bg-[#3d3d3d] text-xs">Flat Add</SelectItem>
              <SelectItem value="override" className="text-white hover:bg-[#3d3d3d] text-xs">Override</SelectItem>
            </SelectContent>
          </Select>
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
            value={editData.curve_type}
            onValueChange={(value) => setEditData({ ...editData, curve_type: value })}
          >
            <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="linear" className="text-white hover:bg-[#3d3d3d] text-xs">Linear</SelectItem>
              <SelectItem value="exponential" className="text-white hover:bg-[#3d3d3d] text-xs">Exponential</SelectItem>
              <SelectItem value="logarithmic" className="text-white hover:bg-[#3d3d3d] text-xs">Logarithmic</SelectItem>
              <SelectItem value="custom" className="text-white hover:bg-[#3d3d3d] text-xs">Custom</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <Input
            type="number"
            value={editData.max_stacks || ""}
            onChange={(e) => setEditData({ ...editData, max_stacks: e.target.value ? parseInt(e.target.value) : null })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-16"
            placeholder="无限"
          />
        </td>
        <td className="p-2">
          <Input
            type="number"
            value={editData.priority}
            onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 0 })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-16"
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
        <TrendingUp className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">属性修饰器编辑器</span>
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

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#2d2d2d] border-b border-[#3d3d3d]">
              <tr>
                <th className="text-left p-2 font-semibold text-gray-300 w-32">修饰器名称</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-40">监听标签路径</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-20">每N个</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-32">属性ID</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-24">操作方式</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-20">基础值</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-28">曲线类型</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-20">最大层数</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-16">优先级</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-12">状态</th>
                <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {creatingNew && editData && renderEditRow(null, true)}
              
              {filteredModifiers.map((mod) => {
                const isEditing = editingId === mod.id;
                
                if (isEditing && editData) {
                  return renderEditRow(mod, false);
                }
                
                return (
                  <tr key={mod.id} className="border-b border-[#3d3d3d] hover:bg-[#252526]">
                    <td className="p-2 text-gray-300">{mod.modifier_name}</td>
                    <td className="p-2 text-gray-300 font-mono">{mod.tag_path}</td>
                    <td className="p-2 text-gray-300">{mod.tag_count_per_step}</td>
                    <td className="p-2 text-gray-300 font-mono">{mod.affected_attribute_id}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#3d3d3d] text-gray-300">{mod.operation_type}</span>
                    </td>
                    <td className="p-2 text-gray-300">{mod.base_value}</td>
                    <td className="p-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#3d3d3d] text-gray-300">{mod.curve_type}</span>
                    </td>
                    <td className="p-2 text-gray-300">{mod.max_stacks || "∞"}</td>
                    <td className="p-2 text-gray-300">{mod.priority}</td>
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
          
          <datalist id="tags-datalist">
            {tags.map(t => <option key={t.id} value={t.full_path} />)}
          </datalist>
          
          {filteredModifiers.length === 0 && !creatingNew && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-sm">暂无修饰器</div>
            </div>
          )}
        </div>

        {/* 右侧详情面板 */}
        {(editingId || creatingNew) && editData && (
          <div className="w-80 bg-[#252526] border-l border-[#3d3d3d] p-4 overflow-auto">
            <h3 className="text-sm font-semibold text-white mb-3">曲线配置</h3>
            {renderCurveConfig()}
            
            <div className="mt-4">
              <label className="text-xs text-gray-400 mb-1 block">描述</label>
              <Input
                value={editData.description || ""}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="添加描述..."
                className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}