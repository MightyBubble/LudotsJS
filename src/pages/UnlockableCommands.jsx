import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit3, Trash2, X, Save, KeyRound } from "lucide-react";

// 标签条件编辑组件
function TagConditionEditor({ title, conditions, onChange, allTags }) {
  const safeConditions = conditions || { has_any_tags: [], has_all_tags: [], not_has_tags: [] };
  
  const [inputs, setInputs] = useState({
    has_any: "",
    has_all: "",
    not_has: ""
  });

  const addTag = (type, value) => {
    if (!value.trim()) return;
    
    const updated = { ...safeConditions };
    if (type === 'has_any') {
      updated.has_any_tags = [...(updated.has_any_tags || []), value.trim()];
    } else if (type === 'has_all') {
      updated.has_all_tags = [...(updated.has_all_tags || []), value.trim()];
    } else if (type === 'not_has') {
      updated.not_has_tags = [...(updated.not_has_tags || []), value.trim()];
    }
    
    onChange(updated);
    setInputs({ ...inputs, [type]: "" });
  };

  const removeTag = (type, index) => {
    const updated = { ...safeConditions };
    if (type === 'has_any') {
      updated.has_any_tags = (updated.has_any_tags || []).filter((_, i) => i !== index);
    } else if (type === 'has_all') {
      updated.has_all_tags = (updated.has_all_tags || []).filter((_, i) => i !== index);
    } else if (type === 'not_has') {
      updated.not_has_tags = (updated.not_has_tags || []).filter((_, i) => i !== index);
    }
    onChange(updated);
  };

  return (
    <div className="border border-[#3d3d3d] rounded p-3 bg-[#1e1e1e]">
      <h4 className="text-xs font-semibold text-gray-300 mb-2">{title}</h4>

      {/* Has Any */}
      <div className="mb-2">
        <label className="text-xs text-gray-500 mb-1 block">Has Any</label>
        <div className="space-y-1 mb-1">
          {(safeConditions.has_any_tags || []).map((tag, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#2d2d2d] px-2 py-0.5 rounded text-xs">
              <span className="text-gray-300 font-mono">{tag}</span>
              <button onClick={() => removeTag('has_any', idx)} className="text-gray-500 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={inputs.has_any}
            onChange={(e) => setInputs({ ...inputs, has_any: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addTag('has_any', inputs.has_any)}
            placeholder="标签路径"
            className="h-6 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-xs text-white"
            list="tags-datalist"
          />
          <Button size="sm" onClick={() => addTag('has_any', inputs.has_any)} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Has All */}
      <div className="mb-2">
        <label className="text-xs text-gray-500 mb-1 block">Has All</label>
        <div className="space-y-1 mb-1">
          {(safeConditions.has_all_tags || []).map((tag, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#2d2d2d] px-2 py-0.5 rounded text-xs">
              <span className="text-gray-300 font-mono">{tag}</span>
              <button onClick={() => removeTag('has_all', idx)} className="text-gray-500 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={inputs.has_all}
            onChange={(e) => setInputs({ ...inputs, has_all: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addTag('has_all', inputs.has_all)}
            placeholder="标签路径"
            className="h-6 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-xs text-white"
            list="tags-datalist"
          />
          <Button size="sm" onClick={() => addTag('has_all', inputs.has_all)} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Not Has */}
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Not Has</label>
        <div className="space-y-1 mb-1">
          {(safeConditions.not_has_tags || []).map((tag, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#2d2d2d] px-2 py-0.5 rounded text-xs">
              <span className="text-gray-300 font-mono">{tag}</span>
              <button onClick={() => removeTag('not_has', idx)} className="text-gray-500 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={inputs.not_has}
            onChange={(e) => setInputs({ ...inputs, not_has: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addTag('not_has', inputs.not_has)}
            placeholder="标签路径"
            className="h-6 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-xs text-white"
            list="tags-datalist"
          />
          <Button size="sm" onClick={() => addTag('not_has', inputs.not_has)} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <datalist id="tags-datalist">
        {allTags.map(t => <option key={t.id} value={t.full_path} />)}
      </datalist>
    </div>
  );
}

// 规则卡片组件
function RuleCard({ rule, onEdit, onDelete, onSave, tags, isEditing, onCancelEdit }) {
  const [editData, setEditData] = useState(rule);

  if (isEditing) {
    return (
      <div className="p-3 bg-[#252526] border border-[#0e639c] rounded">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">规则名称 *</label>
              <Input
                value={editData.rule_name}
                onChange={(e) => setEditData({ ...editData, rule_name: e.target.value })}
                className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-white text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">解锁的指令标签 *</label>
              <Input
                value={editData.unlocked_command_tag_path}
                onChange={(e) => setEditData({ ...editData, unlocked_command_tag_path: e.target.value })}
                className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-white text-sm"
                list="tags-datalist"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">描述</label>
            <Textarea
              value={editData.description || ""}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="bg-[#1e1e1e] border-[#3d3d3d] text-white text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <TagConditionEditor
              title="交互者条件"
              conditions={editData.interactor_conditions}
              onChange={(conditions) => setEditData({ ...editData, interactor_conditions: conditions })}
              allTags={tags}
            />

            <TagConditionEditor
              title="目标条件"
              conditions={editData.target_conditions}
              onChange={(conditions) => setEditData({ ...editData, target_conditions: conditions })}
              allTags={tags}
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={editData.is_active}
                onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
                className="w-3 h-3"
              />
              激活
            </label>
            <div className="flex-1" />
            <Button size="sm" onClick={() => onSave(editData)} className="h-6 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs">
              <Save className="w-3 h-3 mr-1" />
              保存
            </Button>
            <Button size="sm" onClick={onCancelEdit} variant="outline" className="h-6 px-3 bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300 text-xs">
              取消
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-[#252526] border border-[#3d3d3d] rounded hover:border-[#555] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">{rule.rule_name}</h3>
            {!rule.is_active && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">未激活</span>
            )}
          </div>
          {rule.description && (
            <p className="text-xs text-gray-400 mb-2">{rule.description}</p>
          )}
          <div className="text-xs text-gray-500">
            解锁: <span className="text-gray-300 font-mono">{rule.unlocked_command_tag_path}</span>
          </div>
        </div>

        <div className="flex gap-1 ml-3">
          <Button size="sm" variant="ghost" onClick={() => onEdit(rule)} className="h-7 w-7 p-0 hover:bg-[#3d3d3d] text-gray-300">
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDelete(rule.id)} className="h-7 w-7 p-0 hover:bg-[#5a1e1e] text-red-400">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="border border-[#3d3d3d] rounded p-2 bg-[#1e1e1e]">
          <div className="text-xs font-semibold text-gray-300 mb-1">交互者条件</div>
          {rule.interactor_conditions?.has_any_tags?.length > 0 && (
            <div className="mb-1">
              <div className="text-xs text-gray-500">Has Any:</div>
              {rule.interactor_conditions.has_any_tags.map((tag, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono">{tag}</div>
              ))}
            </div>
          )}
          {rule.interactor_conditions?.has_all_tags?.length > 0 && (
            <div className="mb-1">
              <div className="text-xs text-gray-500">Has All:</div>
              {rule.interactor_conditions.has_all_tags.map((tag, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono">{tag}</div>
              ))}
            </div>
          )}
          {rule.interactor_conditions?.not_has_tags?.length > 0 && (
            <div>
              <div className="text-xs text-gray-500">Not Has:</div>
              {rule.interactor_conditions.not_has_tags.map((tag, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono">{tag}</div>
              ))}
            </div>
          )}
          {(!rule.interactor_conditions?.has_any_tags?.length && 
            !rule.interactor_conditions?.has_all_tags?.length && 
            !rule.interactor_conditions?.not_has_tags?.length) && (
            <div className="text-xs text-gray-600">无条件</div>
          )}
        </div>

        <div className="border border-[#3d3d3d] rounded p-2 bg-[#1e1e1e]">
          <div className="text-xs font-semibold text-gray-300 mb-1">目标条件</div>
          {rule.target_conditions?.has_any_tags?.length > 0 && (
            <div className="mb-1">
              <div className="text-xs text-gray-500">Has Any:</div>
              {rule.target_conditions.has_any_tags.map((tag, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono">{tag}</div>
              ))}
            </div>
          )}
          {rule.target_conditions?.has_all_tags?.length > 0 && (
            <div className="mb-1">
              <div className="text-xs text-gray-500">Has All:</div>
              {rule.target_conditions.has_all_tags.map((tag, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono">{tag}</div>
              ))}
            </div>
          )}
          {rule.target_conditions?.not_has_tags?.length > 0 && (
            <div>
              <div className="text-xs text-gray-500">Not Has:</div>
              {rule.target_conditions.not_has_tags.map((tag, i) => (
                <div key={i} className="text-xs text-gray-300 font-mono">{tag}</div>
              ))}
            </div>
          )}
          {(!rule.target_conditions?.has_any_tags?.length && 
            !rule.target_conditions?.has_all_tags?.length && 
            !rule.target_conditions?.not_has_tags?.length) && (
            <div className="text-xs text-gray-600">无条件</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnlockableCommandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);

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
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UnlockableCommand.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlockableCommands'] });
      setEditingId(null);
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
      (rule.description && rule.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rule.unlocked_command_tag_path && rule.unlocked_command_tag_path.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [rules, searchQuery]);

  const handleCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
  };

  const handleSaveNew = (data) => {
    if (!data.rule_name || !data.unlocked_command_tag_path) {
      alert('请填写必填项：规则名称和解锁的指令标签');
      return;
    }
    createMutation.mutate(data);
  };

  const handleSaveEdit = (data) => {
    if (!data.rule_name || !data.unlocked_command_tag_path) {
      alert('请填写必填项：规则名称和解锁的指令标签');
      return;
    }
    updateMutation.mutate({ id: data.id, data });
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此规则吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const newRuleTemplate = {
    rule_name: "",
    description: "",
    unlocked_command_tag_path: "",
    interactor_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
    target_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
    is_active: true
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <KeyRound className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">指令解锁编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredRules.length} 条规则</span>
        
        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索规则..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建规则
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <div className="max-w-5xl mx-auto space-y-2">
          {creatingNew && (
            <RuleCard
              rule={newRuleTemplate}
              tags={tags}
              isEditing={true}
              onSave={handleSaveNew}
              onCancelEdit={() => setCreatingNew(false)}
            />
          )}

          {filteredRules.length === 0 && !creatingNew ? (
            <div className="text-center py-12 text-gray-500">
              <KeyRound className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <div className="text-sm">暂无规则</div>
            </div>
          ) : (
            filteredRules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                tags={tags}
                isEditing={editingId === rule.id}
                onEdit={(r) => {
                  setEditingId(r.id);
                  setCreatingNew(false);
                }}
                onSave={handleSaveEdit}
                onDelete={handleDelete}
                onCancelEdit={() => setEditingId(null)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}