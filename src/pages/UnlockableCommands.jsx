import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit3, Trash2, X, Save, KeyRound, User, Target, ChevronDown, ChevronRight, CheckCircle, XCircle } from "lucide-react";

// 标签条件编辑组件
function TagConditionEditor({ title, icon, conditions, onChange, allTags }) {
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
      <div className="flex items-center gap-2 mb-3">
        <div className="text-blue-400">{icon}</div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
      </div>

      {/* Has Any */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">拥有任意标签 (Has Any)</label>
        <div className="space-y-1 mb-2">
          {(safeConditions.has_any_tags || []).map((tag, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#2d2d2d] px-2 py-1 rounded text-xs">
              <span className="text-green-300 font-mono">{tag}</span>
              <button onClick={() => removeTag('has_any', idx)} className="text-gray-500 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={inputs.has_any}
            onChange={(e) => setInputs({ ...inputs, has_any: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addTag('has_any', inputs.has_any)}
            placeholder="输入标签路径"
            className="h-7 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
            list="tags-datalist"
          />
          <Button size="sm" onClick={() => addTag('has_any', inputs.has_any)} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb]">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Has All */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1 block">拥有所有标签 (Has All)</label>
        <div className="space-y-1 mb-2">
          {(safeConditions.has_all_tags || []).map((tag, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#2d2d2d] px-2 py-1 rounded text-xs">
              <span className="text-blue-300 font-mono">{tag}</span>
              <button onClick={() => removeTag('has_all', idx)} className="text-gray-500 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={inputs.has_all}
            onChange={(e) => setInputs({ ...inputs, has_all: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addTag('has_all', inputs.has_all)}
            placeholder="输入标签路径"
            className="h-7 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
            list="tags-datalist"
          />
          <Button size="sm" onClick={() => addTag('has_all', inputs.has_all)} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb]">
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Not Has */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">不能拥有标签 (Not Has)</label>
        <div className="space-y-1 mb-2">
          {(safeConditions.not_has_tags || []).map((tag, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#2d2d2d] px-2 py-1 rounded text-xs">
              <span className="text-red-300 font-mono">{tag}</span>
              <button onClick={() => removeTag('not_has', idx)} className="text-gray-500 hover:text-red-400">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={inputs.not_has}
            onChange={(e) => setInputs({ ...inputs, not_has: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addTag('not_has', inputs.not_has)}
            placeholder="输入标签路径"
            className="h-7 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
            list="tags-datalist"
          />
          <Button size="sm" onClick={() => addTag('not_has', inputs.not_has)} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb]">
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
  const [isExpanded, setIsExpanded] = useState(false);

  const hasConditions = (conditions) => {
    if (!conditions) return false;
    return (conditions.has_any_tags && conditions.has_any_tags.length > 0) ||
           (conditions.has_all_tags && conditions.has_all_tags.length > 0) ||
           (conditions.not_has_tags && conditions.not_has_tags.length > 0);
  };

  const conditionCount = (conditions) => {
    if (!conditions) return 0;
    return (conditions.has_any_tags?.length || 0) + 
           (conditions.has_all_tags?.length || 0) + 
           (conditions.not_has_tags?.length || 0);
  };

  const renderConditionSummary = (conditions, label) => {
    const count = conditionCount(conditions);
    if (count === 0) return <span className="text-gray-600">无条件</span>;
    return <span className="text-blue-300">{count} 个条件</span>;
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-[#252526] border-2 border-[#0e639c] rounded">
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">规则名称 *</label>
              <Input
                value={editData.rule_name}
                onChange={(e) => setEditData({ ...editData, rule_name: e.target.value })}
                className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">解锁的指令标签 *</label>
              <Input
                value={editData.unlocked_command_tag_path}
                onChange={(e) => setEditData({ ...editData, unlocked_command_tag_path: e.target.value })}
                className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
                list="tags-datalist"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">描述</label>
            <Textarea
              value={editData.description || ""}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TagConditionEditor
              title="交互者条件"
              icon={<User className="w-4 h-4" />}
              conditions={editData.interactor_conditions}
              onChange={(conditions) => setEditData({ ...editData, interactor_conditions: conditions })}
              allTags={tags}
            />

            <TagConditionEditor
              title="目标条件"
              icon={<Target className="w-4 h-4" />}
              conditions={editData.target_conditions}
              onChange={(conditions) => setEditData({ ...editData, target_conditions: conditions })}
              allTags={tags}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editData.is_active}
              onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-300">规则激活</label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => onSave(editData)}
              className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
            >
              <Save className="w-3 h-3 mr-1" />
              保存
            </Button>
            <Button
              size="sm"
              onClick={onCancelEdit}
              variant="outline"
              className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
            >
              <X className="w-3 h-3 mr-1" />
              取消
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#252526] border border-[#3d3d3d] rounded hover:border-[#0e639c] transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <h3 className="text-base font-semibold text-white">{rule.rule_name}</h3>
            {!rule.is_active && (
              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded">未激活</span>
            )}
            {rule.is_active && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>

          {rule.description && (
            <p className="text-sm text-gray-400 ml-7 mb-3">{rule.description}</p>
          )}

          <div className="ml-7 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">交互者条件</div>
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-blue-400" />
                {renderConditionSummary(rule.interactor_conditions, "交互者")}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">目标条件</div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-purple-400" />
                {renderConditionSummary(rule.target_conditions, "目标")}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">解锁指令</div>
              <div className="flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-yellow-400" />
                <span className="text-yellow-300 font-mono text-xs truncate">
                  {rule.unlocked_command_tag_path}
                </span>
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="ml-7 mt-4 pt-4 border-t border-[#3d3d3d] grid grid-cols-2 gap-4">
              {/* 交互者详细条件 */}
              {hasConditions(rule.interactor_conditions) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <h4 className="text-sm font-semibold text-white">交互者条件</h4>
                  </div>
                  <div className="space-y-1 text-xs">
                    {rule.interactor_conditions?.has_any_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Has Any: </span>
                        {rule.interactor_conditions.has_any_tags.map((tag, i) => (
                          <span key={i} className="text-green-300 font-mono">{tag}{i < rule.interactor_conditions.has_any_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    {rule.interactor_conditions?.has_all_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Has All: </span>
                        {rule.interactor_conditions.has_all_tags.map((tag, i) => (
                          <span key={i} className="text-blue-300 font-mono">{tag}{i < rule.interactor_conditions.has_all_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    {rule.interactor_conditions?.not_has_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Not Has: </span>
                        {rule.interactor_conditions.not_has_tags.map((tag, i) => (
                          <span key={i} className="text-red-300 font-mono">{tag}{i < rule.interactor_conditions.not_has_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 目标详细条件 */}
              {hasConditions(rule.target_conditions) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-white">目标条件</h4>
                  </div>
                  <div className="space-y-1 text-xs">
                    {rule.target_conditions?.has_any_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Has Any: </span>
                        {rule.target_conditions.has_any_tags.map((tag, i) => (
                          <span key={i} className="text-green-300 font-mono">{tag}{i < rule.target_conditions.has_any_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    {rule.target_conditions?.has_all_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Has All: </span>
                        {rule.target_conditions.has_all_tags.map((tag, i) => (
                          <span key={i} className="text-blue-300 font-mono">{tag}{i < rule.target_conditions.has_all_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    {rule.target_conditions?.not_has_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Not Has: </span>
                        {rule.target_conditions.not_has_tags.map((tag, i) => (
                          <span key={i} className="text-red-300 font-mono">{tag}{i < rule.target_conditions.not_has_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(rule)}
            className="h-8 w-8 p-0 hover:bg-[#3d3d3d] text-gray-300"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(rule.id)}
            className="h-8 w-8 p-0 hover:bg-[#5a1e1e] text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
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
      {/* 顶部工具栏 */}
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <KeyRound className="w-5 h-5 text-yellow-400" />
        <span className="text-sm font-semibold text-gray-300">指令解锁编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredRules.length} 条规则</span>
        
        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="搜索规则..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 w-64 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
          />
        </div>

        <Button
          size="sm"
          onClick={handleCreate}
          className="h-7 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white"
        >
          <Plus className="w-4 h-4 mr-1" />
          新建规则
        </Button>
      </div>

      {/* 规则列表 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-3">
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
            <div className="text-center py-16 text-gray-500">
              <KeyRound className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg mb-2">暂无规则</div>
              <div className="text-sm">点击右上角"新建规则"开始创建</div>
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