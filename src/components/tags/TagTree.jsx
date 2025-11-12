import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Tag, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const TagTreeNode = ({ tag, level = 0, selectedTag, onSelectTag, onCreateChild }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = tag.children && tag.children.length > 0;
  const isSelected = selectedTag?.id === tag.id;

  const categoryColors = {
    ability: "from-red-500 to-orange-500",
    state: "from-blue-500 to-cyan-500",
    effect: "from-purple-500 to-pink-500",
    item: "from-green-500 to-emerald-500",
    event: "from-yellow-500 to-amber-500",
    ui: "from-indigo-500 to-violet-500",
    audio: "from-rose-500 to-pink-500",
    gameplay: "from-teal-500 to-cyan-500",
    other: "from-gray-500 to-slate-500",
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all duration-200 ${
          isSelected 
            ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border-l-2 border-purple-400' 
            : 'hover:bg-white/5'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelectTag(tag)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="hover:bg-white/10 rounded p-1 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}

        {!hasChildren && <div className="w-6" />}

        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${categoryColors[tag.category] || categoryColors.other}`} />

        <Tag className="w-4 h-4 text-gray-400" />

        <span className="flex-1 text-sm font-medium text-white truncate">
          {tag.name}
        </span>

        {tag.is_locked && <Lock className="w-3 h-3 text-yellow-400" />}

        {tag.usage_count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
            {tag.usage_count}
          </span>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            onCreateChild(tag);
          }}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {tag.children.map((child) => (
              <TagTreeNode
                key={child.id}
                tag={child}
                level={level + 1}
                selectedTag={selectedTag}
                onSelectTag={onSelectTag}
                onCreateChild={onCreateChild}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function TagTree({ tags, selectedTag, onSelectTag, onCreateChild }) {
  return (
    <div className="p-4 space-y-1">
      {tags.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
            <Tag className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400">暂无标签</p>
          <p className="text-sm text-gray-500">点击右上角创建第一个标签</p>
        </div>
      ) : (
        tags.map((tag) => (
          <TagTreeNode
            key={tag.id}
            tag={tag}
            selectedTag={selectedTag}
            onSelectTag={onSelectTag}
            onCreateChild={onCreateChild}
          />
        ))
      )}
    </div>
  );
}