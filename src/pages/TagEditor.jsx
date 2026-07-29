import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronRight, ChevronDown, Plus,
  Search, Trash2, Edit3, Copy, FolderTree, GripVertical, Save, X, MoveUp,
  List, Network, CheckSquare, Square, Lock, Unlock, Download, Upload, Palette, Settings,
  Shield, Ban, Link, Trash, Power, Eraser, Zap
} from "lucide-react";
import GraphView from "../components/tagEditor/GraphView";
import CategoryManager from "../components/tagEditor/CategoryManager";
import TagCountEventPanel from "../components/tag/TagCountEventPanel";

// 简单规则组件
function SimpleRuleSection({ type, icon, title, description, color, tags, inputValue, onAddTag, onRemoveTag, onInputChange, allTags, currentTagId }) {
  return (
    <div className="border border-[#262626] rounded p-3 bg-[#0a0a0a]">
      <div className="flex items-start gap-2 mb-2">
        <div className={`mt-0.5 ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#e5e5e5]">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="space-y-1 mb-2">
        {(tags || []).map((t, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-[#141414] px-2 py-1 rounded text-xs border border-[#262626]"
          >
            <span className="text-gray-300 font-mono">{t}</span>
            <button
              onClick={() => onRemoveTag(index)}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {(!tags || tags.length === 0) && (
          <div className="text-xs text-gray-600 italic py-1">未设置</div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAddTag();
          }}
          placeholder="输入标签路径"
          className="h-7 flex-1 bg-[#141414] border-[#262626] text-sm text-[#e5e5e5]"
          list={`${type}-suggestions`}
        />
        <datalist id={`${type}-suggestions`}>
          {(allTags || [])
            .filter(t => t.id !== currentTagId)
            .map(t => (
              <option key={t.id} value={t.full_path} />
            ))}
        </datalist>
        <Button
          size="sm"
          onClick={onAddTag}
          className="h-7 px-2 bg-[#f97316] hover:bg-[#ea580c] text-black"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

// 条件规则组件
function ConditionalRuleSection({ type, icon, title, description, color, config, inputValue, onAddTag, onRemoveTag, onInputChange, onMatchModeChange, allTags, currentTagId }) {
  const safeConfig = config || { tags: [], match_mode: "any" };
  
  return (
    <div className="border border-[#262626] rounded p-3 bg-[#0a0a0a]">
      <div className="flex items-start gap-2 mb-2">
        <div className={`mt-0.5 ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-[#e5e5e5]">{title}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="mb-2">
        <label className="text-xs text-gray-500 mb-1 block">匹配模式</label>
        <Select
          value={safeConfig.match_mode || "any"}
          onValueChange={onMatchModeChange}
        >
          <SelectTrigger className="h-7 bg-[#141414] border-[#262626] text-[#e5e5e5] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-[#262626]">
            <SelectItem value="any" className="text-[#e5e5e5] hover:bg-[#262626] text-xs">
              Any（满足任一即可）
            </SelectItem>
            <SelectItem value="all" className="text-[#e5e5e5] hover:bg-[#262626] text-xs">
              All（需满足全部）
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 mb-2">
        {(safeConfig.tags || []).map((t, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-[#141414] px-2 py-1 rounded text-xs border border-[#262626]"
          >
            <span className="text-gray-300 font-mono">{t}</span>
            <button
              onClick={() => onRemoveTag(index)}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {(!safeConfig.tags || safeConfig.tags.length === 0) && (
          <div className="text-xs text-gray-600 italic py-1">未设置</div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAddTag();
          }}
          placeholder="输入标签路径"
          className="h-7 flex-1 bg-[#141414] border-[#262626] text-sm text-[#e5e5e5]"
          list={`${type}-suggestions-cond`}
        />
        <datalist id={`${type}-suggestions-cond`}>
          {(allTags || [])
            .filter(t => t.id !== currentTagId)
            .map(t => (
              <option key={t.id} value={t.full_path} />
            ))}
        </datalist>
        <Button
          size="sm"
          onClick={onAddTag}
          className="h-7 px-2 bg-[#f97316] hover:bg-[#ea580c] text-black"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}

export default function TagEditor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagPath, setNewTagPath] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedTag, setSelectedTag] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [editingTag, setEditingTag] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [draggedTag, setDraggedTag] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [localTags, setLocalTags] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isDraggingOverRoot, setIsDraggingOverRoot] = useState(false);
  const [viewMode, setViewMode] = useState('tree');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showEventPanel, setShowEventPanel] = useState(false);


  // 规则输入状态
  const [ruleInputs, setRuleInputs] = useState({
    required: "",
    blocked: "",
    attached: "",
    removed: "",
    disabled_if: "",
    remove_if: "",
  });

  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['tagCategories'],
    queryFn: () => base44.entities.TagCategory.list(),
    initialData: [],
  });

  useEffect(() => {
    setLocalTags(tags);
    setHasUnsavedChanges(false);
  }, [tags]);

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
    if (!categories || !Array.isArray(categories)) return '#94a3b8';
    const category = categories.find(c => c.key === categoryKey);
    return category?.color || '#94a3b8';
  };

  // 规则更新处理
  const handleAddTag = (type, value) => {
    if (!value.trim() || !selectedTag) return;

    const updates = {};

    if (type === 'required') {
      updates.required_tags = [...(selectedTag.required_tags || []), value.trim()];
    } else if (type === 'blocked') {
      updates.blocked_tags = [...(selectedTag.blocked_tags || []), value.trim()];
    } else if (type === 'attached') {
      updates.attached_tags = [...(selectedTag.attached_tags || []), value.trim()];
    } else if (type === 'removed') {
      updates.removed_tags = [...(selectedTag.removed_tags || []), value.trim()];
    } else if (type === 'disabled_if') {
      const current = selectedTag.disabled_if_tags || { tags: [], match_mode: "any" };
      updates.disabled_if_tags = {
        ...current,
        tags: [...current.tags, value.trim()]
      };
    } else if (type === 'remove_if') {
      const current = selectedTag.remove_if_tags || { tags: [], match_mode: "any" };
      updates.remove_if_tags = {
        ...current,
        tags: [...current.tags, value.trim()]
      };
    }

    updateTagMutation.mutate({ id: selectedTag.id, data: updates });
    setRuleInputs({ ...ruleInputs, [type]: "" });
  };

  const handleRemoveTag = (type, index) => {
    if (!selectedTag) return;

    const updates = {};

    if (type === 'required') {
      updates.required_tags = (selectedTag.required_tags || []).filter((_, i) => i !== index);
    } else if (type === 'blocked') {
      updates.blocked_tags = (selectedTag.blocked_tags || []).filter((_, i) => i !== index);
    } else if (type === 'attached') {
      updates.attached_tags = (selectedTag.attached_tags || []).filter((_, i) => i !== index);
    } else if (type === 'removed') {
      updates.removed_tags = (selectedTag.removed_tags || []).filter((_, i) => i !== index);
    } else if (type === 'disabled_if') {
      const current = selectedTag.disabled_if_tags || { tags: [], match_mode: "any" };
      updates.disabled_if_tags = {
        ...current,
        tags: current.tags.filter((_, i) => i !== index)
      };
    } else if (type === 'remove_if') {
      const current = selectedTag.remove_if_tags || { tags: [], match_mode: "any" };
      updates.remove_if_tags = {
        ...current,
        tags: current.tags.filter((_, i) => i !== index)
      };
    }

    updateTagMutation.mutate({ id: selectedTag.id, data: updates });
  };

  const handleMatchModeChange = (type, mode) => {
    if (!selectedTag) return;

    const updates = {};

    if (type === 'disabled_if') {
      const current = selectedTag.disabled_if_tags || { tags: [], match_mode: "any" };
      updates.disabled_if_tags = { ...current, match_mode: mode };
    } else if (type === 'remove_if') {
      const current = selectedTag.remove_if_tags || { tags: [], match_mode: "any" };
      updates.remove_if_tags = { ...current, match_mode: mode };
    }

    updateTagMutation.mutate({ id: selectedTag.id, data: updates });
  };

  // 导入导出功能
  const exportToJSON = () => {
    const data = JSON.stringify(tags, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gameplaytags_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);

    try {
      const text = await file.text();
      const importedTags = JSON.parse(text);

      const existingPaths = new Set(tags.map(t => t.full_path));
      const toCreate = importedTags.filter(tag => !existingPaths.has(tag.full_path));

      if (toCreate.length === 0) {
        alert('没有找到新的标签需要导入');
        setImporting(false);
        return;
      }

      const creates = toCreate.map(tag =>
        base44.entities.GameplayTag.create({
          name: tag.name,
          full_path: tag.full_path,
          parent_path: tag.parent_path || "",
          depth: tag.depth || 0,
          category_key: tag.category_key || "other",
          description: tag.description || "",
          is_locked: tag.is_locked || false,
          usage_count: 0,
        })
      );

      await Promise.all(creates);
      queryClient.invalidateQueries({ queryKey: ['gameplayTags'] });
      alert(`成功导入 ${toCreate.length} 个标签`);
    } catch (err) {
      alert(`导入失败: ${err.message}`);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        document.querySelector('input[placeholder*="输入标签路径"]')?.focus();
      }

      if (e.key === 'F2' && selectedTag) {
        e.preventDefault();
        handleRename(selectedTag);
      }

      if (e.key === 'Delete' && selectedTag && !editingTag) {
        e.preventDefault();
        handleDelete(selectedTag);
      }

      if (e.ctrlKey && e.key === 's' && hasUnsavedChanges) {
        e.preventDefault();
        handleSaveChanges();
      }

      if (e.key === 'Escape') {
        if (editingTag) {
          setEditingTag(null);
        } else if (isMultiSelectMode) {
          setIsMultiSelectMode(false);
          setSelectedTags(new Set());
        }
      }

      if (e.ctrlKey && e.key === 'a' && isMultiSelectMode) {
        e.preventDefault();
        setSelectedTags(new Set(localTags.map(t => t.id)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTag, editingTag, hasUnsavedChanges, isMultiSelectMode, localTags]);

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

  const updateChildrenPaths = (tags, oldParentPath, newParentPath) => {
    return tags.map(tag => {
      if (tag.full_path === oldParentPath) {
        return tag;
      }

      if (tag.full_path.startsWith(oldParentPath + '.')) {
        const suffix = tag.full_path.substring(oldParentPath.length);
        const newFullPath = newParentPath + suffix;
        const newDepth = newFullPath.split('.').length - 1;
        const parts = newFullPath.split('.');
        const newParentPathForTag = parts.slice(0, -1).join('.');

        return {
          ...tag,
          full_path: newFullPath,
          parent_path: newParentPathForTag,
          depth: newDepth,
        };
      }

      return tag;
    });
  };

  const tagTree = useMemo(() => {
    const tree = [];
    const tagMap = {};

    localTags.forEach(tag => {
      tagMap[tag.full_path] = { ...tag, children: [] };
    });

    localTags.forEach(tag => {
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
  }, [localTags]);

  const filterTree = (nodes, query) => {
    if (!query) {
      return nodes;
    }

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

  const handleContextMenu = (e, tag) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tag: tag,
    });
  };

  const handleRename = (tag) => {
    setEditingTag(tag.id);
    setEditValue(tag.name);
    setContextMenu(null);
  };

  const handleSaveRename = async (tag) => {
    if (editValue && editValue !== tag.name) {
      const newFullPath = tag.parent_path
        ? `${tag.parent_path}.${editValue}`
        : editValue;

      await updateTagMutation.mutateAsync({
        id: tag.id,
        data: {
          name: editValue,
          full_path: newFullPath,
        }
      });
    }
    setEditingTag(null);
  };

  const handleDelete = async (tag) => {
    if (window.confirm(`删除 "${tag.full_path}" 吗？`)) {
      await deleteTagMutation.mutate(tag.id);
    }
    setContextMenu(null);
  };

  const handleDuplicate = async (tag) => {
    const newName = `${tag.name}_Copy`;
    const newFullPath = tag.parent_path
      ? `${tag.parent_path}.${newName}`
      : newName;

    await createTagMutation.mutateAsync({
      ...tag,
      id: undefined,
      name: newName,
      full_path: newFullPath,
    });
    setContextMenu(null);
  };

  const handleBatchDelete = async () => {
    if (selectedTags.size === 0) return;
    if (!window.confirm(`确定要删除 ${selectedTags.size} 个标签吗？`)) return;

    const deletes = Array.from(selectedTags).map(id => deleteTagMutation.mutateAsync(id));
    await Promise.all(deletes);
    setSelectedTags(new Set());
    setIsMultiSelectMode(false);
  };

  const handleBatchLock = async (lock) => {
    if (selectedTags.size === 0) return;

    const updates = Array.from(selectedTags).map(id =>
      updateTagMutation.mutateAsync({
        id,
        data: { is_locked: lock }
      })
    );
    await Promise.all(updates);
  };

  const toggleTagSelection = (tagId) => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const handleDragStart = (e, tag) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTag(tag);
  };

  const handleDragOver = (e, tag) => {
    e.preventDefault();

    if (!draggedTag || !tag) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    if (tag.id === draggedTag.id) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    if (tag.full_path.startsWith(draggedTag.full_path + '.')) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }

    e.dataTransfer.dropEffect = 'move';
    setDropTarget(tag);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e, targetTag) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedTag || !targetTag || draggedTag.id === targetTag.id) {
      setDraggedTag(null);
      setDropTarget(null);
      return;
    }

    if (targetTag.full_path.startsWith(draggedTag.full_path + '.')) {
      setDraggedTag(null);
      setDropTarget(null);
      return;
    }

    const newParentPath = targetTag.full_path;
    const newFullPath = `${newParentPath}.${draggedTag.name}`;
    const newDepth = newFullPath.split('.').length - 1;

    let updatedTags = localTags.map(tag => {
      if (tag.id === draggedTag.id) {
        return {
          ...tag,
          parent_path: newParentPath,
          full_path: newFullPath,
          depth: newDepth,
        };
      }
      return tag;
    });

    updatedTags = updateChildrenPaths(updatedTags, draggedTag.full_path, newFullPath);

    setLocalTags(updatedTags);
    setHasUnsavedChanges(true);
    setExpandedNodes(prev => new Set([...prev, targetTag.full_path]));
    setDraggedTag(null);
    setDropTarget(null);
  };

  const handleRootDragOver = (e) => {
    e.preventDefault();
    if (draggedTag) {
      e.dataTransfer.dropEffect = 'move';
      setIsDraggingOverRoot(true);
    }
  };

  const handleRootDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDraggingOverRoot(false);
    }
  };

  const handleDropToRoot = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDraggingOverRoot(false);

    if (!draggedTag) return;

    if (!draggedTag.parent_path || draggedTag.parent_path === "") {
      setDraggedTag(null);
      setDropTarget(null);
      return;
    }

    const newFullPath = draggedTag.name;
    const newDepth = 0;

    let updatedTags = localTags.map(tag => {
      if (tag.id === draggedTag.id) {
        return {
          ...tag,
          parent_path: "",
          full_path: newFullPath,
          depth: newDepth,
        };
      }
      return tag;
    });

    updatedTags = updateChildrenPaths(updatedTags, draggedTag.full_path, newFullPath);

    setLocalTags(updatedTags);
    setHasUnsavedChanges(true);
    setDraggedTag(null);
    setDropTarget(null);
  };

  const handleSaveChanges = async () => {
    const modifiedTags = localTags.filter(localTag => {
      const originalTag = tags.find(t => t.id === localTag.id);
      if (!originalTag) return false;

      return localTag.full_path !== originalTag.full_path ||
             localTag.parent_path !== originalTag.parent_path ||
             localTag.depth !== originalTag.depth;
    });

    const updates = modifiedTags.map(tag =>
      updateTagMutation.mutateAsync({
        id: tag.id,
        data: {
          full_path: tag.full_path,
          parent_path: tag.parent_path,
          depth: tag.depth,
        }
      })
    );

    await Promise.all(updates);
    setHasUnsavedChanges(false);
  };

  const handleDiscardChanges = () => {
    setLocalTags(tags);
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedNodes.has(node.full_path);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedTag?.id === node.id;
    const isEditing = editingTag === node.id;
    const isDragTarget = dropTarget?.id === node.id;
    const isDragging = draggedTag?.id === node.id;
    const isMultiSelected = selectedTags.has(node.id);

    const originalTag = tags.find(t => t.id === node.id);
    const isModified = originalTag && (
      node.full_path !== originalTag.full_path ||
      node.parent_path !== originalTag.parent_path
    );

    return (
      <div key={node.id}>
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragEnd={() => {
            setDraggedTag(null);
            setDropTarget(null);
            setIsDraggingOverRoot(false);
          }}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          className={`flex items-center gap-1 py-1 px-2 cursor-pointer group relative ${
            isDragging ? 'opacity-40' :
            isSelected ? 'bg-[#f97316]/20 border-l-2 border-[#f97316]' :
            isDragTarget ? 'bg-[#f97316]/40' :
            isMultiSelected ? 'bg-[#f97316]/30' :
            'hover:bg-[#141414]'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={(e) => {
            if (isMultiSelectMode) {
              toggleTagSelection(node.id);
            } else {
              setSelectedTag(node);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          {isModified && (
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-500" />
          )}

          <div
            className="w-1 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: getCategoryColor(node.category_key) }}
          />

          {isMultiSelectMode && (
            <div onClick={(e) => e.stopPropagation()}>
              {isMultiSelected ?
                <CheckSquare className="w-4 h-4 text-blue-400" onClick={() => toggleTagSelection(node.id)} /> :
                <Square className="w-4 h-4 text-gray-600" onClick={() => toggleTagSelection(node.id)} />
              }
            </div>
          )}

          <GripVertical className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleNode(node.full_path);
            }}
            className="w-4 h-4 flex items-center justify-center hover:bg-[#3d3d3d] flex-shrink-0"
          >
            {hasChildren && (
              isExpanded ?
                <ChevronDown className="w-3 h-3 text-gray-400" /> :
                <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>

          <FolderTree className="w-4 h-4 text-[#ffd700] flex-shrink-0" />

          {node.is_locked && (
            <Lock className="w-3 h-3 text-red-400 flex-shrink-0" />
          )}

          {isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => handleSaveRename(node)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(node);
                if (e.key === 'Escape') setEditingTag(null);
              }}
              autoFocus
              className="h-5 text-sm bg-[#141414] border-[#f97316] text-[#e5e5e5] px-1 flex-1"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`text-sm select-none flex-1 ${isModified ? 'text-yellow-400' : 'text-gray-200'}`}>
              {node.name}
              {node.usage_count > 0 && (
                <span className="text-xs text-gray-500 ml-2">({node.usage_count})</span>
              )}
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-[#e5e5e5]">
      {/* 顶部工具栏 - 移动端适配 */}
      <div className="h-12 bg-[#141414] border-b border-[#262626] flex items-center px-2 md:px-4 gap-1 md:gap-3 overflow-x-auto">
        {/* 视图切换 */}
        <div className="flex gap-1 bg-[#0a0a0a] rounded p-1 border border-[#262626]">
          <Button
            size="sm"
            variant={viewMode === 'tree' ? 'default' : 'ghost'}
            onClick={() => setViewMode('tree')}
            className={`h-6 px-2 md:px-3 text-xs ${viewMode === 'tree' ? 'bg-[#f97316] text-black hover:bg-[#ea580c]' : 'text-gray-400 hover:bg-[#262626] hover:text-white'}`}
          >
            <List className="w-3 h-3 md:mr-1" />
            <span className="hidden md:inline">树形</span>
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'graph' ? 'default' : 'ghost'}
            onClick={() => setViewMode('graph')}
            className={`h-6 px-2 md:px-3 text-xs ${viewMode === 'graph' ? 'bg-[#f97316] text-black hover:bg-[#ea580c]' : 'text-gray-400 hover:bg-[#262626] hover:text-white'}`}
          >
            <Network className="w-3 h-3 md:mr-1" />
            <span className="hidden md:inline">图形</span>
          </Button>
        </div>

        {/* 工具按钮 - 隐藏部分移动端 */}
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowCategoryManager(true)}
          className="h-6 px-2 md:px-3 text-xs bg-[#141414] border-[#262626] hover:bg-[#262626] text-gray-300 hidden md:flex"
        >
          <Palette className="w-3 h-3 md:mr-1" />
          <span className="hidden md:inline">分类</span>
        </Button>

        <div className="flex gap-1 hidden md:flex">
          <Button
            size="sm"
            variant="outline"
            onClick={exportToJSON}
            className="h-6 px-2 bg-[#141414] border-[#262626] hover:bg-[#262626] text-gray-300"
            title="导出"
          >
            <Download className="w-3 h-3" />
          </Button>
          <label>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              className="h-6 px-2 bg-[#141414] border-[#262626] hover:bg-[#262626] text-gray-300"
              disabled={importing}
              onClick={(e) => e.currentTarget.previousElementSibling.click()}
              title="导入"
            >
              <Upload className="w-3 h-3" />
            </Button>
          </label>
        </div>

        {viewMode === 'tree' && (
          <Button
            size="sm"
            variant={isMultiSelectMode ? 'default' : 'outline'}
            onClick={() => {
              setIsMultiSelectMode(!isMultiSelectMode);
              if (isMultiSelectMode) {
                setSelectedTags(new Set());
              }
            }}
            className={`h-6 px-2 md:px-3 text-xs hidden md:flex ${isMultiSelectMode ? 'bg-[#f97316] text-black' : 'bg-[#141414] border-[#262626] text-gray-300'}`}
          >
            {isMultiSelectMode ? <CheckSquare className="w-3 h-3 md:mr-1" /> : <Square className="w-3 h-3 md:mr-1" />}
            <span className="hidden md:inline">批量</span>
          </Button>
        )}

        {isMultiSelectMode && selectedTags.size > 0 && (
          <div className="flex gap-1 md:gap-2">
            <span className="text-xs text-gray-400 flex items-center whitespace-nowrap">
              {selectedTags.size}
            </span>
            <Button
              size="sm"
              onClick={() => handleBatchLock(true)}
              className="h-6 px-1.5 md:px-2 bg-[#141414] hover:bg-[#262626] text-xs text-gray-300"
            >
              <Lock className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              onClick={() => handleBatchLock(false)}
              className="h-6 px-1.5 md:px-2 bg-[#141414] hover:bg-[#262626] text-xs text-gray-300"
            >
              <Unlock className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              onClick={handleBatchDelete}
              className="h-6 px-1.5 md:px-2 bg-red-900/20 hover:bg-red-900/40 text-xs text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}

        {hasUnsavedChanges && (
          <div className="flex items-center gap-1 md:gap-2 hidden md:flex">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-400 whitespace-nowrap hidden lg:inline">未保存</span>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="h-6 px-2 md:px-3 bg-[#f97316] hover:bg-[#ea580c] text-black text-xs"
            >
              <Save className="w-3 h-3 md:mr-1" />
              <span className="hidden md:inline">保存</span>
            </Button>
            <Button
              size="sm"
              onClick={handleDiscardChanges}
              variant="outline"
              className="h-6 px-2 md:px-3 bg-[#141414] border-[#262626] hover:bg-[#262626] text-xs text-gray-300"
            >
              <X className="w-3 h-3 md:mr-1" />
              <span className="hidden md:inline">撤销</span>
            </Button>
          </div>
        )}

        <div className="flex-1" />

        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-8 w-48 lg:w-64 bg-[#0a0a0a] border-[#262626] text-sm text-[#e5e5e5]"
          />
        </div>

        <div className="text-xs text-gray-500 hidden lg:block whitespace-nowrap">
          Ctrl+N | F2 | Del | Ctrl+S
        </div>
      </div>

      {/* 移动端搜索和工具栏 */}
      <div className="md:hidden px-2 py-2 bg-[#141414] border-b border-[#262626] space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 w-full bg-[#0a0a0a] border-[#262626] text-sm text-[#e5e5e5]"
          />
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-400 flex-1">有未保存的更改</span>
            <Button size="sm" onClick={handleSaveChanges} className="h-6 px-2 bg-[#f97316] text-black text-xs">
              <Save className="w-3 h-3 mr-1" />保存
            </Button>
            <Button size="sm" onClick={handleDiscardChanges} className="h-6 px-2 bg-[#141414] border border-[#262626] text-xs">
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        {viewMode === 'tree' ? (
          <>
            {/* 左侧树形视图 */}
            <div className="w-full md:w-96 bg-[#141414] border-b md:border-r md:border-b-0 border-[#262626] flex flex-col max-h-[40vh] md:max-h-none">
              <div className="p-2 md:p-3 border-b border-[#262626]">
                <div className="flex gap-2">
                  <Input
                    placeholder="输入标签路径"
                    value={newTagPath}
                    onChange={(e) => setNewTagPath(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') createTagsFromPath(newTagPath);
                    }}
                    className="flex-1 h-8 bg-[#0a0a0a] border-[#262626] text-sm text-[#e5e5e5]"
                  />
                  <Button
                    size="sm"
                    onClick={() => createTagsFromPath(newTagPath)}
                    className="h-8 bg-[#f97316] hover:bg-[#ea580c] text-black"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1 hidden md:block">
                  拖拽标签调整层级，拖到下方空白区域移至根级
                </p>
              </div>

              <div
                className="flex-1 overflow-auto relative"
                onDragOver={handleRootDragOver}
                onDragLeave={handleRootDragLeave}
                onDrop={handleDropToRoot}
              >
                {isLoading ? (
                  <div className="p-4 text-sm text-gray-500">加载中...</div>
                ) : filteredTree.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500">
                    {searchQuery ? '没有匹配的标签' : '暂无标签，输入路径创建'}
                  </div>
                ) : (
                  <>
                    <div className="py-2">
                      {filteredTree.map(node => renderNode(node))}
                    </div>

                    {draggedTag && isDraggingOverRoot && (
                      <div className="sticky bottom-0 left-0 right-0 mt-4 mx-3 mb-3 p-4 border-2 border-dashed border-orange-500 bg-[#f97316]/20 rounded flex items-center justify-center gap-2">
                        <MoveUp className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-orange-300 font-medium">松开鼠标移至根级</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="h-8 bg-[#141414] border-t border-[#262626] flex items-center px-3 text-xs text-gray-400">
                总计: {localTags.length} 个标签
                {hasUnsavedChanges && (
                  <span className="ml-3 text-yellow-400 hidden md:inline">
                    • 有未保存的更改
                  </span>
                )}
              </div>
            </div>

            {/* 右侧详情面板 */}
            <div className="flex-1 bg-[#0a0a0a] overflow-auto p-2 md:p-4">
              {selectedTag ? (
                <div className="space-y-4">
                  {/* Header - 移动端单栏布局 */}
                  <div className="p-3 bg-[#141414] border border-[#262626] rounded">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 左栏 */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h2 className="text-base font-semibold text-[#e5e5e5] mb-0.5">
                              {selectedTag.name}
                            </h2>
                            <p className="text-xs text-gray-400 font-mono break-all">{selectedTag.full_path}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs pt-2 border-t border-[#262626]">
                          <div>
                            <span className="text-gray-500">父级:</span>
                            <span className="ml-1 text-gray-300 truncate">{selectedTag.parent_path || "(根级)"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">深度:</span>
                            <span className="ml-1 text-gray-300">{selectedTag.depth}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">使用:</span>
                            <span className="ml-1 text-gray-300">{selectedTag.usage_count || 0}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRename(selectedTag)}
                            className="h-6 text-xs bg-[#141414] border-[#262626] hover:bg-[#262626] text-gray-300"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            重命名
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(selectedTag)}
                            className="h-6 text-xs bg-[#141414] border-[#262626] hover:bg-[#5a1e1e] text-red-400"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            删除
                          </Button>
                          <button
                            onClick={() => setShowEventPanel(!showEventPanel)}
                            className="h-6 px-2 text-xs text-gray-300 hover:text-yellow-400 transition-colors border border-[#262626] rounded hover:bg-[#262626] flex items-center gap-1"
                            title="事件"
                          >
                            <Zap className="w-3 h-3" />
                            <span className="hidden md:inline">事件</span>
                          </button>
                        </div>
                      </div>

                      {/* 右栏 */}
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">分类</label>
                          <Select
                            value={selectedTag.category_key || "other"}
                            onValueChange={(value) => {
                              updateTagMutation.mutate({
                                id: selectedTag.id,
                                data: { category_key: value }
                              });
                            }}
                          >
                            <SelectTrigger className="h-7 bg-[#0a0a0a] border-[#262626] text-[#e5e5e5] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#141414] border-[#262626]">
                              {categories.map(cat => (
                                <SelectItem key={cat.key} value={cat.key} className="text-[#e5e5e5] hover:bg-[#262626] text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: cat.color }} />
                                    <span>{cat.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-xs text-gray-400 mb-1 block">描述</label>
                          <Input
                            value={selectedTag.description || ""}
                            onChange={(e) => {
                              updateTagMutation.mutate({
                                id: selectedTag.id,
                                data: { description: e.target.value }
                              });
                            }}
                            placeholder="添加描述..."
                            className="h-7 bg-[#0a0a0a] border-[#262626] text-xs text-[#e5e5e5]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 事件面板 */}
                  {showEventPanel && (
                    <div className="p-3 bg-[#141414] border border-[#262626] rounded">
                      <TagCountEventPanel tagPath={selectedTag.full_path} />
                    </div>
                  )}

                  {/* 规则布局 - 移动端单栏 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* 第一栏：验证规则 */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-300 px-1">验证规则</h3>

                      <SimpleRuleSection
                        type="required"
                        icon={<Shield className="w-4 h-4" />}
                        title="必需标签"
                        description="附加前必须存在"
                        color="text-green-400"
                        tags={selectedTag.required_tags}
                        inputValue={ruleInputs.required}
                        onAddTag={() => handleAddTag('required', ruleInputs.required)}
                        onRemoveTag={(index) => handleRemoveTag('required', index)}
                        onInputChange={(value) => setRuleInputs({ ...ruleInputs, required: value })}
                        allTags={localTags}
                        currentTagId={selectedTag.id}
                      />

                      <SimpleRuleSection
                        type="blocked"
                        icon={<Ban className="w-4 h-4" />}
                        title="阻止标签"
                        description="附加前不能存在"
                        color="text-red-400"
                        tags={selectedTag.blocked_tags}
                        inputValue={ruleInputs.blocked}
                        onAddTag={() => handleAddTag('blocked', ruleInputs.blocked)}
                        onRemoveTag={(index) => handleRemoveTag('blocked', index)}
                        onInputChange={(value) => setRuleInputs({ ...ruleInputs, blocked: value })}
                        allTags={localTags}
                        currentTagId={selectedTag.id}
                      />
                    </div>

                    {/* 第二栏：附加移除 */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-300 px-1">附加移除</h3>

                      <SimpleRuleSection
                        type="attached"
                        icon={<Link className="w-4 h-4" />}
                        title="附加标签"
                        description="附加后同步添加"
                        color="text-blue-400"
                        tags={selectedTag.attached_tags}
                        inputValue={ruleInputs.attached}
                        onAddTag={() => handleAddTag('attached', ruleInputs.attached)}
                        onRemoveTag={(index) => handleRemoveTag('attached', index)}
                        onInputChange={(value) => setRuleInputs({ ...ruleInputs, attached: value })}
                        allTags={localTags}
                        currentTagId={selectedTag.id}
                      />

                      <SimpleRuleSection
                        type="removed"
                        icon={<Trash className="w-4 h-4" />}
                        title="移除标签"
                        description="附加后从目标移除"
                        color="text-orange-400"
                        tags={selectedTag.removed_tags}
                        inputValue={ruleInputs.removed}
                        onAddTag={() => handleAddTag('removed', ruleInputs.removed)}
                        onRemoveTag={(index) => handleRemoveTag('removed', index)}
                        onInputChange={(value) => setRuleInputs({ ...ruleInputs, removed: value })}
                        allTags={localTags}
                        currentTagId={selectedTag.id}
                      />
                    </div>

                    {/* 第三栏：条件规则 */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-300 px-1">禁用移除条件</h3>

                      <ConditionalRuleSection
                        type="disabled_if"
                        icon={<Power className="w-4 h-4" />}
                        title="禁用条件"
                        description="目标有这些标签时禁用"
                        color="text-yellow-400"
                        config={selectedTag.disabled_if_tags}
                        inputValue={ruleInputs.disabled_if}
                        onAddTag={() => handleAddTag('disabled_if', ruleInputs.disabled_if)}
                        onRemoveTag={(index) => handleRemoveTag('disabled_if', index)}
                        onInputChange={(value) => setRuleInputs({ ...ruleInputs, disabled_if: value })}
                        onMatchModeChange={(mode) => handleMatchModeChange('disabled_if', mode)}
                        allTags={localTags}
                        currentTagId={selectedTag.id}
                      />

                      <ConditionalRuleSection
                        type="remove_if"
                        icon={<Eraser className="w-4 h-4" />}
                        title="移除条件"
                        description="目标有这些标签时移除"
                        color="text-purple-400"
                        config={selectedTag.remove_if_tags}
                        inputValue={ruleInputs.remove_if}
                        onAddTag={() => handleAddTag('remove_if', ruleInputs.remove_if)}
                        onRemoveTag={(index) => handleRemoveTag('remove_if', index)}
                        onInputChange={(value) => setRuleInputs({ ...ruleInputs, remove_if: value })}
                        onMatchModeChange={(mode) => handleMatchModeChange('remove_if', mode)}
                        allTags={localTags}
                        currentTagId={selectedTag.id}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-sm py-12 md:py-0">
                  选择一个标签查看详情
                </div>
              )}
            </div>
          </>
        ) : (
          <GraphView
            tags={localTags}
            onSelectTag={setSelectedTag}
            selectedTag={selectedTag}
            categories={categories}
          />
        )}
      </div>

      {/* 分类管理器 */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-[#141414] border border-[#262626] shadow-lg rounded z-50 py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: '160px'
          }}
        >
          <button
            onClick={() => handleRename(contextMenu.tag)}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#262626] flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            重命名
          </button>
          <button
            onClick={() => handleDuplicate(contextMenu.tag)}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#262626] flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
          <button
            onClick={async () => {
              await updateTagMutation.mutateAsync({
                id: contextMenu.tag.id,
                data: { is_locked: !contextMenu.tag.is_locked }
              });
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#262626] flex items-center gap-2"
          >
            {contextMenu.tag.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {contextMenu.tag.is_locked ? '解锁' : '锁定'}
          </button>
          <div className="h-px bg-[#262626] my-1" />
          <button
            onClick={() => handleDelete(contextMenu.tag)}
            className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-[#5a1e1e] flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      )}
    </div>
  );
}