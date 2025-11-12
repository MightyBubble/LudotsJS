import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TagCreationDialog({ onClose, onCreate, existingTags, parentTag }) {
  const [formData, setFormData] = useState({
    name: "",
    parent_path: parentTag?.full_path || "",
    description: "",
    category: "other",
    color: "#8b5cf6",
  });

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // 验证标签名称
    if (!formData.name.trim()) {
      setError("标签名称不能为空");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.name)) {
      setError("标签名称只能包含字母、数字和下划线");
      return;
    }

    // 计算完整路径
    const full_path = formData.parent_path 
      ? `${formData.parent_path}.${formData.name}`
      : formData.name;

    // 检查是否重复
    if (existingTags.some(t => t.full_path === full_path)) {
      setError("该路径的标签已存在");
      return;
    }

    // 计算深度
    const depth = full_path.split('.').length - 1;

    const tagData = {
      ...formData,
      full_path,
      depth,
      usage_count: 0,
      is_locked: false,
    };

    onCreate(tagData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl glass-effect rounded-2xl border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-purple-400" />
              创建新标签
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-white/10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-gray-300">标签名称 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如: Fireball"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                只能使用字母、数字和下划线
              </p>
            </div>

            <div>
              <Label className="text-gray-300">父级路径</Label>
              <Input
                value={formData.parent_path}
                onChange={(e) => setFormData({ ...formData, parent_path: e.target.value })}
                placeholder="留空表示根级标签"
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                完整路径将是: {formData.parent_path ? `${formData.parent_path}.` : ""}{formData.name || "..."}
              </p>
            </div>

            <div>
              <Label className="text-gray-300">描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="添加标签描述..."
                className="mt-1 bg-white/5 border-white/10 text-white min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ability">能力</SelectItem>
                    <SelectItem value="state">状态</SelectItem>
                    <SelectItem value="effect">效果</SelectItem>
                    <SelectItem value="item">道具</SelectItem>
                    <SelectItem value="event">事件</SelectItem>
                    <SelectItem value="ui">界面</SelectItem>
                    <SelectItem value="audio">音频</SelectItem>
                    <SelectItem value="gameplay">玩法</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">颜色</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData({ ...formData, color: value })}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="#ef4444">🔴 红色</SelectItem>
                    <SelectItem value="#f59e0b">🟠 橙色</SelectItem>
                    <SelectItem value="#eab308">🟡 黄色</SelectItem>
                    <SelectItem value="#22c55e">🟢 绿色</SelectItem>
                    <SelectItem value="#06b6d4">🔵 青色</SelectItem>
                    <SelectItem value="#3b82f6">🔵 蓝色</SelectItem>
                    <SelectItem value="#8b5cf6">🟣 紫色</SelectItem>
                    <SelectItem value="#ec4899">🩷 粉色</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-white/20 hover:bg-white/10 text-white"
              >
                取消
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                创建标签
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}