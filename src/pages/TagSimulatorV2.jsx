import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Play, Trash2, X, AlertCircle, CheckCircle2, 
  XCircle, Link, ArrowRight, Info, Zap
} from "lucide-react";

export default function TagSimulatorV2() {
  const [entityName, setEntityName] = useState("测试实体");
  const [activeTags, setActiveTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPreview, setSelectedPreview] = useState(null);

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

  const getCategoryColor = (categoryKey) => {
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  // 检查标签是否可以添加
  const canAddTag = (tag) => {
    // 检查 required_tags
    if (tag.required_tags && tag.required_tags.length > 0) {
      const hasAllRequired = tag.required_tags.every(reqPath =>
        activeTags.some(activeTag => activeTag.full_path === reqPath)
      );
      if (!hasAllRequired) return { can: false, reason: "缺少必需标签" };
    }

    // 检查 blocked_tags
    if (tag.blocked_tags && tag.blocked_tags.length > 0) {
      const hasBlockedTag = tag.blocked_tags.some(blockPath =>
        activeTags.some(activeTag => activeTag.full_path === blockPath)
      );
      if (hasBlockedTag) return { can: false, reason: "存在阻止标签" };
    }

    return { can: true, reason: "" };
  };

  // 检查标签是否会被禁用
  const isTagDisabled = (tag) => {
    if (!tag.disabled_if_tags || !tag.disabled_if_tags.tags || tag.disabled_if_tags.tags.length === 0) {
      return false;
    }

    const { tags: disableTags, match_mode } = tag.disabled_if_tags;

    if (match_mode === "all") {
      return disableTags.every(disableTag =>
        activeTags.some(activeTag => activeTag.full_path === disableTag)
      );
    } else {
      return disableTags.some(disableTag =>
        activeTags.some(activeTag => activeTag.full_path === disableTag)
      );
    }
  };

  // 检查标签是否应该被移除
  const shouldRemoveTag = (tag) => {
    if (!tag.remove_if_tags || !tag.remove_if_tags.tags || tag.remove_if_tags.tags.length === 0) {
      return false;
    }

    const { tags: removeTags, match_mode } = tag.remove_if_tags;

    if (match_mode === "all") {
      return removeTags.every(removeTag =>
        activeTags.some(activeTag => activeTag.full_path === removeTag)
      );
    } else {
      return removeTags.some(removeTag =>
        activeTags.some(activeTag => activeTag.full_path === removeTag)
      );
    }
  };

  // 模拟添加标签
  const simulateAddTag = (tag) => {
    const check = canAddTag(tag);
    if (!check.can) {
      alert(`无法添加标签: ${check.reason}`);
      return;
    }

    let newActiveTags = [...activeTags, tag];

    // 处理 attached_tags
    if (tag.attached_tags && tag.attached_tags.length > 0) {
      tag.attached_tags.forEach(attachPath => {
        const attachTag = tags.find(t => t.full_path === attachPath);
        if (attachTag && !newActiveTags.some(t => t.id === attachTag.id)) {
          const attachCheck = canAddTag(attachTag);
          if (attachCheck.can) {
            newActiveTags.push(attachTag);
          }
        }
      });
    }

    // 处理 removed_tags
    if (tag.removed_tags && tag.removed_tags.length > 0) {
      newActiveTags = newActiveTags.filter(activeTag =>
        !tag.removed_tags.includes(activeTag.full_path)
      );
    }

    // 检查所有标签的 remove_if 条件
    newActiveTags = newActiveTags.filter(activeTag => !shouldRemoveTag(activeTag));

    setActiveTags(newActiveTags);
  };

  // 移除标签
  const removeTag = (tagId) => {
    setActiveTags(activeTags.filter(t => t.id !== tagId));
  };

  // 清空所有标签
  const clearAllTags = () => {
    setActiveTags([]);
  };

  // 过滤可用标签
  const availableTags = useMemo(() => {
    return tags.filter(tag => {
      if (activeTags.some(t => t.id === tag.id)) return false;
      if (searchQuery && !tag.full_path.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tags, activeTags, searchQuery]);

  // 预览标签效果
  const previewTagEffect = (tag) => {
    const check = canAddTag(tag);
    const willAttach = tag.attached_tags || [];
    const willRemove = tag.removed_tags || [];
    const isDisabled = isTagDisabled(tag);

    return {
      tag,
      canAdd: check.can,
      reason: check.reason,
      willAttach,
      willRemove,
      isDisabled
    };
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-semibold text-white">标签模拟器 V2</span>
        <span className="text-xs text-gray-500">纯粹验证标签内部规则</span>
        
        <div className="flex-1" />

        <Input
          placeholder="实体名称"
          value={entityName}
          onChange={(e) => setEntityName(e.target.value)}
          className="h-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
        />

        <Button
          size="sm"
          onClick={clearAllTags}
          className="h-7 bg-red-900/50 hover:bg-red-900 text-red-400"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          清空
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：当前活动标签 */}
        <div className="w-96 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d]">
            <h3 className="text-sm font-semibold text-white mb-1">
              {entityName} - 活动标签
            </h3>
            <p className="text-xs text-gray-500">
              共 {activeTags.length} 个标签
            </p>
          </div>

          <div className="flex-1 overflow-auto p-3 space-y-2">
            {activeTags.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Info className="w-12 h-12 mb-2" />
                <p className="text-sm">暂无活动标签</p>
                <p className="text-xs mt-1">从右侧添加标签开始模拟</p>
              </div>
            ) : (
              activeTags.map(tag => {
                const disabled = isTagDisabled(tag);
                return (
                  <div
                    key={tag.id}
                    className={`bg-[#2d2d2d] border border-[#3d3d3d] rounded p-3 ${
                      disabled ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="w-1 h-8 rounded-full"
                          style={{ backgroundColor: getCategoryColor(tag.category_key) }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white flex items-center gap-2">
                            {tag.name}
                            {disabled && (
                              <span className="text-xs text-yellow-400">(已禁用)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">{tag.full_path}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTag(tag.id)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {tag.description && (
                      <p className="text-xs text-gray-500 mb-2">{tag.description}</p>
                    )}

                    {/* 显示规则 */}
                    {(tag.attached_tags?.length > 0 || tag.removed_tags?.length > 0) && (
                      <div className="mt-2 pt-2 border-t border-[#3d3d3d] space-y-1">
                        {tag.attached_tags?.length > 0 && (
                          <div className="text-xs text-blue-400">
                            附加: {tag.attached_tags.join(', ')}
                          </div>
                        )}
                        {tag.removed_tags?.length > 0 && (
                          <div className="text-xs text-orange-400">
                            移除: {tag.removed_tags.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 中间：可用标签列表 */}
        <div className="flex-1 bg-[#1e1e1e] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d]">
            <Input
              placeholder="搜索标签..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
            />
          </div>

          <div className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-2 gap-3">
              {availableTags.map(tag => {
                const check = canAddTag(tag);
                return (
                  <div
                    key={tag.id}
                    className={`bg-[#2d2d2d] border rounded p-3 cursor-pointer hover:border-[#0e639c] transition-colors ${
                      check.can ? 'border-[#3d3d3d]' : 'border-red-900/50 opacity-60'
                    }`}
                    onClick={() => {
                      if (check.can) {
                        simulateAddTag(tag);
                      } else {
                        setSelectedPreview(previewTagEffect(tag));
                      }
                    }}
                    onMouseEnter={() => setSelectedPreview(previewTagEffect(tag))}
                    onMouseLeave={() => setSelectedPreview(null)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-1 h-6 rounded-full"
                        style={{ backgroundColor: getCategoryColor(tag.category_key) }}
                      />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">{tag.name}</div>
                        <div className="text-xs text-gray-500 font-mono truncate">{tag.full_path}</div>
                      </div>
                      {check.can ? (
                        <Play className="w-4 h-4 text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400" />
                      )}
                    </div>

                    {!check.can && (
                      <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {check.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {availableTags.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <p className="text-sm">没有可用的标签</p>
              </div>
            )}
          </div>
        </div>

        {/* 右侧：预览面板 */}
        <div className="w-80 bg-[#252526] border-l border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d]">
            <h3 className="text-sm font-semibold text-white">效果预览</h3>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {selectedPreview ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">{selectedPreview.tag.name}</h4>
                  <p className="text-xs text-gray-400 font-mono mb-3">{selectedPreview.tag.full_path}</p>
                  
                  {selectedPreview.tag.description && (
                    <p className="text-xs text-gray-500 mb-3">{selectedPreview.tag.description}</p>
                  )}

                  {selectedPreview.canAdd ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
                      <CheckCircle2 className="w-4 h-4" />
                      可以添加
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400 text-sm mb-4">
                      <XCircle className="w-4 h-4" />
                      {selectedPreview.reason}
                    </div>
                  )}
                </div>

                {selectedPreview.willAttach.length > 0 && (
                  <div className="bg-[#1e1e1e] rounded p-3">
                    <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-2">
                      <Link className="w-3 h-3" />
                      将会附加
                    </div>
                    <div className="space-y-1">
                      {selectedPreview.willAttach.map((path, idx) => (
                        <div key={idx} className="text-xs text-gray-300 font-mono flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          {path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPreview.willRemove.length > 0 && (
                  <div className="bg-[#1e1e1e] rounded p-3">
                    <div className="flex items-center gap-2 text-orange-400 text-xs font-semibold mb-2">
                      <Trash2 className="w-3 h-3" />
                      将会移除
                    </div>
                    <div className="space-y-1">
                      {selectedPreview.willRemove.map((path, idx) => (
                        <div key={idx} className="text-xs text-gray-300 font-mono flex items-center gap-1">
                          <ArrowRight className="w-3 h-3" />
                          {path}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPreview.isDisabled && (
                  <div className="bg-yellow-900/20 border border-yellow-900/50 rounded p-3">
                    <div className="flex items-center gap-2 text-yellow-400 text-xs font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      此标签将被禁用
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Info className="w-12 h-12 mb-2" />
                <p className="text-sm text-center">悬停标签查看效果预览</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}