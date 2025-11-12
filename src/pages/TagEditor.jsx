import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, ChevronDown, Plus, 
  Search, Trash2, Edit3, Copy, FolderTree, GripVertical
} from "lucide-react";

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

  const queryClient = useQueryClient();

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
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
      setEditingTag(null);
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id) => base44.entities.GameplayTag.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameplayTags'] });
      setSelectedTag(null);
    },
  });

  // 自动解析路径并创建所有层级标签
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
          usage_count: 0,
          is_locked: false,
        });
      }
    }
    
    setNewTagPath("");
    // 展开新创建的路径
    parts.forEach((_, i) => {
      const path = parts.slice(0, i + 1).join('.');
      setExpandedNodes(prev => new Set([...prev, path]));
    });
  };

  // 构建树形结构
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

  // 搜索过滤
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

  // 拖拽处理
  const handleDragStart = (e, tag) => {
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTag(tag);
  };

  const handleDragOver = (e, tag) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 不能拖到自己或自己的子级
    if (draggedTag && tag) {
      if (tag.full_path.startsWith(draggedTag.full_path + '.') || tag.id === draggedTag.id) {
        e.dataTransfer.dropEffect = 'none';
        return;
      }
    }
    
    setDropTarget(tag);
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget === e.target) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e, targetTag) => {
    e.preventDefault();
    
    if (!draggedTag || !targetTag || draggedTag.id === targetTag.id) {
      setDraggedTag(null);
      setDropTarget(null);
      return;
    }

    // 不能拖到自己的子级
    if (targetTag.full_path.startsWith(draggedTag.full_path + '.')) {
      setDraggedTag(null);
      setDropTarget(null);
      return;
    }

    // 更新标签的父级
    const newParentPath = targetTag.full_path;
    const newFullPath = `${newParentPath}.${draggedTag.name}`;
    const newDepth = newFullPath.split('.').length - 1;

    await updateTagMutation.mutateAsync({
      id: draggedTag.id,
      data: {
        parent_path: newParentPath,
        full_path: newFullPath,
        depth: newDepth,
      }
    });

    // 展开目标节点
    setExpandedNodes(prev => new Set([...prev, targetTag.full_path]));
    
    setDraggedTag(null);
    setDropTarget(null);
  };

  const handleDropToRoot = async (e) => {
    e.preventDefault();
    
    if (!draggedTag) return;

    // 移动到根级
    const newFullPath = draggedTag.name;
    const newDepth = 0;

    await updateTagMutation.mutateAsync({
      id: draggedTag.id,
      data: {
        parent_path: "",
        full_path: newFullPath,
        depth: newDepth,
      }
    });

    setDraggedTag(null);
    setDropTarget(null);
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

    return (
      <div key={node.id}>
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(e, node)}
          onDragEnd={() => {
            setDraggedTag(null);
            setDropTarget(null);
          }}
          onDragOver={(e) => handleDragOver(e, node)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node)}
          className={`flex items-center gap-1 py-1 px-2 hover:bg-[#2d2d2d] cursor-pointer group ${
            isSelected ? 'bg-[#094771]' : ''
          } ${isDragTarget ? 'bg-[#0e639c] border-l-2 border-blue-400' : ''} ${
            isDragging ? 'opacity-40' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedTag(node)}
          onContextMenu={(e) => handleContextMenu(e, node)}
        >
          <GripVertical className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleNode(node.full_path);
            }}
            className="w-4 h-4 flex items-center justify-center hover:bg-[#3d3d3d]"
          >
            {hasChildren && (
              isExpanded ? 
                <ChevronDown className="w-3 h-3 text-gray-400" /> : 
                <ChevronRight className="w-3 h-3 text-gray-400" />
            )}
          </button>

          <FolderTree className="w-4 h-4 text-[#ffd700]" />

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
              className="h-5 text-sm bg-[#2d2d2d] border-[#094771] text-white px-1"
            />
          ) : (
            <span className="text-sm text-gray-200 select-none">{node.name}</span>
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

      {/* 主要内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧树形视图 */}
        <div className="w-96 bg-[#252526] border-r border-[#3d3d3d] flex flex-col">
          {/* 添加标签输入框 */}
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
              使用 . 分隔自动创建层级，拖拽标签可调整层级
            </p>
          </div>

          {/* 树形列表 */}
          <div 
            className="flex-1 overflow-auto"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={handleDropToRoot}
          >
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500">加载中...</div>
            ) : filteredTree.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                {searchQuery ? '没有匹配的标签' : '暂无标签，输入路径创建'}
              </div>
            ) : (
              <div className="py-2">
                {filteredTree.map(node => renderNode(node))}
              </div>
            )}
          </div>

          {/* 统计信息 */}
          <div className="h-8 bg-[#2d2d2d] border-t border-[#3d3d3d] flex items-center px-3 text-xs text-gray-400">
            总计: {tags.length} 个标签
            {draggedTag && <span className="ml-3 text-blue-400">拖拽到目标位置或根区域</span>}
          </div>
        </div>

        {/* 右侧详情面板 */}
        <div className="flex-1 bg-[#1e1e1e] overflow-auto">
          {selectedTag ? (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">
                  {selectedTag.name}
                </h2>
                <p className="text-sm text-gray-400">{selectedTag.full_path}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">完整路径</label>
                  <div className="flex gap-2">
                    <Input
                      value={selectedTag.full_path}
                      readOnly
                      className="flex-1 h-8 bg-[#252526] border-[#3d3d3d] text-sm text-white"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 border-[#3d3d3d] hover:bg-[#2d2d2d]"
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
                    className="h-8 bg-[#252526] border-[#3d3d3d] text-sm text-gray-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 mb-1 block">层级深度</label>
                  <Input
                    value={selectedTag.depth}
                    readOnly
                    className="h-8 bg-[#252526] border-[#3d3d3d] text-sm text-gray-400"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRename(selectedTag)}
                    className="border-[#3d3d3d] hover:bg-[#2d2d2d]"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    重命名
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(selectedTag)}
                    className="border-[#3d3d3d] hover:bg-[#5a1e1e] text-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              选择一个标签查看详情
            </div>
          )}
        </div>
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