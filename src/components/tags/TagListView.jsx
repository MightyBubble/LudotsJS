import React from "react";
import { motion } from "framer-motion";
import { Tag, Lock, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function TagListView({ 
  tags, 
  selectedTag, 
  onSelectTag, 
  selectedTags = [],
  onToggleSelect 
}) {
  const categoryColors = {
    ability: "bg-red-100 text-red-800 border-red-200",
    state: "bg-blue-100 text-blue-800 border-blue-200",
    effect: "bg-purple-100 text-purple-800 border-purple-200",
    item: "bg-green-100 text-green-800 border-green-200",
    event: "bg-yellow-100 text-yellow-800 border-yellow-200",
    ui: "bg-indigo-100 text-indigo-800 border-indigo-200",
    audio: "bg-rose-100 text-rose-800 border-rose-200",
    gameplay: "bg-teal-100 text-teal-800 border-teal-200",
    other: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="p-4">
      <div className="space-y-2">
        {tags.map((tag) => {
          const isSelected = selectedTag?.id === tag.id;
          const isChecked = selectedTags.includes(tag.id);

          return (
            <motion.div
              key={tag.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-purple-400/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
              onClick={() => onSelectTag(tag)}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggleSelect(tag)}
                onClick={(e) => e.stopPropagation()}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-purple-400" />
                  <h3 className="font-semibold text-white truncate">{tag.name}</h3>
                  {tag.is_locked && <Lock className="w-3 h-3 text-yellow-400" />}
                </div>
                
                <p className="text-xs text-gray-400 truncate mb-2">{tag.full_path}</p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant="secondary"
                    className={`${categoryColors[tag.category] || categoryColors.other} border text-xs`}
                  >
                    {tag.category}
                  </Badge>
                  
                  {tag.usage_count > 0 && (
                    <Badge variant="outline" className="text-xs border-purple-400/50 text-purple-300">
                      使用 {tag.usage_count} 次
                    </Badge>
                  )}
                  
                  <span className="text-xs text-gray-500">深度: {tag.depth}</span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-500" />
            </motion.div>
          );
        })}

        {tags.length === 0 && (
          <div className="text-center py-12 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
              <Tag className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400">没有找到匹配的标签</p>
          </div>
        )}
      </div>
    </div>
  );
}