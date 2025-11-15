import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Link as LinkIcon, Edit3, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EntityRelationEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntityRelation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityRelations'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityRelation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityRelations'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntityRelation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityRelations'] });
    },
  });

  const filteredRelations = useMemo(() => {
    if (!searchQuery) return relations;
    return relations.filter(rel => 
      rel.relation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rel.name && rel.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [relations, searchQuery]);

  const handleCreate = () => {
    const newRelation = {
      relation_id: "new_relation",
      name: "新关系",
      description: "",
      source_prototype_id: "",
      target_prototype_id: "",
      relation_attributes: [],
      allowed_tags: []
    };
    createMutation.mutate(newRelation);
  };

  const handleEdit = (relation) => {
    setEditingRow(relation.id);
    setEditData({ 
      ...relation, 
      relation_attributes: relation.relation_attributes || [],
      allowed_tags: relation.allowed_tags || []
    });
  };

  const handleSave = () => {
    if (!editData.relation_id || !editData.name) {
      alert('请填写必填项');
      return;
    }
    
    const dataToSave = {
      relation_id: editData.relation_id,
      name: editData.name,
      description: editData.description || "",
      source_prototype_id: editData.source_prototype_id || "",
      target_prototype_id: editData.target_prototype_id || "",
      relation_attributes: editData.relation_attributes || [],
      allowed_tags: editData.allowed_tags || []
    };
    
    updateMutation.mutate({ id: editData.id, data: dataToSave });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此关系吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddAttribute = () => {
    setEditData({
      ...editData,
      relation_attributes: [...editData.relation_attributes, { name: "new_attr", type: "number", default_value: 0 }]
    });
  };

  const handleUpdateAttribute = (index, field, value) => {
    const attrs = [...editData.relation_attributes];
    attrs[index] = { ...attrs[index], [field]: value };
    setEditData({ ...editData, relation_attributes: attrs });
  };

  const handleRemoveAttribute = (index) => {
    setEditData({
      ...editData,
      relation_attributes: editData.relation_attributes.filter((_, i) => i !== index)
    });
  };

  const handleAddTag = () => {
    if (tags.length > 0) {
      const availableTags = tags.filter(t => !editData.allowed_tags.includes(t.full_path));
      if (availableTags.length > 0) {
        setEditData({
          ...editData,
          allowed_tags: [...editData.allowed_tags, availableTags[0].full_path]
        });
      }
    }
  };

  const handleUpdateTag = (index, value) => {
    const newTags = [...editData.allowed_tags];
    newTags[index] = value;
    setEditData({ ...editData, allowed_tags: newTags });
  };

  const handleRemoveTag = (index) => {
    setEditData({
      ...editData,
      allowed_tags: editData.allowed_tags.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <LinkIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">实体关系编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredRelations.length} 个</span>
        
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
              <th className="text-left p-2 font-medium text-white/70 w-32">关系ID</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">名称</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">源实体</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">目标实体</th>
              <th className="text-left p-2 font-medium text-white/70">关系属性</th>
              <th className="text-left p-2 font-medium text-white/70">允许的标签</th>
              <th className="text-right p-2 font-medium text-white/70 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredRelations.map((rel) => {
              const isEditing = editingRow === rel.id;
              const currentData = isEditing ? editData : rel;
              
              return (
                <tr key={rel.id} className="border-b border-[#3d3d3d] hover:bg-[#2d2d2d]">
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.relation_id}
                        onChange={(e) => setEditData({ ...editData, relation_id: e.target.value })}
                        className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90 font-mono">{rel.relation_id}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                      />
                    ) : (
                      <span className="text-white/90">{rel.name}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Select
                        value={editData.source_prototype_id || "any"}
                        onValueChange={(val) => setEditData({ ...editData, source_prototype_id: val === "any" ? "" : val })}
                      >
                        <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                          <SelectItem value="any" className="text-white text-xs">任意类型</SelectItem>
                          {prototypes.map(p => (
                            <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-white/70 text-xs">
                        {rel.source_prototype_id ? prototypes.find(p => p.prototype_id === rel.source_prototype_id)?.name || rel.source_prototype_id : "任意"}
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Select
                        value={editData.target_prototype_id || "any"}
                        onValueChange={(val) => setEditData({ ...editData, target_prototype_id: val === "any" ? "" : val })}
                      >
                        <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                          <SelectItem value="any" className="text-white text-xs">任意类型</SelectItem>
                          {prototypes.map(p => (
                            <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-white/70 text-xs">
                        {rel.target_prototype_id ? prototypes.find(p => p.prototype_id === rel.target_prototype_id)?.name || rel.target_prototype_id : "任意"}
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        {editData.relation_attributes.map((attr, idx) => (
                          <div key={idx} className="flex gap-1 items-center">
                            <Input
                              value={attr.name}
                              onChange={(e) => handleUpdateAttribute(idx, 'name', e.target.value)}
                              placeholder="属性名"
                              className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white flex-1"
                            />
                            <Select
                              value={attr.type}
                              onValueChange={(val) => handleUpdateAttribute(idx, 'type', val)}
                            >
                              <SelectTrigger className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                                <SelectItem value="number" className="text-white text-xs">数字</SelectItem>
                                <SelectItem value="string" className="text-white text-xs">字符串</SelectItem>
                                <SelectItem value="boolean" className="text-white text-xs">布尔</SelectItem>
                              </SelectContent>
                            </Select>
                            <button
                              onClick={() => handleRemoveAttribute(idx)}
                              className="text-white/30 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          onClick={handleAddAttribute}
                          className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(rel.relation_attributes || []).map((attr, idx) => (
                          <div key={idx} className="text-white/70 text-xs">
                            {attr.name} <span className="text-white/40">({attr.type})</span>
                          </div>
                        ))}
                        {(rel.relation_attributes || []).length === 0 && <span className="text-gray-600 text-xs">无</span>}
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        {editData.allowed_tags.map((tagPath, idx) => (
                          <div key={idx} className="flex gap-1 items-center">
                            <Select
                              value={tagPath}
                              onValueChange={(val) => handleUpdateTag(idx, val)}
                            >
                              <SelectTrigger className="h-5 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d] max-h-48">
                                {tags.map(t => (
                                  <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                                    {t.full_path}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <button
                              onClick={() => handleRemoveTag(idx)}
                              className="text-white/30 hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          onClick={handleAddTag}
                          className="h-5 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(rel.allowed_tags || []).map((tagPath, idx) => (
                          <div key={idx} className="text-white/70 text-xs">
                            {tagPath.split('.').pop()}
                          </div>
                        ))}
                        {(rel.allowed_tags || []).length === 0 && <span className="text-gray-600 text-xs">无</span>}
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
                          className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb]"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCancel}
                          className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d]"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleEdit(rel)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rel.id)}
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
        
        {filteredRelations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无实体关系</p>
          </div>
        )}
      </div>
    </div>
  );
}