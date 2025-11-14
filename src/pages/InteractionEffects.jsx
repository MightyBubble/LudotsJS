import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit3, Trash2, X, Save, Zap, Target, ArrowRight } from "lucide-react";

// 标签列表编辑器
function TagListEditor({ title, tags, onChange, allTags, color = "blue" }) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    if (!inputValue.trim()) return;
    onChange([...(tags || []), inputValue.trim()]);
    setInputValue("");
  };

  const removeTag = (index) => {
    onChange((tags || []).filter((_, i) => i !== index));
  };

  const colorClass = {
    green: "text-green-300",
    blue: "text-blue-300",
    red: "text-red-300",
    orange: "text-orange-300"
  }[color] || "text-gray-300";

  return (
    <div className="mb-3">
      <label className="text-xs text-gray-400 mb-1 block">{title}</label>
      <div className="space-y-1 mb-2">
        {(tags || []).map((tag, idx) => (
          <div key={idx} className="flex items-center justify-between bg-[#2d2d2d] px-2 py-1 rounded text-xs">
            <span className={`${colorClass} font-mono`}>{tag}</span>
            <button onClick={() => removeTag(idx)} className="text-gray-500 hover:text-red-400">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTag()}
          placeholder="输入标签路径"
          className="h-7 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
          list="tags-datalist"
        />
        <Button size="sm" onClick={addTag} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb]">
          <Plus className="w-3 h-3" />
        </Button>
      </div>
      <datalist id="tags-datalist">
        {allTags.map(t => <option key={t.id} value={t.full_path} />)}
      </datalist>
    </div>
  );
}

// 目标条件编辑器
function TargetConditionEditor({ conditions, onChange, allTags }) {
  const safeConditions = conditions || { has_any_tags: [], has_all_tags: [], not_has_tags: [] };

  return (
    <div className="border border-[#3d3d3d] rounded p-3 bg-[#1e1e1e]">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-purple-400" />
        <h4 className="text-sm font-semibold text-white">目标对象条件</h4>
      </div>

      <TagListEditor
        title="拥有任意标签 (Has Any)"
        tags={safeConditions.has_any_tags}
        onChange={(tags) => onChange({ ...safeConditions, has_any_tags: tags })}
        allTags={allTags}
        color="green"
      />

      <TagListEditor
        title="拥有所有标签 (Has All)"
        tags={safeConditions.has_all_tags}
        onChange={(tags) => onChange({ ...safeConditions, has_all_tags: tags })}
        allTags={allTags}
        color="blue"
      />

      <TagListEditor
        title="不能拥有标签 (Not Has)"
        tags={safeConditions.not_has_tags}
        onChange={(tags) => onChange({ ...safeConditions, not_has_tags: tags })}
        allTags={allTags}
        color="red"
      />
    </div>
  );
}

export default function InteractionEffectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingEffect, setEditingEffect] = useState(null);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
      setEditingEffect(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InteractionEffect.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactionEffects'] });
      setShowForm(false);
      setEditingEffect(null);
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
      (effect.description && effect.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (effect.triggering_effect_tag_path && effect.triggering_effect_tag_path.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [effects, searchQuery]);

  const handleCreate = () => {
    setEditingEffect({
      effect_name: "",
      description: "",
      triggering_effect_tag_path: "",
      target_object_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
      result_tags_to_add: [],
      result_tags_to_remove: [],
      priority: 0,
      is_active: true
    });
    setShowForm(true);
  };

  const handleEdit = (effect) => {
    setEditingEffect({ ...effect });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!editingEffect.effect_name || !editingEffect.triggering_effect_tag_path) {
      alert('请填写必填项：效果名称和触发效果标签');
      return;
    }

    if (editingEffect.id) {
      updateMutation.mutate({ id: editingEffect.id, data: editingEffect });
    } else {
      createMutation.mutate(editingEffect);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此效果规则吗？')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      {/* 顶部工具栏 */}
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Zap className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-semibold text-gray-300">交互效果编辑器</span>
        
        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="搜索效果..."
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
          新建效果
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧列表 */}
        <div className="w-96 bg-[#252526] border-r border-[#3d3d3d] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#3d3d3d]">
            <div className="text-xs text-gray-400">共 {filteredEffects.length} 个效果</div>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {filteredEffects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                暂无效果，点击右上角创建
              </div>
            ) : (
              filteredEffects.map(effect => (
                <div
                  key={effect.id}
                  className="p-3 bg-[#1e1e1e] border border-[#3d3d3d] rounded hover:border-[#0e639c] transition-colors cursor-pointer"
                  onClick={() => handleEdit(effect)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{effect.effect_name}</h3>
                        {!effect.is_active && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-700 text-gray-400 rounded">未激活</span>
                        )}
                        {effect.priority > 0 && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-900 text-purple-300 rounded">P{effect.priority}</span>
                        )}
                      </div>
                      {effect.description && (
                        <p className="text-xs text-gray-400 mt-1">{effect.description}</p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(effect.id);
                      }}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-[#3d3d3d]">
                    <div className="text-xs text-gray-400 mb-1">触发标签：</div>
                    <div className="text-xs text-purple-300 font-mono">{effect.triggering_effect_tag_path}</div>
                  </div>

                  {((effect.result_tags_to_add && effect.result_tags_to_add.length > 0) || 
                    (effect.result_tags_to_remove && effect.result_tags_to_remove.length > 0)) && (
                    <div className="mt-2 pt-2 border-t border-[#3d3d3d] text-xs text-gray-400">
                      {effect.result_tags_to_add && effect.result_tags_to_add.length > 0 && (
                        <div>添加: {effect.result_tags_to_add.length} 个标签</div>
                      )}
                      {effect.result_tags_to_remove && effect.result_tags_to_remove.length > 0 && (
                        <div>移除: {effect.result_tags_to_remove.length} 个标签</div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧编辑区 */}
        <div className="flex-1 overflow-auto p-4">
          {showForm && editingEffect ? (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* 基本信息 */}
              <div className="p-4 bg-[#252526] border border-[#3d3d3d] rounded">
                <h3 className="text-base font-semibold text-white mb-3">基本信息</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">效果名称 *</label>
                    <Input
                      value={editingEffect.effect_name}
                      onChange={(e) => setEditingEffect({ ...editingEffect, effect_name: e.target.value })}
                      placeholder="例如：燃烧效果"
                      className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">效果描述</label>
                    <Textarea
                      value={editingEffect.description || ""}
                      onChange={(e) => setEditingEffect({ ...editingEffect, description: e.target.value })}
                      placeholder="描述此效果的用途..."
                      className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">触发效果标签 *</label>
                    <Input
                      value={editingEffect.triggering_effect_tag_path}
                      onChange={(e) => setEditingEffect({ ...editingEffect, triggering_effect_tag_path: e.target.value })}
                      placeholder="例如：Effect.Fire.Burn"
                      className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
                      list="tags-datalist"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">优先级</label>
                      <Input
                        type="number"
                        value={editingEffect.priority}
                        onChange={(e) => setEditingEffect({ ...editingEffect, priority: parseInt(e.target.value) || 0 })}
                        className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
                      />
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingEffect.is_active}
                          onChange={(e) => setEditingEffect({ ...editingEffect, is_active: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">效果激活</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 目标条件 */}
              <TargetConditionEditor
                conditions={editingEffect.target_object_conditions}
                onChange={(conditions) => setEditingEffect({ ...editingEffect, target_object_conditions: conditions })}
                allTags={tags}
              />

              {/* 效果结果 */}
              <div className="p-4 bg-[#252526] border border-[#3d3d3d] rounded">
                <div className="flex items-center gap-2 mb-3">
                  <ArrowRight className="w-4 h-4 text-green-400" />
                  <h3 className="text-base font-semibold text-white">效果结果</h3>
                </div>

                <div className="space-y-3">
                  <TagListEditor
                    title="添加到目标的标签"
                    tags={editingEffect.result_tags_to_add}
                    onChange={(tags) => setEditingEffect({ ...editingEffect, result_tags_to_add: tags })}
                    allTags={tags}
                    color="green"
                  />

                  <TagListEditor
                    title="从目标移除的标签"
                    tags={editingEffect.result_tags_to_remove}
                    onChange={(tags) => setEditingEffect({ ...editingEffect, result_tags_to_remove: tags })}
                    allTags={tags}
                    color="orange"
                  />
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存效果
                </Button>
                <Button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEffect(null);
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
              选择一个效果进行编辑，或点击"新建效果"创建新的交互效果规则
            </div>
          )}
        </div>
      </div>
    </div>
  );
}