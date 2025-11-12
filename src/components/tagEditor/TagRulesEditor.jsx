import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Shield, Ban, Trash, Power, Eraser } from "lucide-react";

export default function TagRulesEditor({ tag, allTags, onUpdate }) {
  const [rules, setRules] = useState({
    required_tags: tag.required_tags || [],
    blocked_tags: tag.blocked_tags || [],
    removed_tags: tag.removed_tags || [],
    disabled_if_tags: tag.disabled_if_tags || [],
    remove_if_tags: tag.remove_if_tags || [],
  });

  const [newTag, setNewTag] = useState({
    required: "",
    blocked: "",
    removed: "",
    disabled_if: "",
    remove_if: "",
  });

  const addTag = (type, value) => {
    if (!value.trim()) return;
    const field = type === 'required' ? 'required_tags' : 
                  type === 'blocked' ? 'blocked_tags' : 
                  type === 'removed' ? 'removed_tags' :
                  type === 'disabled_if' ? 'disabled_if_tags' : 'remove_if_tags';
    
    const updated = {
      ...rules,
      [field]: [...rules[field], value.trim()]
    };
    setRules(updated);
    setNewTag({ ...newTag, [type]: "" });
    onUpdate(updated);
  };

  const removeTag = (type, index) => {
    const field = type === 'required' ? 'required_tags' : 
                  type === 'blocked' ? 'blocked_tags' : 
                  type === 'removed' ? 'removed_tags' :
                  type === 'disabled_if' ? 'disabled_if_tags' : 'remove_if_tags';
    
    const updated = {
      ...rules,
      [field]: rules[field].filter((_, i) => i !== index)
    };
    setRules(updated);
    onUpdate(updated);
  };

  const RuleSection = ({ type, icon, title, description, color, tags, inputValue }) => (
    <div className="border border-[#3d3d3d] rounded p-3 bg-[#1e1e1e]">
      <div className="flex items-start gap-2 mb-2">
        <div className={`mt-0.5 ${color}`}>
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      {/* 已添加的标签 */}
      <div className="space-y-1 mb-2">
        {tags.map((t, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-[#2d2d2d] px-2 py-1 rounded text-xs"
          >
            <span className="text-gray-300 font-mono">{t}</span>
            <button
              onClick={() => removeTag(type, index)}
              className="text-gray-500 hover:text-red-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="text-xs text-gray-600 italic py-1">未设置</div>
        )}
      </div>

      {/* 添加新标签 */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setNewTag({ ...newTag, [type]: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTag(type, inputValue);
          }}
          placeholder="输入标签路径"
          className="h-7 flex-1 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
          list={`${type}-suggestions`}
        />
        <datalist id={`${type}-suggestions`}>
          {allTags
            .filter(t => t.id !== tag.id)
            .map(t => (
              <option key={t.id} value={t.full_path} />
            ))}
        </datalist>
        <Button
          size="sm"
          onClick={() => addTag(type, inputValue)}
          className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-white"
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="border-b border-[#3d3d3d] pb-2">
        <h3 className="text-sm font-semibold text-gray-300">标签规则配置</h3>
        <p className="text-xs text-gray-500 mt-1">
          配置标签的依赖、冲突和自动处理规则
        </p>
      </div>

      <RuleSection
        type="required"
        icon={<Shield className="w-4 h-4" />}
        title="必需标签 (Required Tags)"
        description="附加此标签前，目标必须已有这些标签"
        color="text-green-400"
        tags={rules.required_tags}
        inputValue={newTag.required}
      />

      <RuleSection
        type="blocked"
        icon={<Ban className="w-4 h-4" />}
        title="阻止标签 (Blocked Tags)"
        description="附加此标签前，目标不能有这些标签"
        color="text-red-400"
        tags={rules.blocked_tags}
        inputValue={newTag.blocked}
      />

      <RuleSection
        type="removed"
        icon={<Trash className="w-4 h-4" />}
        title="移除标签 (Removed Tags)"
        description="附加此标签后，从目标移除这些标签"
        color="text-orange-400"
        tags={rules.removed_tags}
        inputValue={newTag.removed}
      />

      <RuleSection
        type="disabled_if"
        icon={<Power className="w-4 h-4" />}
        title="禁用条件 (Disabled If Tags)"
        description="附加后如果目标有这些标签，此标签自动禁用"
        color="text-yellow-400"
        tags={rules.disabled_if_tags}
        inputValue={newTag.disabled_if}
      />

      <RuleSection
        type="remove_if"
        icon={<Eraser className="w-4 h-4" />}
        title="移除条件 (Remove If Tags)"
        description="附加后如果目标有这些标签，此标签自动移除"
        color="text-purple-400"
        tags={rules.remove_if_tags}
        inputValue={newTag.remove_if}
      />
    </div>
  );
}