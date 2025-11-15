import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronRight, ChevronDown, Plus, Search, Trash2, Edit3, 
  FolderTree, Save, X, Shield, Ban, Link, Trash, Power, Eraser, Tag
} from "lucide-react";

// 规则配置组件
function InternalRuleCard({ title, description, icon, color, tags, onAdd, onRemove, placeholder, allTags, currentTagId }) {
  const [input, setInput] = useState("");

  return (
    <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={`${color} mt-1`}>{icon}</div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {(tags || []).map((tag, idx) => (
          <div key={idx} className="flex items-center justify-between bg-[#1e1e1e] px-3 py-2 rounded">
            <span className="text-sm text-gray-300 font-mono">{tag}</span>
            <button onClick={() => onRemove(idx)} className="text-gray-500 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {(!tags || tags.length === 0) && (
          <div className="text-xs text-gray-600 italic py-2 text-center">未设置规则</div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              onAdd(input.trim());
              setInput("");
            }
          }}
          placeholder={placeholder}
          className="h-8 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
          list={`rule-${title}-datalist`}
        />
        <datalist id={`rule-${title}-datalist`}>
          {(allTags || [])
            .filter(t => t.id !== currentTagId)
            .map(t => <option key={t.id} value={t.full_path} />)}
        </datalist>
        <Button
          size="sm"
          onClick={() => {
            if (input.trim()) {
              onAdd(input.trim());
              setInput("");
            }
          }}
          className="h-8 px-3 bg-[#0e639c] hover:bg-[#1177bb]"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// 条件规则配置组件
function ConditionalRuleCard({ title, description, icon, color, config, onUpdate, placeholder, allTags, currentTagId }) {
  const [input, setInput] = useState("");
  const safeConfig = config || { tags: [], match_mode: "any" };

  const handleAddTag = (tag) => {
    if (!tag.trim()) return;
    onUpdate({
      ...safeConfig,
      tags: [...(safeConfig.tags || []), tag.trim()]
    });
  };

  const handleRemoveTag = (index) => {
    onUpdate({
      ...safeConfig,
      tags: (safeConfig.tags || []).filter((_, i) => i !== index)
    });
  };

  const handleMatchModeChange = (mode) => {
    onUpdate({
      ...safeConfig,
      match_mode: mode
    });
  };

  return (
    <div className="bg-[#2d2d2d] border border-[#3d3d3d] rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <div className={`${color} mt-1`}>{icon}</div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-400 mb-1.5 block">匹配模式</label>
        <Select value={safeConfig.match_mode || "any"} onValueChange={handleMatchModeChange}>
          <SelectTrigger className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
            <SelectItem value="any" className="text-white hover:bg-[#3d3d3d]">Any - 满足任一即可</SelectItem>
            <SelectItem value="all" className="text-white hover:bg-[#3d3d3d]">All - 需满足全部</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 mb-3">
        {(safeConfig.tags || []).map((tag, idx) => (
          <div key={idx} className="flex items-center justify-between bg-[#1e1e1e] px-3 py-2 rounded">
            <span className="text-sm text-gray-300 font-mono">{tag}</span>
            <button onClick={() => handleRemoveTag(idx)} className="text-gray-500 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        {(!safeConfig.tags || safeConfig.tags.length === 0) && (
          <div className="text-xs text-gray-600 italic py-2 text-center">未设置条件</div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              handleAddTag(input.trim());
              setInput("");
            }
          }}
          placeholder={placeholder}
          className="h-8 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
          list={`cond-${title}-datalist`}
        />
        <datalist id={`cond-${title}-datalist`}>
          {(allTags || [])
            .filter(t => t.id !== currentTagId)
            .map(t => <option key={t.id} value={t.full_path} />)}
        </datalist>
        <Button
          size="sm"
          onClick={() => {
            if (input.trim()) {
              handleAddTag(input.trim());
              setInput("");
            }
          }}
          className="h-8 px-3 bg-[#0e639c] hover:bg-[#1177bb]"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TagEditorV2() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [newTagPath, setNewTagPath] = useState("");

  const queryClient = useQueryClient();

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

  const createTagMutation = useMutation({
    mutationFn: (tagData) => base44.entities.GameplayTag.create(tagData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameplayTags'] });
    },
  });

  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GameplayTag.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameplayTags'] });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id) => base44.entities.GameplayTag.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameplayTags'] });
      setSelectedTag(null);
    },
  });

  const getCategoryColor = (categoryKey) => {
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  const createTagsFromPath = async (fullPath) => {
    if (!fullPath || !fullPath.trim()) return;

    const parts = fullPath.split('.');
    const existingPaths = new Set(tags.map(t => t.full_path));

    for (let i = 0; i < parts.length; i++) {
      const currentPath = parts.slice(0, i + 1).join('.');

      if (!existingPaths.has(currentPath)) {
        const parentPath = i > 0 ? parts.slice(0, i).join('.') : "";

        await createTagMutation.mutateAsync({
          name: parts[i],
          full_path: currentPath,
          parent_path: parentPath,
          depth: i,
          category_key: "other",
          usage_count: 0,
          is_locked: false,
        });
      }
    }

    setNewTagPath("");
    parts.forEach((_, i) => {
      const path = parts.slice(0, i + 1).join('.');
      setExpandedNodes(prev => new Set([...prev, path]));
    });
  };

  const tagTree = useMemo(() => {
    const tree = [];
    const tagMap = {};

    tags.forEach(tag => {
      tagMap[tag.full_path] = { ...tag, children: [] };
    });

    tags.forEach(tag => {
      if (!tag.parent_path || tag.parent_path === "") {
        tree.push(tagMap[tag.full_path]);
      } else {
        const parent = tagMap[tag.parent_path];
        if (parent) {
          parent.children.push(tagMap[tag.full_path]);
        }
      }
    });

    return tree;
  }, [tags]);

  const filterTree = (nodes, query) => {
    if (!query) return nodes;
    return nodes.filter(node => {
      const matches = node.full_path.toLowerCase().includes(query.toLowerCase());
      const childMatches = node.children && filterTree(node.children, query).length > 0;
      return matches || childMatches;
    });
  };

  const filteredTree = useMemo(() => {
    return filterTree(tagTree, searchQuery);
  }, [tagTree, searchQuery]);

  const toggleNode = (path) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.full_path);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedTag?.id === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-[#2d2d2d] ${
            isSelected ? 'bg-[#094771]' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => setSelectedTag(node)}
        >
          <div
            className="w-1 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: getCategoryColor(node.category_key) }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleNode(node.full_path);
            }}
            className="w-4 h-4 flex items-center justify-center"
          >
            {hasChildren && (
              isExpanded ?
                <ChevronDown className="w-3 h-3 text-gray-400" /> :
                <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>

          <FolderTree className="w-4 h-4 text-[#ffd700] flex-shrink-0" />

          <span className="text-sm text-gray-200 flex-1">{node.name}</span>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleUpdateRule = (ruleType, value) => {
    if (!selectedTag) return;
    updateTagMutation.mutate({ id: selectedTag.id, data: { [ruleType]: value } });
  };

  const handleAddToRule = (ruleType, tag) => {
    if (!selectedTag || !tag) return;
    const current = selectedTag[ruleType] || [];
    updateTagMutation.mutate({
      id: selectedTag.id,
      data: { [ruleType]: [...current, tag] }
    });
  };

  const handleRemoveFromRule = (ruleType, index) => {
    if (!selectedTag) return;
    const current = selectedTag[ruleType] || [];
    updateTagMutation.mutate({
      id: selectedTag.id,
      data: { [ruleType]: current.filter((_, i) => i !== index) }
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Tag className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">标签编辑器 V2</span>
        <span className="text-xs text-gray-500">专注标签内在属性</span>
        
        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 w-64 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧标签树 */}
        <div className="w-96 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          <div className="p-3 border-b border-[#3d3d3d]">
            <div className="flex gap-2">
              <Input
                placeholder="输入标签路径创建"
                value={newTagPath}
                onChange={(e) => setNewTagPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') createTagsFromPath(newTagPath);
                }}
                className="flex-1 h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
              />
              <Button
                size="sm"
                onClick={() => createTagsFromPath(newTagPath)}
                className="h-8 bg-[#0e639c] hover:bg-[#1177bb]"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {filteredTree.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                {searchQuery ? '没有匹配的标签' : '暂无标签'}
              </div>
            ) : (
              <div className="py-2">
                {filteredTree.map(node => renderNode(node))}
              </div>
            )}
          </div>

          <div className="h-8 bg-[#2d2d2d] border-t border-[#3d3d3d] flex items-center px-3 text-xs text-gray-400">
            总计: {tags.length} 个标签
          </div>
        </div>

        {/* 右侧详情面板 */}
        <div className="flex-1 bg-[#1e1e1e] overflow-auto">
          {selectedTag ? (
            <div className="p-6">
              {/* 基础信息 */}
              <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg p-4 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">{selectedTag.name}</h2>
                    <p className="text-sm text-gray-400 font-mono">{selectedTag.full_path}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => deleteTagMutation.mutate(selectedTag.id)}
                    className="bg-red-900/50 hover:bg-red-900 text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">分类</label>
                    <Select
                      value={selectedTag.category_key || "other"}
                      onValueChange={(value) => {
                        updateTagMutation.mutate({
                          id: selectedTag.id,
                          data: { category_key: value }
                        });
                      }}
                    >
                      <SelectTrigger className="h-9 bg-[#1e1e1e] border-[#3d3d3d] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                        {categories.map(cat => (
                          <SelectItem key={cat.key} value={cat.key} className="text-white hover:bg-[#3d3d3d]">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 block">描述</label>
                    <Textarea
                      value={selectedTag.description || ""}
                      onChange={(e) => {
                        updateTagMutation.mutate({
                          id: selectedTag.id,
                          data: { description: e.target.value }
                        });
                      }}
                      placeholder="标签描述..."
                      className="h-9 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* 标签内部规则 */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  标签内部规则
                  <span className="text-xs font-normal text-gray-500">（定义此标签自身的存在条件和影响）</span>
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <InternalRuleCard
                    title="必需标签"
                    description="添加此标签前，实体必须拥有以下标签"
                    icon={<Shield className="w-5 h-5" />}
                    color="text-green-400"
                    tags={selectedTag.required_tags}
                    onAdd={(tag) => handleAddToRule('required_tags', tag)}
                    onRemove={(idx) => handleRemoveFromRule('required_tags', idx)}
                    placeholder="输入必需标签路径"
                    allTags={tags}
                    currentTagId={selectedTag.id}
                  />

                  <InternalRuleCard
                    title="阻止标签"
                    description="添加此标签前，实体不能拥有以下标签"
                    icon={<Ban className="w-5 h-5" />}
                    color="text-red-400"
                    tags={selectedTag.blocked_tags}
                    onAdd={(tag) => handleAddToRule('blocked_tags', tag)}
                    onRemove={(idx) => handleRemoveFromRule('blocked_tags', idx)}
                    placeholder="输入阻止标签路径"
                    allTags={tags}
                    currentTagId={selectedTag.id}
                  />

                  <InternalRuleCard
                    title="附加标签"
                    description="添加此标签时，自动附加以下标签"
                    icon={<Link className="w-5 h-5" />}
                    color="text-blue-400"
                    tags={selectedTag.attached_tags}
                    onAdd={(tag) => handleAddToRule('attached_tags', tag)}
                    onRemove={(idx) => handleRemoveFromRule('attached_tags', idx)}
                    placeholder="输入附加标签路径"
                    allTags={tags}
                    currentTagId={selectedTag.id}
                  />

                  <InternalRuleCard
                    title="移除标签"
                    description="添加此标签时，自动移除以下标签"
                    icon={<Trash className="w-5 h-5" />}
                    color="text-orange-400"
                    tags={selectedTag.removed_tags}
                    onAdd={(tag) => handleAddToRule('removed_tags', tag)}
                    onRemove={(idx) => handleRemoveFromRule('removed_tags', idx)}
                    placeholder="输入移除标签路径"
                    allTags={tags}
                    currentTagId={selectedTag.id}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <ConditionalRuleCard
                    title="禁用条件"
                    description="当实体拥有以下标签时，此标签自动禁用"
                    icon={<Power className="w-5 h-5" />}
                    color="text-yellow-400"
                    config={selectedTag.disabled_if_tags}
                    onUpdate={(config) => handleUpdateRule('disabled_if_tags', config)}
                    placeholder="输入禁用条件标签"
                    allTags={tags}
                    currentTagId={selectedTag.id}
                  />

                  <ConditionalRuleCard
                    title="移除条件"
                    description="当实体拥有以下标签时，此标签自动移除"
                    icon={<Eraser className="w-5 h-5" />}
                    color="text-purple-400"
                    config={selectedTag.remove_if_tags}
                    onUpdate={(config) => handleUpdateRule('remove_if_tags', config)}
                    placeholder="输入移除条件标签"
                    allTags={tags}
                    currentTagId={selectedTag.id}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Tag className="w-16 h-16 mb-4 text-gray-700" />
              <p className="text-sm">选择一个标签开始编辑</p>
              <p className="text-xs text-gray-600 mt-2">专注于配置标签的内在属性和规则</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}