import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit3, Trash2, X, Save, Layers } from "lucide-react";

export default function AttributeEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

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
      final_calculation_data_graph_id: "default_attribute_calc"
    });
  };

  const handleEdit = (attr) => {
    setEditingId(attr.id);
    setCreatingNew(false);
    setEditData({ ...attr });
  };

  const handleSave = () => {
    if (!editData.attribute_id || !editData.name || !editData.final_calculation_data_graph_id) {
      alert('请填写必填项：属性ID、名称和Data Graph ID');
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
    if (window.confirm('确定删除此属性吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const renderEditRow = () => {
    return (
      <tr className="border-b border-[#3d3d3d] bg-[#252526]">
        <td className="p-2">
          <Input
            value={editData.attribute_id}
            onChange={(e) => setEditData({ ...editData, attribute_id: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white font-mono"
            placeholder="attack_power"
          />
        </td>
        <td className="p-2">
          <Input
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="攻击力"
          />
        </td>
        <td className="p-2">
          <Input
            type="number"
            step="0.1"
            value={editData.default_base_value}
            onChange={(e) => setEditData({ ...editData, default_base_value: parseFloat(e.target.value) || 0 })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-20"
          />
        </td>
        <td className="p-2">
          <Input
            value={editData.final_calculation_data_graph_id}
            onChange={(e) => setEditData({ ...editData, final_calculation_data_graph_id: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white font-mono"
            placeholder="data_graph_id"
          />
        </td>
        <td className="p-2">
          <Textarea
            value={editData.description || ""}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="h-16 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white resize-none"
            placeholder="属性描述..."
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

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建属性
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#2d2d2d] border-b border-[#3d3d3d]">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-300 w-40">属性ID</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">名称</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-24">默认基础值</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-48">Data Graph ID</th>
              <th className="text-left p-2 font-semibold text-gray-300">描述</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && renderEditRow()}
            
            {filteredAttributes.map((attr) => {
              const isEditing = editingId === attr.id;
              
              if (isEditing && editData) {
                return <React.Fragment key={attr.id}>{renderEditRow()}</React.Fragment>;
              }
              
              return (
                <tr key={attr.id} className="border-b border-[#3d3d3d] hover:bg-[#252526]">
                  <td className="p-2 text-gray-300 font-mono">{attr.attribute_id}</td>
                  <td className="p-2 text-gray-300">{attr.name}</td>
                  <td className="p-2 text-gray-300">{attr.default_base_value}</td>
                  <td className="p-2 text-gray-400 font-mono text-[10px]">{attr.final_calculation_data_graph_id}</td>
                  <td className="p-2 text-gray-500 text-[10px]">{attr.description || "-"}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(attr)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(attr.id)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredAttributes.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无属性定义</div>
          </div>
        )}
      </div>
    </div>
  );
}