import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Edit3, Trash2, X, Save, Zap, Target, ArrowRight, ChevronDown, ChevronRight, CheckCircle } from "lucide-react";

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

// 效果卡片组件
function EffectCard({ effect, onEdit, onDelete, onSave, tags, isEditing, onCancelEdit }) {
  const [editData, setEditData] = useState(effect);
  const [isExpanded, setIsExpanded] = useState(false);

  const conditionCount = (conditions) => {
    if (!conditions) return 0;
    return (conditions.has_any_tags?.length || 0) + 
           (conditions.has_all_tags?.length || 0) + 
           (conditions.not_has_tags?.length || 0);
  };

  const hasConditions = (conditions) => conditionCount(conditions) > 0;

  if (isEditing) {
    return (
      <div className="p-4 bg-[#252526] border-2 border-[#0e639c] rounded">
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">效果名称 *</label>
              <Input
                value={editData.effect_name}
                onChange={(e) => setEditData({ ...editData, effect_name: e.target.value })}
                className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">触发效果标签 *</label>
              <Input
                value={editData.triggering_effect_tag_path}
                onChange={(e) => setEditData({ ...editData, triggering_effect_tag_path: e.target.value })}
                className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
                list="tags-datalist"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">优先级</label>
              <Input
                type="number"
                value={editData.priority}
                onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) || 0 })}
                className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white"
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
            <TargetConditionEditor
              conditions={editData.target_object_conditions}
              onChange={(conditions) => setEditData({ ...editData, target_object_conditions: conditions })}
              allTags={tags}
            />

            <div className="border border-[#3d3d3d] rounded p-3 bg-[#1e1e1e]">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-semibold text-white">效果结果</h4>
              </div>

              <TagListEditor
                title="添加到目标的标签"
                tags={editData.result_tags_to_add}
                onChange={(tags) => setEditData({ ...editData, result_tags_to_add: tags })}
                allTags={tags}
                color="green"
              />

              <TagListEditor
                title="从目标移除的标签"
                tags={editData.result_tags_to_remove}
                onChange={(tags) => setEditData({ ...editData, result_tags_to_remove: tags })}
                allTags={tags}
                color="orange"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editData.is_active}
              onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-300">效果激活</label>
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
            <h3 className="text-base font-semibold text-white">{effect.effect_name}</h3>
            {!effect.is_active && (
              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded">未激活</span>
            )}
            {effect.is_active && (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
            {effect.priority > 0 && (
              <span className="text-xs px-2 py-0.5 bg-purple-900 text-purple-300 rounded">优先级 {effect.priority}</span>
            )}
          </div>

          {effect.description && (
            <p className="text-sm text-gray-400 ml-7 mb-3">{effect.description}</p>
          )}

          <div className="ml-7 grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">触发标签</div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-400" />
                <span className="text-purple-300 font-mono text-xs truncate">
                  {effect.triggering_effect_tag_path}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">目标条件</div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-400" />
                {conditionCount(effect.target_object_conditions) > 0 ? (
                  <span className="text-blue-300">{conditionCount(effect.target_object_conditions)} 个条件</span>
                ) : (
                  <span className="text-gray-600">无条件</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">添加标签</div>
              <div className="text-green-300">
                {effect.result_tags_to_add?.length || 0} 个
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-1">移除标签</div>
              <div className="text-orange-300">
                {effect.result_tags_to_remove?.length || 0} 个
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="ml-7 mt-4 pt-4 border-t border-[#3d3d3d] grid grid-cols-2 gap-4">
              {/* 目标条件详情 */}
              {hasConditions(effect.target_object_conditions) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-semibold text-white">目标条件</h4>
                  </div>
                  <div className="space-y-1 text-xs">
                    {effect.target_object_conditions?.has_any_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Has Any: </span>
                        {effect.target_object_conditions.has_any_tags.map((tag, i) => (
                          <span key={i} className="text-green-300 font-mono">{tag}{i < effect.target_object_conditions.has_any_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    {effect.target_object_conditions?.has_all_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Has All: </span>
                        {effect.target_object_conditions.has_all_tags.map((tag, i) => (
                          <span key={i} className="text-blue-300 font-mono">{tag}{i < effect.target_object_conditions.has_all_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                    {effect.target_object_conditions?.not_has_tags?.length > 0 && (
                      <div>
                        <span className="text-gray-500">Not Has: </span>
                        {effect.target_object_conditions.not_has_tags.map((tag, i) => (
                          <span key={i} className="text-red-300 font-mono">{tag}{i < effect.target_object_conditions.not_has_tags.length - 1 ? ', ' : ''}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 效果结果详情 */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight className="w-4 h-4 text-green-400" />
                  <h4 className="text-sm font-semibold text-white">效果结果</h4>
                </div>
                <div className="space-y-2 text-xs">
                  {effect.result_tags_to_add?.length > 0 && (
                    <div>
                      <span className="text-gray-500">添加: </span>
                      {effect.result_tags_to_add.map((tag, i) => (
                        <span key={i} className="text-green-300 font-mono">{tag}{i < effect.result_tags_to_add.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}
                  {effect.result_tags_to_remove?.length > 0 && (
                    <div>
                      <span className="text-gray-500">移除: </span>
                      {effect.result_tags_to_remove.map((tag, i) => (
                        <span key={i} className="text-orange-300 font-mono">{tag}{i < effect.result_tags_to_remove.length - 1 ? ', ' : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(effect)}
            className="h-8 w-8 p-0 hover:bg-[#3d3d3d] text-gray-300"
          >
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(effect.id)}
            className="h-8 w-8 p-0 hover:bg-[#5a1e1e] text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function InteractionEffectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);

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
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.InteractionEffect.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interactionEffects'] });
      setEditingId(null);
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
    setCreatingNew(true);
    setEditingId(null);
  };

  const handleSaveNew = (data) => {
    if (!data.effect_name || !data.triggering_effect_tag_path) {
      alert('请填写必填项：效果名称和触发效果标签');
      return;
    }
    createMutation.mutate(data);
  };

  const handleSaveEdit = (data) => {
    if (!data.effect_name || !data.triggering_effect_tag_path) {
      alert('请填写必填项：效果名称和触发效果标签');
      return;
    }
    updateMutation.mutate({ id: data.id, data });
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此效果规则吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const newEffectTemplate = {
    effect_name: "",
    description: "",
    triggering_effect_tag_path: "",
    target_object_conditions: { has_any_tags: [], has_all_tags: [], not_has_tags: [] },
    result_tags_to_add: [],
    result_tags_to_remove: [],
    priority: 0,
    is_active: true
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      {/* 顶部工具栏 */}
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Zap className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-semibold text-gray-300">交互效果编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredEffects.length} 个效果</span>
        
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

      {/* 效果列表 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto space-y-3">
          {creatingNew && (
            <EffectCard
              effect={newEffectTemplate}
              tags={tags}
              isEditing={true}
              onSave={handleSaveNew}
              onCancelEdit={() => setCreatingNew(false)}
            />
          )}

          {filteredEffects.length === 0 && !creatingNew ? (
            <div className="text-center py-16 text-gray-500">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg mb-2">暂无效果</div>
              <div className="text-sm">点击右上角"新建效果"开始创建</div>
            </div>
          ) : (
            filteredEffects.map(effect => (
              <EffectCard
                key={effect.id}
                effect={effect}
                tags={tags}
                isEditing={editingId === effect.id}
                onEdit={(e) => {
                  setEditingId(e.id);
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