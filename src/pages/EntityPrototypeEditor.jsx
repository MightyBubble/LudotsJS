import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Box, Edit3, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EntityPrototypeEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: structures = [] } = useQuery({
    queryKey: ['structureDefinitions'],
    queryFn: () => base44.entities.StructureDefinition.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntityPrototype.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityPrototype.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntityPrototype.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] });
    },
  });

  const filteredPrototypes = useMemo(() => {
    if (!searchQuery) return prototypes;
    return prototypes.filter(p => 
      p.prototype_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [prototypes, searchQuery]);

  const handleCreate = () => {
    const newPrototype = {
      prototype_id: "new_prototype",
      name: "新原型",
      description: "",
      referenced_attributes: [],
      structure_bindings: []
    };
    createMutation.mutate(newPrototype);
  };

  const handleEdit = (prototype) => {
    setEditingRow(prototype.id);
    setEditData({ 
      ...prototype, 
      referenced_attributes: prototype.referenced_attributes || [],
      structure_bindings: prototype.structure_bindings || []
    });
  };

  const handleSave = () => {
    if (!editData.prototype_id || !editData.name) {
      alert('请填写必填项');
      return;
    }
    
    const dataToSave = {
      prototype_id: editData.prototype_id,
      name: editData.name,
      description: editData.description || "",
      referenced_attributes: editData.referenced_attributes || [],
      structure_bindings: editData.structure_bindings || []
    };
    
    updateMutation.mutate({ id: editData.id, data: dataToSave });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此原型吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddAttribute = () => {
    if (!editData.referenced_attributes) {
      setEditData({ ...editData, referenced_attributes: [] });
    }
    const availableAttrs = attributes.filter(a => !editData.referenced_attributes.includes(a.attribute_id));
    if (availableAttrs.length > 0) {
      setEditData({
        ...editData,
        referenced_attributes: [...editData.referenced_attributes, availableAttrs[0].attribute_id]
      });
    }
  };

  const handleUpdateAttribute = (index, attrId) => {
    const attrs = [...editData.referenced_attributes];
    attrs[index] = attrId;
    setEditData({ ...editData, referenced_attributes: attrs });
  };

  const handleRemoveAttribute = (index) => {
    setEditData({
      ...editData,
      referenced_attributes: editData.referenced_attributes.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      <div className="h-10 bg-[#141414] border-b border-[#262626] flex items-center px-4 gap-3">
        <Box className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">实体原型编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredPrototypes.length} 个</span>
        
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
              <th className="text-left p-2 font-medium text-white/70 w-40">原型ID</th>
              <th className="text-left p-2 font-medium text-white/70 w-40">名称</th>
              <th className="text-left p-2 font-medium text-white/70">描述</th>
              <th className="text-left p-2 font-medium text-white/70">引用的属性</th>
              <th className="text-left p-2 font-medium text-white/70">结构绑定</th>
              <th className="text-right p-2 font-medium text-white/70 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredPrototypes.map((proto) => {
              const isEditing = editingRow === proto.id;
              const currentData = isEditing ? editData : proto;
              
              return (
                <tr key={proto.id} className="border-b border-[#262626] hover:bg-[#141414]">
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.prototype_id}
                        onChange={(e) => setEditData({ ...editData, prototype_id: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90 font-mono">{proto.prototype_id}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90">{proto.name}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.description || ""}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/70">{proto.description || "-"}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        {(editData.referenced_attributes || []).map((attrId, idx) => {
                          const attr = attributes.find(a => a.attribute_id === attrId);
                          return (
                            <div key={idx} className="flex gap-1 items-center">
                              <Select
                                value={attrId}
                                onValueChange={(val) => handleUpdateAttribute(idx, val)}
                              >
                                <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141414] border-[#262626]">
                                  {attributes.map(a => (
                                    <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                                      {a.name} ({a.attribute_id})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => handleRemoveAttribute(idx)}
                                className="text-white/30 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                        <Button
                          size="sm"
                          onClick={handleAddAttribute}
                          className="h-5 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(proto.referenced_attributes || []).map(attrId => {
                          const attr = attributes.find(a => a.attribute_id === attrId);
                          return (
                            <span key={attrId} className={`text-[10px] px-2 py-0.5 rounded ${attr ? 'bg-blue-900/50 text-blue-300' : 'bg-red-900/50 text-red-300'}`}>
                              {attr ? attr.name : `❌ ${attrId}`}
                            </span>
                          );
                        })}
                        {(proto.referenced_attributes || []).length === 0 && (
                          <span className="text-gray-600 text-xs">无引用</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1 min-w-[200px]">
                        {(editData.structure_bindings || []).map((binding, idx) => {
                          const structure = structures.find(s => s.structure_id === binding.structure_id);
                          const nodes = structure?.nodes || [];
                          return (
                            <div key={idx} className="flex gap-1 items-center bg-[#262626]/30 p-1 rounded">
                              <Select
                                value={binding.structure_id}
                                onValueChange={(v) => {
                                  const newBindings = [...editData.structure_bindings];
                                  newBindings[idx] = { ...binding, structure_id: v, node_id: "" };
                                  setEditData({ ...editData, structure_bindings: newBindings });
                                }}
                              >
                                <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-24">
                                  <SelectValue placeholder="结构" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141414] border-[#262626]">
                                  {structures.map(s => (
                                    <SelectItem key={s.id} value={s.structure_id} className="text-white text-xs">{s.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={binding.node_id}
                                onValueChange={(v) => {
                                  const newBindings = [...editData.structure_bindings];
                                  newBindings[idx] = { ...binding, node_id: v };
                                  setEditData({ ...editData, structure_bindings: newBindings });
                                }}
                                disabled={!binding.structure_id}
                              >
                                <SelectTrigger className="h-5 bg-[#0a0a0a] border-[#262626] text-white text-xs w-24">
                                  <SelectValue placeholder="节点" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141414] border-[#262626]">
                                  {nodes.map(n => (
                                    <SelectItem key={n.node_id} value={n.node_id} className="text-white text-xs">{n.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                onClick={() => {
                                  const newBindings = [...editData.structure_bindings];
                                  newBindings.splice(idx, 1);
                                  setEditData({ ...editData, structure_bindings: newBindings });
                                }}
                                className="text-white/30 hover:text-red-400"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                        <Button
                          size="sm"
                          onClick={() => setEditData({
                            ...editData,
                            structure_bindings: [...(editData.structure_bindings || []), { structure_id: "", node_id: "" }]
                          })}
                          className="h-5 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs w-full"
                        >
                          <Plus className="w-3 h-3 mr-1" /> 绑定结构
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(proto.structure_bindings || []).map((b, i) => {
                          const structName = structures.find(s => s.structure_id === b.structure_id)?.name || b.structure_id;
                          return (
                            <div key={i} className="text-[10px] bg-[#262626] px-2 py-0.5 rounded text-gray-300 flex items-center gap-1">
                              <span className="text-blue-300">{structName}</span>
                              <span className="text-gray-500">→</span>
                              <span>{b.node_id}</span>
                            </div>
                          );
                        })}
                        {(proto.structure_bindings || []).length === 0 && (
                          <span className="text-gray-600 text-xs">无绑定</span>
                        )}
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
                          onClick={() => handleEdit(proto)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(proto.id)}
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
        
        {filteredPrototypes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无实体原型</p>
          </div>
        )}
      </div>
    </div>
  );
}