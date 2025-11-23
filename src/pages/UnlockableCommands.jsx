import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit3, Trash2, X, Save, KeyRound } from "lucide-react";

// 标签输入组件
function TagInput({ value, onChange, onAdd, onBlur, allTags }) {
  return (
    <div className="flex gap-1">
      <Input
        value={value}
        onChange={onChange}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); }}}
        onBlur={onBlur}
        placeholder="输入或选择标签"
        className="h-6 bg-[#141414] border-[#262626] text-xs text-white flex-1"
        list="tags-datalist"
      />
      <Button
        size="sm"
        onClick={onAdd}
        className="h-6 w-6 p-0 bg-[#f97316] hover:bg-[#ea580c]"
        type="button"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
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

export default function UnlockableCommandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);
  
  // 新增标签的临时输入
  const [tempInputs, setTempInputs] = useState({
    interactor_any: "", interactor_all: "", interactor_not: "",
    target_any: "", target_all: "", target_not: ""
  });

  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['unlockableCommands'],
    queryFn: () => base44.entities.UnlockableCommand.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UnlockableCommand.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlockableCommands'] });
      setCreatingNew(false);
      setEditData(null);
      setTempInputs({ interactor_any: "", interactor_all: "", interactor_not: "", target_any: "", target_all: "", target_not: "" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UnlockableCommand.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlockableCommands'] });
      setEditingId(null);
      setEditData(null);
      setTempInputs({ interactor_any: "", interactor_all: "", interactor_not: "", target_any: "", target_all: "", target_not: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UnlockableCommand.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlockableCommands'] });
    },
  });

  const filteredRules = useMemo(() => {
    if (!searchQuery) return rules;
    return rules.filter(rule => 
      rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rules, searchQuery]);

  const handleCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      rule_name: "",
      description: "",
      unlocked_command_tag_path: "",
      interactor_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      target_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      is_active: true
    });
  };

  const handleEdit = (rule) => {
    setEditingId(rule.id);
    setCreatingNew(false);
    setEditData({
      ...rule,
      interactor_conditions: rule.interactor_conditions || { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      target_conditions: rule.target_conditions || { has_any_tags: [], has_all_tags: [], not_has_tags: [] }
    });
  };

  const handleSave = () => {
    if (!editData.rule_name || !editData.unlocked_command_tag_path) {
      alert('请填写必填项：规则名称和解锁的指令标签');
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
    setTempInputs({ interactor_any: "", interactor_all: "", interactor_not: "", target_any: "", target_all: "", target_not: "" });
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此规则吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const addTag = (type, value) => {
    if (!value.trim() || !editData) return;
    
    const updated = { ...editData };
    
    if (!updated.interactor_conditions) {
      updated.interactor_conditions = { has_any_tags: [], has_all_tags: [], not_has_tags: [] };
    }
    if (!updated.target_conditions) {
      updated.target_conditions = { has_any_tags: [], has_all_tags: [], not_has_tags: [] };
    }
    
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
        updated.target_conditions.has_any_tags = [...(updated.target_conditions.has_any_tags || []), value.trim()];
      } else if (condition === 'all') {
        updated.target_conditions.has_all_tags = [...(updated.target_conditions.has_all_tags || []), value.trim()];
      } else if (condition === 'not') {
        updated.target_conditions.not_has_tags = [...(updated.target_conditions.not_has_tags || []), value.trim()];
      }
    }
    
    setEditData(updated);
    setTempInputs({ ...tempInputs, [type]: "" });
  };

  const removeTag = (section, type, index) => {
    if (!editData) return;
    
    const updated = { ...editData };
    
    if (!updated.interactor_conditions) {
      updated.interactor_conditions = { has_any_tags: [], has_all_tags: [], not_has_tags: [] };
    }
    if (!updated.target_conditions) {
      updated.target_conditions = { has_any_tags: [], has_all_tags: [], not_has_tags: [] };
    }
    
    if (section === 'interactor') {
      if (type === 'any') {
        updated.interactor_conditions.has_any_tags = (updated.interactor_conditions.has_any_tags || []).filter((_, i) => i !== index);
      } else if (type === 'all') {
        updated.interactor_conditions.has_all_tags = (updated.interactor_conditions.has_all_tags || []).filter((_, i) => i !== index);
      } else if (type === 'not') {
        updated.interactor_conditions.not_has_tags = (updated.interactor_conditions.not_has_tags || []).filter((_, i) => i !== index);
      }
    } else if (section === 'target') {
      if (type === 'any') {
        updated.target_conditions.has_any_tags = (updated.target_conditions.has_any_tags || []).filter((_, i) => i !== index);
      } else if (type === 'all') {
        updated.target_conditions.has_all_tags = (updated.target_conditions.has_all_tags || []).filter((_, i) => i !== index);
      } else if (type === 'not') {
        updated.target_conditions.not_has_tags = (updated.target_conditions.not_has_tags || []).filter((_, i) => i !== index);
      }
    }
    
    setEditData(updated);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      <div className="h-10 bg-[#141414] border-b border-[#262626] flex items-center px-4 gap-3">
        <KeyRound className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">指令解锁编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredRules.length} 条</span>
        
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

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#262626] hover:bg-[#4d4d4d] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#141414] border-b border-[#262626]">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">规则名称</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-40">解锁指令</th>
              <th className="text-left p-2 font-semibold text-gray-300">交互者 Has Any</th>
              <th className="text-left p-2 font-semibold text-gray-300">交互者 Has All</th>
              <th className="text-left p-2 font-semibold text-gray-300">交互者 Not Has</th>
              <th className="text-left p-2 font-semibold text-gray-300">目标 Has Any</th>
              <th className="text-left p-2 font-semibold text-gray-300">目标 Has All</th>
              <th className="text-left p-2 font-semibold text-gray-300">目标 Not Has</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">状态</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && (
              <tr className="border-b border-[#262626] bg-[#252526]">
                <td className="p-2">
                  <Input
                    value={editData.rule_name}
                    onChange={(e) => setEditData({ ...editData, rule_name: e.target.value })}
                    className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                  />
                </td>
                <td className="p-2">
                  <Input
                    value={editData.unlocked_command_tag_path}
                    onChange={(e) => setEditData({ ...editData, unlocked_command_tag_path: e.target.value })}
                    className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                    list="tags-datalist"
                  />
                </td>
                <td className="p-2">
                  <TagList tags={editData.interactor_conditions?.has_any_tags} onRemove={(i) => removeTag('interactor', 'any', i)} canEdit />
                  <TagInput 
                    value={tempInputs.interactor_any} 
                    onChange={(e) => setTempInputs({ ...tempInputs, interactor_any: e.target.value })} 
                    onAdd={() => addTag('interactor_any', tempInputs.interactor_any)}
                    onBlur={() => { if (tempInputs.interactor_any.trim()) addTag('interactor_any', tempInputs.interactor_any); }}
                    allTags={tags} 
                  />
                </td>
                <td className="p-2">
                  <TagList tags={editData.interactor_conditions?.has_all_tags} onRemove={(i) => removeTag('interactor', 'all', i)} canEdit />
                  <TagInput 
                    value={tempInputs.interactor_all} 
                    onChange={(e) => setTempInputs({ ...tempInputs, interactor_all: e.target.value })} 
                    onAdd={() => addTag('interactor_all', tempInputs.interactor_all)}
                    onBlur={() => { if (tempInputs.interactor_all.trim()) addTag('interactor_all', tempInputs.interactor_all); }}
                    allTags={tags} 
                  />
                </td>
                <td className="p-2">
                  <TagList tags={editData.interactor_conditions?.not_has_tags} onRemove={(i) => removeTag('interactor', 'not', i)} canEdit />
                  <TagInput 
                    value={tempInputs.interactor_not} 
                    onChange={(e) => setTempInputs({ ...tempInputs, interactor_not: e.target.value })} 
                    onAdd={() => addTag('interactor_not', tempInputs.interactor_not)}
                    onBlur={() => { if (tempInputs.interactor_not.trim()) addTag('interactor_not', tempInputs.interactor_not); }}
                    allTags={tags} 
                  />
                </td>
                <td className="p-2">
                  <TagList tags={editData.target_conditions?.has_any_tags} onRemove={(i) => removeTag('target', 'any', i)} canEdit />
                  <TagInput 
                    value={tempInputs.target_any} 
                    onChange={(e) => setTempInputs({ ...tempInputs, target_any: e.target.value })} 
                    onAdd={() => addTag('target_any', tempInputs.target_any)}
                    onBlur={() => { if (tempInputs.target_any.trim()) addTag('target_any', tempInputs.target_any); }}
                    allTags={tags} 
                  />
                </td>
                <td className="p-2">
                  <TagList tags={editData.target_conditions?.has_all_tags} onRemove={(i) => removeTag('target', 'all', i)} canEdit />
                  <TagInput 
                    value={tempInputs.target_all} 
                    onChange={(e) => setTempInputs({ ...tempInputs, target_all: e.target.value })} 
                    onAdd={() => addTag('target_all', tempInputs.target_all)}
                    onBlur={() => { if (tempInputs.target_all.trim()) addTag('target_all', tempInputs.target_all); }}
                    allTags={tags} 
                  />
                </td>
                <td className="p-2">
                  <TagList tags={editData.target_conditions?.not_has_tags} onRemove={(i) => removeTag('target', 'not', i)} canEdit />
                  <TagInput 
                    value={tempInputs.target_not} 
                    onChange={(e) => setTempInputs({ ...tempInputs, target_not: e.target.value })} 
                    onAdd={() => addTag('target_not', tempInputs.target_not)}
                    onBlur={() => { if (tempInputs.target_not.trim()) addTag('target_not', tempInputs.target_not); }}
                    allTags={tags} 
                  />
                </td>
                <td className="p-2">
                  <input type="checkbox" checked={editData.is_active} onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })} className="w-3 h-3" />
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    <Button size="sm" onClick={handleSave} className="h-6 px-2 bg-[#f97316] hover:bg-[#ea580c] text-xs">
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            
            {filteredRules.map((rule) => {
              const isEditing = editingId === rule.id;
              
              if (isEditing && editData) {
                return (
                  <tr key={rule.id} className="border-b border-[#262626] bg-[#252526]">
                    <td className="p-2">
                      <Input
                        value={editData.rule_name}
                        onChange={(e) => setEditData({ ...editData, rule_name: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        value={editData.unlocked_command_tag_path}
                        onChange={(e) => setEditData({ ...editData, unlocked_command_tag_path: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                        list="tags-datalist"
                      />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.interactor_conditions?.has_any_tags} onRemove={(i) => removeTag('interactor', 'any', i)} canEdit />
                      <TagInput 
                        value={tempInputs.interactor_any} 
                        onChange={(e) => setTempInputs({ ...tempInputs, interactor_any: e.target.value })} 
                        onAdd={() => addTag('interactor_any', tempInputs.interactor_any)}
                        onBlur={() => { if (tempInputs.interactor_any.trim()) addTag('interactor_any', tempInputs.interactor_any); }}
                        allTags={tags} 
                      />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.interactor_conditions?.has_all_tags} onRemove={(i) => removeTag('interactor', 'all', i)} canEdit />
                      <TagInput 
                        value={tempInputs.interactor_all} 
                        onChange={(e) => setTempInputs({ ...tempInputs, interactor_all: e.target.value })} 
                        onAdd={() => addTag('interactor_all', tempInputs.interactor_all)}
                        onBlur={() => { if (tempInputs.interactor_all.trim()) addTag('interactor_all', tempInputs.interactor_all); }}
                        allTags={tags} 
                      />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.interactor_conditions?.not_has_tags} onRemove={(i) => removeTag('interactor', 'not', i)} canEdit />
                      <TagInput 
                        value={tempInputs.interactor_not} 
                        onChange={(e) => setTempInputs({ ...tempInputs, interactor_not: e.target.value })} 
                        onAdd={() => addTag('interactor_not', tempInputs.interactor_not)}
                        onBlur={() => { if (tempInputs.interactor_not.trim()) addTag('interactor_not', tempInputs.interactor_not); }}
                        allTags={tags} 
                      />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.target_conditions?.has_any_tags} onRemove={(i) => removeTag('target', 'any', i)} canEdit />
                      <TagInput 
                        value={tempInputs.target_any} 
                        onChange={(e) => setTempInputs({ ...tempInputs, target_any: e.target.value })} 
                        onAdd={() => addTag('target_any', tempInputs.target_any)}
                        onBlur={() => { if (tempInputs.target_any.trim()) addTag('target_any', tempInputs.target_any); }}
                        allTags={tags} 
                      />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.target_conditions?.has_all_tags} onRemove={(i) => removeTag('target', 'all', i)} canEdit />
                      <TagInput 
                        value={tempInputs.target_all} 
                        onChange={(e) => setTempInputs({ ...tempInputs, target_all: e.target.value })} 
                        onAdd={() => addTag('target_all', tempInputs.target_all)}
                        onBlur={() => { if (tempInputs.target_all.trim()) addTag('target_all', tempInputs.target_all); }}
                        allTags={tags} 
                      />
                    </td>
                    <td className="p-2">
                      <TagList tags={editData.target_conditions?.not_has_tags} onRemove={(i) => removeTag('target', 'not', i)} canEdit />
                      <TagInput 
                        value={tempInputs.target_not} 
                        onChange={(e) => setTempInputs({ ...tempInputs, target_not: e.target.value })} 
                        onAdd={() => addTag('target_not', tempInputs.target_not)}
                        onBlur={() => { if (tempInputs.target_not.trim()) addTag('target_not', tempInputs.target_not); }}
                        allTags={tags} 
                      />
                    </td>
                    <td className="p-2">
                      <input type="checkbox" checked={editData.is_active} onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })} className="w-3 h-3" />
                    </td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button size="sm" onClick={handleSave} className="h-6 px-2 bg-[#f97316] hover:bg-[#ea580c] text-xs">
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              return (
                <tr key={rule.id} className="border-b border-[#262626] hover:bg-[#252526]">
                  <td className="p-2 text-gray-300">{rule.rule_name}</td>
                  <td className="p-2 text-gray-300 font-mono">{rule.unlocked_command_tag_path}</td>
                  <td className="p-2"><TagList tags={rule.interactor_conditions?.has_any_tags} /></td>
                  <td className="p-2"><TagList tags={rule.interactor_conditions?.has_all_tags} /></td>
                  <td className="p-2"><TagList tags={rule.interactor_conditions?.not_has_tags} /></td>
                  <td className="p-2"><TagList tags={rule.target_conditions?.has_any_tags} /></td>
                  <td className="p-2"><TagList tags={rule.target_conditions?.has_all_tags} /></td>
                  <td className="p-2"><TagList tags={rule.target_conditions?.not_has_tags} /></td>
                  <td className="p-2">
                    {rule.is_active ? (
                      <span className="text-gray-300">✓</span>
                    ) : (
                      <span className="text-gray-600">-</span>
                    )}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(rule)} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(rule.id)} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#5a1e1e]">
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
        
        {filteredRules.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无规则</div>
          </div>
        )}
      </div>
    </div>
  );
}