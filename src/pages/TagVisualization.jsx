import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, Maximize2, GitBranch, Layers } from "lucide-react";
import { motion } from "framer-motion";

export default function TagVisualization() {
  const [zoom, setZoom] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
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

  const categoryColors = {
    ability: "#ef4444",
    state: "#3b82f6",
    effect: "#a855f7",
    item: "#22c55e",
    event: "#eab308",
    ui: "#6366f1",
    audio: "#ec4899",
    gameplay: "#14b8a6",
    other: "#6b7280",
  };

  const renderNode = (node, level = 0, index = 0) => {
    const color = categoryColors[node.category] || categoryColors.other;
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        style={{ 
          marginLeft: `${level * 40}px`,
          transform: `scale(${zoom})`
        }}
        className="mb-3"
      >
        <div className="flex items-center gap-3">
          {level > 0 && (
            <div className="w-8 h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent" />
          )}
          
          <div 
            className="flex items-center gap-3 glass-effect border border-white/10 rounded-xl px-4 py-3 hover:border-white/20 transition-all cursor-pointer min-w-[200px]"
          >
            <div
              className="w-3 h-3 rounded-full shadow-lg"
              style={{ 
                backgroundColor: color,
                boxShadow: `0 0 10px ${color}80`
              }}
            />
            
            <div className="flex-1">
              <div className="font-semibold text-white text-sm">{node.name}</div>
              {node.description && (
                <div className="text-xs text-gray-400 truncate max-w-[200px]">
                  {node.description}
                </div>
              )}
            </div>

            {hasChildren && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Layers className="w-3 h-3" />
                {node.children.length}
              </div>
            )}

            {node.usage_count > 0 && (
              <div className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                {node.usage_count}
              </div>
            )}
          </div>
        </div>

        {hasChildren && (
          <div className="mt-2">
            {node.children.map((child, idx) => renderNode(child, level + 1, idx))}
          </div>
        )}
      </motion.div>
    );
  };

  const filteredTree = selectedCategory === "all" 
    ? tagTree 
    : tagTree.filter(node => node.category === selectedCategory);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="glass-effect border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-white">标签关系图谱</h1>
          </div>
          
          <div className="flex gap-3 items-center">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/5 border border-white/10 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="all">全部分类</option>
              <option value="ability">能力</option>
              <option value="state">状态</option>
              <option value="effect">效果</option>
              <option value="item">道具</option>
              <option value="event">事件</option>
              <option value="ui">界面</option>
              <option value="audio">音频</option>
              <option value="gameplay">玩法</option>
              <option value="other">其他</option>
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                className="border-white/20 hover:bg-white/10 text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                className="border-white/20 hover:bg-white/10 text-white"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(1)}
                className="border-white/20 hover:bg-white/10 text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        {tags.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
                <GitBranch className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">暂无标签数据</h3>
              <p className="text-gray-400">创建一些标签后，它们的关系会在这里显示</p>
            </div>
          </div>
        ) : filteredTree.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-gray-400 text-lg">该分类下暂无标签</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 glass-effect border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400">根节点:</span>
                  <span className="text-white font-semibold">{filteredTree.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span className="text-gray-400">总标签数:</span>
                  <span className="text-white font-semibold">{tags.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">缩放:</span>
                  <span className="text-white font-semibold">{(zoom * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {filteredTree.map((node, index) => renderNode(node, 0, index))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}