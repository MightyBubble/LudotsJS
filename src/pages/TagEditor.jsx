import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, ChevronDown, Plus, 
  Search, Trash2, Edit3, Copy, FolderTree, GripVertical, Save, X, MoveUp,
  List, Network, CheckSquare, Square, Lock, Unlock, Download, Upload
} from "lucide-react";
import GraphView from "../components/tagEditor/GraphView";

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

  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
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
          category: tag.category || "other",
          color: tag.color || "#94a3b8",
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
          category: "other",
          color: "#94a3b8",
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
            isSelected ? 'bg-[#094771]' : 
            isDragTarget ? 'bg-[#0e639c]' : 
            isMultiSelected ? 'bg-[#0e639c]/50' :
            'hover:bg-[#2d2d2d]'
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
            style={{ backgroundColor: node.color || '#94a3b8' }}
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
              className="h-5 text-sm bg-[#2d2d2d] border-[#094771] text-white px-1 flex-1"
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
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      {/* 顶部工具栏 */}
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <span className="text-sm font-semibold text-gray-300">GameplayTag 编辑器</span>
        
        {/* 视图切换 */}
        <div className="flex gap-1 ml-4 bg-[#1e1e1e] rounded p-1">
          <Button
            size="sm"
            variant={viewMode === 'tree' ? 'default' : 'ghost'}
            onClick={() => setViewMode('tree')}
            className={`h-6 px-3 text-xs ${viewMode === 'tree' ? 'bg-[#0e639c] text-white hover:bg-[#1177bb]' : 'text-gray-300 hover:bg-[#2d2d2d] hover:text-white'}`}
          >
            <List className="w-3 h-3 mr-1" />
            树形
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'graph' ? 'default' : 'ghost'}
            onClick={() => setViewMode('graph')}
            className={`h-6 px-3 text-xs ${viewMode === 'graph' ? 'bg-[#0e639c] text-white hover:bg-[#1177bb]' : 'text-gray-300 hover:bg-[#2d2d2d] hover:text-white'}`}
          >
            <Network className="w-3 h-3 mr-1" />
            图形
          </Button>
        </div>

        {/* 导入/导出 */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={exportToJSON}
            className="h-6 px-2 bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
            title="导出为 JSON"
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
              className="h-6 px-2 bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
              disabled={importing}
              onClick={(e) => e.currentTarget.previousElementSibling.click()}
              title="导入 JSON"
            >
              <Upload className="w-3 h-3" />
            </Button>
          </label>
        </div>

        {/* 批量操作模式 */}
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
            className={`h-6 px-3 text-xs ${isMultiSelectMode ? 'bg-[#0e639c] text-white' : 'bg-[#2d2d2d] border-[#3d3d3d] text-gray-300'}`}
          >
            {isMultiSelectMode ? <CheckSquare className="w-3 h-3 mr-1" /> : <Square className="w-3 h-3 mr-1" />}
            批量操作
          </Button>
        )}

        {/* 批量操作按钮 */}
        {isMultiSelectMode && selectedTags.size > 0 && (
          <div className="flex gap-2">
            <span className="text-xs text-gray-400 flex items-center">
              已选 {selectedTags.size} 项
            </span>
            <Button
              size="sm"
              onClick={() => handleBatchLock(true)}
              className="h-6 px-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-xs text-gray-300"
            >
              <Lock className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              onClick={() => handleBatchLock(false)}
              className="h-6 px-2 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-xs text-gray-300"
            >
              <Unlock className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              onClick={handleBatchDelete}
              className="h-6 px-2 bg-red-900/50 hover:bg-red-900 text-xs text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 ml-4">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-xs text-yellow-400">有未保存的更改</span>
            <Button
              size="sm"
              onClick={handleSaveChanges}
              className="h-6 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs"
            >
              <Save className="w-3 h-3 mr-1" />
              保存
            </Button>
            <Button
              size="sm"
              onClick={handleDiscardChanges}
              variant="outline"
              className="h-6 px-3 bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-xs text-gray-300"
            >
              <X className="w-3 h-3 mr-1" />
              撤销
            </Button>
          </div>
        )}
        
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

        <div className="text-xs text-gray-500">
          Ctrl+N 新建 | F2 重命名 | Del 删除 | Ctrl+S 保存
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'tree' ? (
          <>
            {/* 左侧树形视图 */}
            <div className="w-96 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
              <div className="p-3 border-b border-[#3d3d3d]">
                <div className="flex gap-2">
                  <Input
                    placeholder="输入标签路径 (例: Ability.Combat.Skill)"
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
                    className="h-8 bg-[#0e639c] hover:bg-[#1177bb] text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
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
                      <div className="sticky bottom-0 left-0 right-0 mt-4 mx-3 mb-3 p-4 border-2 border-dashed border-blue-500 bg-[#0e639c]/20 rounded flex items-center justify-center gap-2">
                        <MoveUp className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-blue-300 font-medium">松开鼠标移至根级</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="h-8 bg-[#2d2d2d] border-t border-[#3d3d3d] flex items-center px-3 text-xs text-gray-400">
                总计: {localTags.length} 个标签
                {hasUnsavedChanges && (
                  <span className="ml-3 text-yellow-400">
                    • 有未保存的更改
                  </span>
                )}
              </div>
            </div>

            {/* 右侧详情面板 */}
            <div className="flex-1 bg-[#1e1e1e] overflow-auto p-4">
              {selectedTag && (
                <div className="p-4 bg-[#252526] border border-[#3d3d3d] rounded">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white mb-1">
                      {selectedTag.name}
                    </h2>
                    <p className="text-sm text-gray-400">{selectedTag.full_path}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">完整路径</label>
                      <div className="flex gap-2">
                        <Input
                          value={selectedTag.full_path}
                          readOnly
                          className="flex-1 h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTag.full_path);
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">父级路径</label>
                      <Input
                        value={selectedTag.parent_path || "(根级)"}
                        readOnly
                        className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-gray-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">层级深度</label>
                        <Input
                          value={selectedTag.depth}
                          readOnly
                          className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">使用次数</label>
                        <Input
                          value={selectedTag.usage_count || 0}
                          readOnly
                          className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-gray-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">颜色</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedTag.color || '#94a3b8'}
                          onChange={(e) => {
                            updateTagMutation.mutate({
                              id: selectedTag.id,
                              data: { color: e.target.value }
                            });
                          }}
                          className="w-10 h-8 rounded cursor-pointer bg-[#1e1e1e] border border-[#3d3d3d]"
                        />
                        <Input
                          value={selectedTag.color || '#94a3b8'}
                          onChange={(e) => {
                            updateTagMutation.mutate({
                              id: selectedTag.id,
                              data: { color: e.target.value }
                            });
                          }}
                          className="flex-1 h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">分类</label>
                      <span className="text-sm text-gray-200">{selectedTag.category}</span>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRename(selectedTag)}
                        className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        重命名
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(selectedTag)}
                        className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#5a1e1e] text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <GraphView
            tags={localTags}
            onSelectTag={setSelectedTag}
            selectedTag={selectedTag}
          />
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="fixed bg-[#2d2d2d] border border-[#3d3d3d] shadow-lg rounded z-50 py-1"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            minWidth: '160px'
          }}
        >
          <button
            onClick={() => handleRename(contextMenu.tag)}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#094771] flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            重命名
          </button>
          <button
            onClick={() => handleDuplicate(contextMenu.tag)}
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#094771] flex items-center gap-2"
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
            className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-[#094771] flex items-center gap-2"
          >
            {contextMenu.tag.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {contextMenu.tag.is_locked ? '解锁' : '锁定'}
          </button>
          <div className="h-px bg-[#3d3d3d] my-1" />
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