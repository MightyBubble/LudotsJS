import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Search, Grid3x3, List, GitBranch, 
  Download, Upload, Filter, Sparkles
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import TagTree from "../components/tags/TagTree";
import TagListView from "../components/tags/TagListView";
import TagDetailPanel from "../components/tags/TagDetailPanel";
import TagSearchBar from "../components/tags/TagSearchBar";
import BulkOperationsPanel from "../components/tags/BulkOperationsPanel";
import TagCreationDialog from "../components/tags/TagCreationDialog";
import TagStatsCards from "../components/tags/TagStatsCards";

export default function TagEditor() {
  const [viewMode, setViewMode] = useState("tree"); // tree, list, card
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterCategory, setFilterCategory] = useState("all");

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
      setShowCreateDialog(false);
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

  // 搜索和过滤
  const filteredTags = useMemo(() => {
    let result = tags;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(tag => 
        tag.full_path.toLowerCase().includes(query) ||
        tag.name.toLowerCase().includes(query) ||
        tag.description?.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== "all") {
      result = result.filter(tag => tag.category === filterCategory);
    }

    return result;
  }, [tags, searchQuery, filterCategory]);

  const handleCreateTag = (tagData) => {
    createTagMutation.mutate(tagData);
  };

  const handleUpdateTag = (id, data) => {
    updateTagMutation.mutate({ id, data });
  };

  const handleDeleteTag = (id) => {
    if (window.confirm("确定要删除这个标签吗？")) {
      deleteTagMutation.mutate(id);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(tags, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gameplay-tags.json';
    link.click();
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* 顶部工具栏 */}
      <div className="glass-effect border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              标签编辑器
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <TagSearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              filterCategory={filterCategory}
              onFilterChange={setFilterCategory}
            />

            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="bg-white/5 border border-white/10">
                <TabsTrigger value="tree" className="data-[state=active]:bg-purple-500">
                  <GitBranch className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-purple-500">
                  <List className="w-4 h-4" />
                </TabsTrigger>
                <TabsTrigger value="card" className="data-[state=active]:bg-purple-500">
                  <Grid3x3 className="w-4 h-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              onClick={() => setShowBulkOps(!showBulkOps)}
              variant="outline"
              className="border-white/20 hover:bg-white/10 text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              批量操作
            </Button>

            <Button
              onClick={handleExport}
              variant="outline"
              className="border-white/20 hover:bg-white/10 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              导出
            </Button>

            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-purple-500/30"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建标签
            </Button>
          </div>
        </div>

        <TagStatsCards tags={tags} className="mt-4" />
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：标签浏览器 */}
        <div className="w-96 border-r border-white/10 glass-effect overflow-auto">
          {viewMode === "tree" && (
            <TagTree
              tags={tagTree}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              onCreateChild={(parent) => setShowCreateDialog(true)}
            />
          )}
          {viewMode === "list" && (
            <TagListView
              tags={filteredTags}
              selectedTag={selectedTag}
              onSelectTag={setSelectedTag}
              selectedTags={selectedTags}
              onToggleSelect={(tag) => {
                setSelectedTags(prev => 
                  prev.includes(tag.id) 
                    ? prev.filter(id => id !== tag.id)
                    : [...prev, tag.id]
                );
              }}
            />
          )}
        </div>

        {/* 中间：详情面板 */}
        <div className="flex-1 overflow-auto">
          {selectedTag ? (
            <TagDetailPanel
              tag={selectedTag}
              onUpdate={handleUpdateTag}
              onDelete={handleDeleteTag}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                  <GitBranch className="w-12 h-12 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">选择一个标签</h3>
                <p className="text-gray-400">从左侧选择一个标签查看详情</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：批量操作面板 */}
        {showBulkOps && (
          <BulkOperationsPanel
            selectedTags={selectedTags}
            allTags={tags}
            onClose={() => setShowBulkOps(false)}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ['gameplayTags'] })}
          />
        )}
      </div>

      {/* 创建标签对话框 */}
      {showCreateDialog && (
        <TagCreationDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateTag}
          existingTags={tags}
          parentTag={selectedTag}
        />
      )}
    </div>
  );
}