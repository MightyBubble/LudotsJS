import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit3, Trash2, X, Save, Zap } from "lucide-react";

// 标签输入组件
function TagInput({ value, onChange, onKeyDown }) {
  return (
    <Input
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder="标签路径"
      className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-xs text-white"
      list="tags-datalist"
    />
  );
}

// 标签列表显示
function TagList({ tags, onRemove, canEdit }) {
  if (!tags || tags.length === 0) return <span className="text-gray-600 text-xs">-</span>;
  
  return (
    <div className="space-y-0.5">
      {tags.map((tag, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <span className="text-xs text-gray-300 font-mono">{tag}</span>
          {canEdit && (
            <button onClick={() => onRemove(idx)} className="text-gray-500 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function InteractionEffectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);
  
  const [tempInputs, setTempInputs] = useState({
    interactor_any: "", interactor_all: "", interactor_not: "",
    target_any: "", target_all: "", target_not: "",
    effect_id: ""
  });

  const queryClient = useQueryClient();

  const { data: effects = [] } = useQuery({
    queryKey: ['interactionEffects'],
    queryFn: () => base44.entities.InteractionEffect.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InteractionEffect.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactionEffects'] });
      setCreatingNew(false);
      setEditData(null);
      setTempInputs({ interactor_any: "", interactor_all: "", interactor_not: "", target_any: "", target_all: "", target_not: "", effect_id: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InteractionEffect.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactionEffects'] });
      setEditingId(null);
      setEditData(null);
      setTempInputs({ interactor_any: "", interactor_all: "", interactor_not: "", target_any: "", target_all: "", target_not: "", effect_id: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InteractionEffect.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactionEffects'] });
    },
  });

  const filteredEffects = useMemo(() => {
    if (!searchQuery) return effects;
    return effects.filter(effect => 
      effect.effect_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (effect.description && effect.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [effects, searchQuery]);

  const handleCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      effect_name: "",
      description: "",
      triggering_effect_tag_path: "",
      interactor_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      target_object_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      resulting_effect_ids: [],
      priority: 0,
      is_active: true
    });
  };

  const handleEdit = (effect) => {
    setEditingId(effect.id);
    setCreatingNew(false);
    setEditData({ ...effect });
  };

  const handleSave = () => {
    if (!editData.effect_name || !editData.triggering_effect_tag_path) {
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
    setTempInputs({ interactor_any: "", interactor_all: "", interactor_not: "", target_any: "", target_all: "", target_not: "", effect_id: "" });
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除？')) {
      deleteMutation.mutate(id);
    }
  };

  const addTag = (type, value) => {
    if (!value.trim() || !editData) return;
    
    const updated = { ...editData };
    if (type.startsWith('interactor_')) {
      const condition = type.replace('interactor_', '');
      if (condition === 'any') {
        updated.interactor_conditions.has_any_tags = [...(updated.interactor_conditions.has_any_tags || []), value.trim()];
      } else if (condition === 'all') {
        updated.interactor_conditions.has_all_tags = [...(updated.interactor_conditions.has_all_tags || []), value.trim()];
      } else if (condition === 'not') {
        updated.interactor_conditions.not_has_tags = [...(updated.interactor_conditions.not_has_tags || []), value.trim()];
      }
    } else if (type.startsWith('target_')) {
      const condition = type.replace('target_', '');
      if (condition === 'any') {
        updated.target_object_conditions.has_any_tags = [...(updated.target_object_conditions.has_any_tags || []), value.trim()];
      } else if (condition === 'all') {
        updated.target_object_conditions.has_all_tags = [...(updated.target_object_conditions.has_all_tags || []), value.trim()];
      } else if (condition === 'not') {
        updated.target_object_conditions.not_has_tags = [...(updated.target_object_conditions.not_has_tags || []), value.trim()];
      }
    }
    
    setEditData(updated);
    setTempInputs({ ...tempInputs, [type]: "" });
  };

  const removeTag = (section, type, index) => {
    if (!editData) return;
    
    const updated = { ...editData };
    if (section === 'interactor') {
      if (type === 'any') {
        updated.interactor_conditions.has_any_tags = updated.interactor_conditions.has_any_tags.filter((_, i) => i !== index);
      } else if (type === 'all') {
        updated.interactor_conditions.has_all_tags = updated.interactor_conditions.has_all_tags.filter((_, i) => i !== index);
      } else if (type === 'not') {
        updated.interactor_conditions.not_has_tags = updated.interactor_conditions.not_has_tags.filter((_, i) => i !== index);
      }
    } else if (section === 'target') {
      if (type === 'any') {
        updated.target_object_conditions.has_any_tags = updated.target_object_conditions.has_any_tags.filter((_, i) => i !== index);
      } else if (type === 'all') {
        updated.target_object_conditions.has_all_tags = updated.target_object_conditions.has_all_tags.filter((_, i) => i !== index);
      } else if (type === 'not') {
        updated.target_object_conditions.not_has_tags = updated.target_object_conditions.not_has_tags.filter((_, i) => i !== index);
      }
    }
    
    setEditData(updated);
  };

  const addEffectId = () => {
    if (!tempInputs.effect_id.trim() || !editData) return;
    setEditData({
      ...editData,
      resulting_effect_ids: [...(editData.resulting_effect_ids || []), tempInputs.effect_id.trim()]
    });
    setTempInputs({ ...tempInputs, effect_id: "" });
  };

  const removeEffectId = (index) => {
    if (!editData) return;
    setEditData({
      ...editData,
      resulting_effect_ids: editData.resulting_effect_ids.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Zap className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">效果编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredEffects.length} 个</span>
        
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
              <th className="text-left p-2 font-semibold text-gray-300 w-32">效果名称</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-40">触发效果ID</th>
              <th className="text-left p-2 font-semibold text-gray-300">发起者 Has Any</th>
              <th className="text-left p-2 font-semibold text-gray-300">发起者 Has All</th>
              <th className="text-left p-2 font-semibold text-gray-300">发起者 Not Has</th>
              <th className="text-left p-2 font-semibold text-gray-300">目标 Has Any</th>
              <th className="text-left p-2 font-semibold text-gray-300">目标 Has All</th>
              <th className="text-left p-2 font-semibold text-gray-300">目标 Not Has</th>
              <th className="text-left p-2 font-semibold text-gray-300">后续效果</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-12">优先级</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-12">状态</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && (
              <tr className="border-b border-[#3d3d3d] bg-[#252526]">
                <td className="p-2">
                  <Input value={editData.effect_name} onChange={(e) => setEditData({ ...editData, effect_name: e.target.value })} className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white" />
                </td>
                <td className="p-2">
                  <Input value={editData.triggering_effect_tag_path} onChange={(e) => setEditData({ ...editData, triggering_effect_tag_path: e.target.value })} className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white" list="tags-datalist" />
                </td>
                <td className="p-2">
                  <TagList tags={editData.interactor_conditions?.has_any_tags} onRemove={(i) => removeTag('interactor', 'any', i)} canEdit />
                  <TagInput value={tempInputs.interactor_any} onChange={(e) => setTempInputs({ ...tempInputs, interactor_any: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('interactor_any', tempInputs.interactor_any)} />
                </td>
                <td className="p-2">
                  <TagList tags={editData.interactor_conditions?.has_all_tags} onRemove={(i) => removeTag('interactor', 'all', i)} canEdit />
                  <TagInput value={tempInputs.interactor_all} onChange={(e) => setTempInputs({ ...tempInputs, interactor_all: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('interactor_all', tempInputs.interactor_all)} />
                </td>
                <td className="p-2">
                  <TagList tags={editData.interactor_conditions?.not_has_tags} onRemove={(i) => removeTag('interactor', 'not', i)} canEdit />
                  <TagInput value={tempInputs.interactor_not} onChange={(e) => setTempInputs({ ...tempInputs, interactor_not: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('interactor_not', tempInputs.interactor_not)} />
                </td>
                <td className="p-2">
                  <TagList tags={editData.target_object_conditions?.has_any_tags} onRemove={(i) => removeTag('target', 'any', i)} canEdit />
                  <TagInput value={tempInputs.target_any} onChange={(e) => setTempInputs({ ...tempInputs, target_any: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('target_any', tempInputs.target_any)} />
                </td>
                <td className="p-2">
                  <TagList tags={editData.target_object_conditions?.has_all_tags} onRemove={(i) => removeTag('target', 'all', i)} canEdit />
                  <TagInput value={tempInputs.target_all} onChange={(e) => setTempInputs({ ...tempInputs, target_all: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('target_all', tempInputs.target_all)} />
                </td>
                <td className="p-2">
                  <TagList tags={editData.target_object_conditions?.not_has_tags} onRemove={(i) => removeTag('target', 'not', i)} canEdit />
                  <TagInput value={tempInputs.target_not} onChange={(e) => setTempInputs({ ...tempInputs, target_not: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('target_not', tempInputs.target_not)} />
                </td>
                <td className="p-2">
                  <TagList tags={editData.resulting_effect_ids} onRemove={removeEffectId} canEdit />
                  <Input value={tempInputs.effect_id} onChange={(e) => setTempInputs({ ...tempInputs, effect_id: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addEffectId()} placeholder="效果ID" className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-xs text-white" />
                </td>
                <td className="p-2">
                  <Input type="number" value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 0 })} className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-16" />
                </td>
                <td className="p-2">
                  <input type="checkbox" checked={editData.is_active} onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })} className="w-3 h-3" />
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
            )}
            
            {filteredEffects.map((effect) => {
              const isEditing = editingId === effect.id;
              
              if (isEditing && editData) {
                return (
                  <tr key={effect.id} className="border-b border-[#3d3d3d] bg-[#252526]">
                    <td className="p-2">
                      <Input value={editData.effect_name} onChange={(e) => setEditData({ ...editData, effect_name: e.target.value })} className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white" />
                    </td>
                    <td className="p-2">
                      <Input value={editData.triggering_effect_tag_path} onChange={(e) => setEditData({ ...editData, triggering_effect_tag_path: e.target.value })} className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white" list="tags-datalist" />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.interactor_conditions?.has_any_tags} onRemove={(i) => removeTag('interactor', 'any', i)} canEdit />
                      <TagInput value={tempInputs.interactor_any} onChange={(e) => setTempInputs({ ...tempInputs, interactor_any: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('interactor_any', tempInputs.interactor_any)} />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.interactor_conditions?.has_all_tags} onRemove={(i) => removeTag('interactor', 'all', i)} canEdit />
                      <TagInput value={tempInputs.interactor_all} onChange={(e) => setTempInputs({ ...tempInputs, interactor_all: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('interactor_all', tempInputs.interactor_all)} />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.interactor_conditions?.not_has_tags} onRemove={(i) => removeTag('interactor', 'not', i)} canEdit />
                      <TagInput value={tempInputs.interactor_not} onChange={(e) => setTempInputs({ ...tempInputs, interactor_not: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('interactor_not', tempInputs.interactor_not)} />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.target_object_conditions?.has_any_tags} onRemove={(i) => removeTag('target', 'any', i)} canEdit />
                      <TagInput value={tempInputs.target_any} onChange={(e) => setTempInputs({ ...tempInputs, target_any: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('target_any', tempInputs.target_any)} />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.target_object_conditions?.has_all_tags} onRemove={(i) => removeTag('target', 'all', i)} canEdit />
                      <TagInput value={tempInputs.target_all} onChange={(e) => setTempInputs({ ...tempInputs, target_all: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('target_all', tempInputs.target_all)} />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.target_object_conditions?.not_has_tags} onRemove={(i) => removeTag('target', 'not', i)} canEdit />
                      <TagInput value={tempInputs.target_not} onChange={(e) => setTempInputs({ ...tempInputs, target_not: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addTag('target_not', tempInputs.target_not)} />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.resulting_effect_ids} onRemove={removeEffectId} canEdit />
                      <Input value={tempInputs.effect_id} onChange={(e) => setTempInputs({ ...tempInputs, effect_id: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addEffectId()} placeholder="效果ID" className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-xs text-white" />
                    </td>
                    <td className="p-2">
                      <Input type="number" value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 0 })} className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white w-16" />
                    </td>
                    <td className="p-2">
                      <input type="checkbox" checked={editData.is_active} onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })} className="w-3 h-3" />
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
              }
              
              return (
                <tr key={effect.id} className="border-b border-[#3d3d3d] hover:bg-[#252526]">
                  <td className="p-2 text-gray-300">{effect.effect_name}</td>
                  <td className="p-2 text-gray-300 font-mono">{effect.triggering_effect_tag_path}</td>
                  <td className="p-2"><TagList tags={effect.interactor_conditions?.has_any_tags} /></td>
                  <td className="p-2"><TagList tags={effect.interactor_conditions?.has_all_tags} /></td>
                  <td className="p-2"><TagList tags={effect.interactor_conditions?.not_has_tags} /></td>
                  <td className="p-2"><TagList tags={effect.target_object_conditions?.has_any_tags} /></td>
                  <td className="p-2"><TagList tags={effect.target_object_conditions?.has_all_tags} /></td>
                  <td className="p-2"><TagList tags={effect.target_object_conditions?.not_has_tags} /></td>
                  <td className="p-2"><TagList tags={effect.resulting_effect_ids} /></td>
                  <td className="p-2 text-gray-300">{effect.priority}</td>
                  <td className="p-2">
                    {effect.is_active ? <span className="text-gray-300">✓</span> : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(effect)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(effect.id)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]">
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
        
        {filteredEffects.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无效果映射</div>
          </div>
        )}
      </div>
    </div>
  );
}