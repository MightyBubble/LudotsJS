import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit3, Trash2, X, Save, KeyRound, User, Target, CheckCircle, XCircle } from "lucide-react";

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

export default function UnlockableCommandsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRule, setEditingRule] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      setEditingRule(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UnlockableCommand.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unlockableCommands'] });
      setShowForm(false);
      setEditingRule(null);
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
    setEditingRule({
      rule_name: "",
      description: "",
      unlocked_command_tag_path: "",
      interactor_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      target_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      is_active: true
    });
    setShowForm(true);
  };

  const handleEdit = (rule) => {
    setEditingRule({ ...rule });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!editingRule.rule_name || !editingRule.unlocked_command_tag_path) {
      alert('请填写必填项：规则名称和解锁的指令标签');
      return;
    }

    if (editingRule.id) {
      updateMutation.mutate({ id: editingRule.id, data: editingRule });
    } else {
      createMutation.mutate(editingRule);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此规则吗？')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      {/* 顶部工具栏 */}
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <KeyRound className="w-5 h-5 text-yellow-400" />
        <span className="text-sm font-semibold text-gray-300">指令解锁编辑器</span>
        
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

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧列表 */}
        <div className="w-96 bg-[#252526] border-r border-[#3d3d3d] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#3d3d3d]">
            <div className="text-xs text-gray-400">共 {filteredRules.length} 条规则</div>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {filteredRules.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                暂无规则，点击右上角创建
              </div>
            ) : (
              filteredRules.map(rule => (
                <div
                  key={rule.id}
                  className="p-3 bg-[#1e1e1e] border border-[#3d3d3d] rounded hover:border-[#0e639c] transition-colors cursor-pointer"
                  onClick={() => handleEdit(rule)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{rule.rule_name}</h3>
                        {!rule.is_active && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">未激活</span>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-gray-400 mt-1">{rule.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rule.id);
                      }}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#3d3d3d]">
                    <div className="text-xs text-gray-400 mb-1">解锁指令：</div>
                    <div className="text-xs text-yellow-300 font-mono">{rule.unlocked_command_tag_path}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧编辑区 */}
        <div className="flex-1 overflow-auto p-4">
          {showForm && editingRule ? (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* 基本信息 */}
              <div className="p-4 bg-[#252526] border border-[#3d3d3d] rounded">
                <h3 className="text-base font-semibold text-white mb-3">基本信息</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">规则名称 *</label>
                    <Input
                      value={editingRule.rule_name}
                      onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                      placeholder="例如：施放火球术"
                      className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">规则描述</label>
                    <Textarea
                      value={editingRule.description || ""}
                      onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                      placeholder="描述此规则的用途..."
                      className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">解锁的指令标签 *</label>
                    <Input
                      value={editingRule.unlocked_command_tag_path}
                      onChange={(e) => setEditingRule({ ...editingRule, unlocked_command_tag_path: e.target.value })}
                      placeholder="例如：Command.Attack.Fireball"
                      className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
                      list="tags-datalist"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingRule.is_active}
                      onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-gray-300">规则激活</label>
                  </div>
                </div>
              </div>

              {/* 交互者条件 */}
              <TagConditionEditor
                title="交互者条件（例如：玩家）"
                icon={<User className="w-4 h-4" />}
                conditions={editingRule.interactor_conditions}
                onChange={(conditions) => setEditingRule({ ...editingRule, interactor_conditions: conditions })}
                allTags={tags}
              />

              {/* 目标条件 */}
              <TagConditionEditor
                title="目标对象条件（例如：敌人、物品）"
                icon={<Target className="w-4 h-4" />}
                conditions={editingRule.target_conditions}
                onChange={(conditions) => setEditingRule({ ...editingRule, target_conditions: conditions })}
                allTags={tags}
              />

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存规则
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingRule(null);
                  }}
                  variant="outline"
                  className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
                >
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              选择一个规则进行编辑，或点击"新建规则"创建新的解锁规则
            </div>
          )}
        </div>
      </div>
    </div>
  );
}