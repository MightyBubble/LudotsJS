import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, AlertCircle, Check, Ban, Shield, Link, Trash, Power, Eraser, Zap } from "lucide-react";

export default function TagSimulator() {
  const [entityName, setEntityName] = useState("测试实体");
  const [activeTags, setActiveTags] = useState(new Set());
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['tagCategories'],
    queryFn: () => base44.entities.TagCategory.list(),
    initialData: [],
  });

  // 获取分类颜色
  const getCategoryColor = (categoryKey) => {
    if (!categories || !Array.isArray(categories)) return '#94a3b8';
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  // 检查标签是否可以添加
  const canAddTag = (tag) => {
    if (activeTags.has(tag.full_path)) return { canAdd: false, reason: "已存在" };

    // 检查 required_tags
    if (tag.required_tags && tag.required_tags.length > 0) {
      const missingRequired = tag.required_tags.filter(reqTag => !activeTags.has(reqTag));
      if (missingRequired.length > 0) {
        return { 
          canAdd: false, 
          reason: `缺少必需标签: ${missingRequired.join(', ')}` 
        };
      }
    }

    // 检查 blocked_tags
    if (tag.blocked_tags && tag.blocked_tags.length > 0) {
      const blockingTags = tag.blocked_tags.filter(blockTag => activeTags.has(blockTag));
      if (blockingTags.length > 0) {
        return { 
          canAdd: false, 
          reason: `被阻止: 存在 ${blockingTags.join(', ')}` 
        };
      }
    }

    return { canAdd: true };
  };

  // 模拟添加标签后的效果
  const simulateAddTag = (tag) => {
    const result = {
      willAttach: [],
      willRemove: [],
      willDisable: false,
      willBeRemoved: false
    };

    // attached_tags
    if (tag.attached_tags && tag.attached_tags.length > 0) {
      result.willAttach = tag.attached_tags;
    }

    // removed_tags
    if (tag.removed_tags && tag.removed_tags.length > 0) {
      result.willRemove = tag.removed_tags.filter(t => activeTags.has(t));
    }

    // disabled_if_tags
    if (tag.disabled_if_tags && tag.disabled_if_tags.tags && tag.disabled_if_tags.tags.length > 0) {
      const matchMode = tag.disabled_if_tags.match_mode || "any";
      const matches = tag.disabled_if_tags.tags.filter(t => activeTags.has(t));
      
      if (matchMode === "any" && matches.length > 0) {
        result.willDisable = true;
      } else if (matchMode === "all" && matches.length === tag.disabled_if_tags.tags.length) {
        result.willDisable = true;
      }
    }

    // remove_if_tags
    if (tag.remove_if_tags && tag.remove_if_tags.tags && tag.remove_if_tags.tags.length > 0) {
      const matchMode = tag.remove_if_tags.match_mode || "any";
      const matches = tag.remove_if_tags.tags.filter(t => activeTags.has(t));
      
      if (matchMode === "any" && matches.length > 0) {
        result.willBeRemoved = true;
      } else if (matchMode === "all" && matches.length === tag.remove_if_tags.tags.length) {
        result.willBeRemoved = true;
      }
    }

    return result;
  };

  // 添加标签
  const handleAddTag = (tag) => {
    const check = canAddTag(tag);
    if (!check.canAdd) return;

    const newActiveTags = new Set(activeTags);
    newActiveTags.add(tag.full_path);

    // 处理 attached_tags
    if (tag.attached_tags && tag.attached_tags.length > 0) {
      tag.attached_tags.forEach(attachedTag => {
        newActiveTags.add(attachedTag);
      });
    }

    // 处理 removed_tags
    if (tag.removed_tags && tag.removed_tags.length > 0) {
      tag.removed_tags.forEach(removedTag => {
        newActiveTags.delete(removedTag);
      });
    }

    // 检查其他标签的 remove_if 规则
    const tagsToRemove = [];
    newActiveTags.forEach(activeTagPath => {
      const activeTag = tags.find(t => t.full_path === activeTagPath);
      if (!activeTag) return;

      if (activeTag.remove_if_tags && activeTag.remove_if_tags.tags && activeTag.remove_if_tags.tags.length > 0) {
        const matchMode = activeTag.remove_if_tags.match_mode || "any";
        const matches = activeTag.remove_if_tags.tags.filter(t => newActiveTags.has(t));
        
        if (matchMode === "any" && matches.length > 0) {
          tagsToRemove.push(activeTagPath);
        } else if (matchMode === "all" && matches.length === activeTag.remove_if_tags.tags.length) {
          tagsToRemove.push(activeTagPath);
        }
      }
    });

    tagsToRemove.forEach(tagPath => newActiveTags.delete(tagPath));

    setActiveTags(newActiveTags);
  };

  // 移除标签
  const handleRemoveTag = (tagPath) => {
    const newActiveTags = new Set(activeTags);
    newActiveTags.delete(tagPath);
    setActiveTags(newActiveTags);
  };

  // 清空所有标签
  const handleClearAll = () => {
    setActiveTags(new Set());
  };

  // 检查标签是否被禁用
  const isTagDisabled = (tag) => {
    if (!activeTags.has(tag.full_path)) return false;

    if (tag.disabled_if_tags && tag.disabled_if_tags.tags && tag.disabled_if_tags.tags.length > 0) {
      const matchMode = tag.disabled_if_tags.match_mode || "any";
      const matches = tag.disabled_if_tags.tags.filter(t => activeTags.has(t));
      
      if (matchMode === "any" && matches.length > 0) return true;
      if (matchMode === "all" && matches.length === tag.disabled_if_tags.tags.length) return true;
    }

    return false;
  };

  // 搜索过滤
  const filteredTags = useMemo(() => {
    if (!searchQuery) return tags;
    return tags.filter(tag => 
      tag.full_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tag.description && tag.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tags, searchQuery]);

  // 分类标签
  const { canAdd: addableTags, cannotAdd: blockedTags } = useMemo(() => {
    const canAdd = [];
    const cannotAdd = [];

    filteredTags.forEach(tag => {
      const check = canAddTag(tag);
      if (check.canAdd) {
        canAdd.push(tag);
      } else {
        cannotAdd.push({ tag, reason: check.reason });
      }
    });

    return { canAdd, cannotAdd };
  }, [filteredTags, activeTags]);

  const simulation = selectedTag ? simulateAddTag(selectedTag) : null;

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      {/* 顶部工具栏 */}
      <div className="h-12 bg-[#141414] border-b border-[#262626] flex items-center px-4 gap-3">
        <Zap className="w-5 h-5 text-yellow-400" />
        <span className="text-sm font-semibold text-gray-300">GameplayTag 模拟器</span>
        
        <div className="flex-1" />

        <Input
          placeholder="实体名称"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          className="h-7 w-48 bg-[#0a0a0a] border-[#262626] text-sm text-white"
        />

        <Button
          size="sm"
          variant="outline"
          onClick={handleClearAll}
          className="h-7 px-3 bg-[#141414] border-[#262626] hover:bg-[#262626] text-gray-300"
        >
          清空所有标签
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：当前激活的标签 */}
        <div className="w-80 bg-[#252526] border-r border-[#262626] flex flex-col">
          <div className="p-3 border-b border-[#262626]">
            <h2 className="text-sm font-semibold text-white mb-1">
              {entityName} - 当前标签
            </h2>
            <div className="text-xs text-gray-400">
              共 {activeTags.size} 个标签
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {activeTags.size === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                暂无标签，从右侧添加
              </div>
            ) : (
              Array.from(activeTags).map(tagPath => {
                const tag = tags.find(t => t.full_path === tagPath);
                if (!tag) return null;

                const disabled = isTagDisabled(tag);

                return (
                  <div
                    key={tagPath}
                    className={`p-2 rounded border ${
                      disabled 
                        ? 'bg-[#3d2d1e] border-yellow-800/50' 
                        : 'bg-[#0a0a0a] border-[#262626] hover:border-[#f97316]'
                    } transition-colors`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-1 h-4 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: getCategoryColor(tag.category_key) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white truncate">
                            {tag.name}
                          </span>
                          {disabled && (
                            <span className="text-xs px-1 py-0.5 bg-yellow-900/50 text-yellow-400 rounded">
                              已禁用
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {tag.full_path}
                        </p>
                        {tag.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {tag.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveTag(tagPath)}
                        className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 中间：可添加和不可添加的标签 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-[#262626]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="搜索标签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 bg-[#0a0a0a] border-[#262626] text-sm text-white"
              />
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* 可添加的标签 - 左栏 */}
            <div className="flex-1 overflow-y-auto p-4 border-r border-[#262626]">
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-[#0a0a0a] z-10 py-2 border-b border-[#262626]">
                <Check className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-green-400">
                  可添加标签 ({addableTags.length})
                </h3>
              </div>
              <div className="space-y-2">
                {addableTags.map(tag => (
                  <div
                    key={tag.id}
                    className={`p-3 rounded border cursor-pointer transition-all group ${
                      selectedTag?.id === tag.id
                        ? 'bg-[#f97316]/10 border-[#f97316]'
                        : 'bg-[#141414] border-[#262626] hover:border-[#f97316]/50 hover:bg-[#1a1a1a]'
                    }`}
                    onClick={() => setSelectedTag(tag)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                        style={{ backgroundColor: getCategoryColor(tag.category_key) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-[#e5e5e5] truncate">
                            {tag.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddTag(tag);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#f97316]/20 text-[#f97316] transition-all"
                            title="添加"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 font-mono truncate bg-[#0a0a0a] px-1.5 py-0.5 rounded inline-block">
                          {tag.full_path}
                        </p>
                        {tag.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                            {tag.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {addableTags.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-xs">没有可添加的标签</div>
                )}
              </div>
            </div>

            {/* 排除的标签 - 右栏 */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#0c0c0c]">
              <div className="flex items-center gap-2 mb-3 sticky top-0 bg-[#0c0c0c] z-10 py-2 border-b border-[#262626]">
                <Ban className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">
                  排除标签 ({blockedTags.length})
                </h3>
              </div>
              <div className="space-y-2">
                {blockedTags.map(({ tag, reason }) => (
                  <div
                    key={tag.id}
                    className="p-3 rounded border bg-[#141414] border-[#262626] opacity-75 hover:opacity-100 transition-opacity"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                        style={{ backgroundColor: getCategoryColor(tag.category_key) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-400 truncate mb-1">
                          {tag.name}
                        </div>
                        <p className="text-xs text-gray-600 font-mono truncate mb-2">
                          {tag.full_path}
                        </p>
                        <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-900/30 px-2 py-1 rounded">
                          <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                          <span className="text-xs text-red-400">
                            {reason}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {blockedTags.length === 0 && (
                  <div className="text-center py-8 text-gray-600 text-xs">没有被排除的标签</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：选中标签的模拟效果 */}
        <div className="w-96 bg-[#252526] border-l border-[#262626] flex flex-col">
          <div className="p-3 border-b border-[#262626]">
            <h2 className="text-sm font-semibold text-white">添加后的效果预览</h2>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {selectedTag && simulation ? (
              <div className="space-y-3">
                {/* 标签信息 */}
                <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded">
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-1 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCategoryColor(selectedTag.category_key) }}
                    />
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-white mb-1">
                        {selectedTag.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-mono">
                        {selectedTag.full_path}
                      </p>
                    </div>
                  </div>
                  {selectedTag.description && (
                    <p className="text-xs text-gray-300 mt-2 pt-2 border-t border-[#262626]">
                      {selectedTag.description}
                    </p>
                  )}
                </div>

                {/* 同时附加 */}
                {simulation.willAttach.length > 0 && (
                  <div className="p-3 bg-[#1e3d1e] border border-[#2d5d2d] rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Link className="w-4 h-4 text-green-400" />
                      <h4 className="text-sm font-semibold text-green-400">
                        同时附加标签
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {simulation.willAttach.map((tagPath, idx) => (
                        <div key={idx} className="text-xs text-green-300 font-mono">
                          + {tagPath}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 将被移除 */}
                {simulation.willRemove.length > 0 && (
                  <div className="p-3 bg-[#3d1e1e] border border-[#5d2d2d] rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Trash className="w-4 h-4 text-orange-400" />
                      <h4 className="text-sm font-semibold text-orange-400">
                        将移除标签
                      </h4>
                    </div>
                    <div className="space-y-1">
                      {simulation.willRemove.map((tagPath, idx) => (
                        <div key={idx} className="text-xs text-orange-300 font-mono">
                          - {tagPath}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 将被禁用 */}
                {simulation.willDisable && (
                  <div className="p-3 bg-[#3d3d1e] border border-[#5d5d2d] rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Power className="w-4 h-4 text-yellow-400" />
                      <h4 className="text-sm font-semibold text-yellow-400">
                        将被禁用
                      </h4>
                    </div>
                    <p className="text-xs text-yellow-300">
                      由于满足禁用条件，此标签添加后将立即被禁用
                    </p>
                  </div>
                )}

                {/* 将被自动移除 */}
                {simulation.willBeRemoved && (
                  <div className="p-3 bg-[#3d1e3d] border border-[#5d2d5d] rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <Eraser className="w-4 h-4 text-purple-400" />
                      <h4 className="text-sm font-semibold text-purple-400">
                        将被自动移除
                      </h4>
                    </div>
                    <p className="text-xs text-purple-300">
                      由于满足移除条件，此标签添加后将立即被移除
                    </p>
                  </div>
                )}

                {/* 无特殊效果 */}
                {!simulation.willAttach.length && 
                 !simulation.willRemove.length && 
                 !simulation.willDisable && 
                 !simulation.willBeRemoved && (
                  <div className="p-3 bg-[#0a0a0a] border border-[#262626] rounded">
                    <p className="text-xs text-gray-400 text-center">
                      此标签没有特殊的添加效果
                    </p>
                  </div>
                )}

                {/* 添加按钮 */}
                <Button
                  onClick={() => handleAddTag(selectedTag)}
                  className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加此标签
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                选择一个可添加的标签查看效果
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}