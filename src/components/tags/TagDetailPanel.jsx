import React, { useState } from "react";
import { motion } from "framer-motion";
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
import { 
  Save, Trash2, Lock, Unlock, Copy, 
  Tag, Layers, Calendar, User 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TagDetailPanel({ tag, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTag, setEditedTag] = useState(tag);

  const handleSave = () => {
    onUpdate(tag.id, editedTag);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTag(tag);
    setIsEditing(false);
  };

  const categoryOptions = [
    { value: "ability", label: "能力" },
    { value: "state", label: "状态" },
    { value: "effect", label: "效果" },
    { value: "item", label: "道具" },
    { value: "event", label: "事件" },
    { value: "ui", label: "界面" },
    { value: "audio", label: "音频" },
    { value: "gameplay", label: "玩法" },
    { value: "other", label: "其他" },
  ];

  const colorOptions = [
    { value: "#ef4444", label: "红色" },
    { value: "#f59e0b", label: "橙色" },
    { value: "#eab308", label: "黄色" },
    { value: "#22c55e", label: "绿色" },
    { value: "#06b6d4", label: "青色" },
    { value: "#3b82f6", label: "蓝色" },
    { value: "#8b5cf6", label: "紫色" },
    { value: "#ec4899", label: "粉色" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full overflow-auto p-6"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* 头部操作栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{tag.name}</h2>
              <p className="text-sm text-gray-400">{tag.full_path}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10 text-white"
                  onClick={() => setIsEditing(true)}
                >
                  编辑
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 hover:bg-red-500/20 text-red-400"
                  onClick={() => onDelete(tag.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 hover:bg-white/10 text-white"
                  onClick={handleCancel}
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-purple-500"
                  onClick={handleSave}
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 基本信息卡片 */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            基本信息
          </h3>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">标签名称</Label>
              <Input
                value={isEditing ? editedTag.name : tag.name}
                onChange={(e) => setEditedTag({ ...editedTag, name: e.target.value })}
                disabled={!isEditing}
                className="mt-1 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-gray-300">完整路径</Label>
              <Input
                value={tag.full_path}
                disabled
                className="mt-1 bg-white/5 border-white/10 text-gray-400"
              />
            </div>

            <div>
              <Label className="text-gray-300">描述</Label>
              <Textarea
                value={isEditing ? editedTag.description || "" : tag.description || ""}
                onChange={(e) => setEditedTag({ ...editedTag, description: e.target.value })}
                disabled={!isEditing}
                className="mt-1 bg-white/5 border-white/10 text-white min-h-[100px]"
                placeholder="添加标签描述..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300">分类</Label>
                <Select
                  value={isEditing ? editedTag.category : tag.category}
                  onValueChange={(value) => setEditedTag({ ...editedTag, category: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">颜色标记</Label>
                <Select
                  value={isEditing ? editedTag.color : tag.color}
                  onValueChange={(value) => setEditedTag({ ...editedTag, color: value })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: opt.value }}
                          />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* 统计信息卡片 */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">统计信息</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">使用次数</p>
              <p className="text-2xl font-bold text-white">{tag.usage_count || 0}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">层级深度</p>
              <p className="text-2xl font-bold text-white">{tag.depth || 0}</p>
            </div>
          </div>
        </div>

        {/* 元数据卡片 */}
        <div className="glass-effect rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">元数据</h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                创建时间
              </span>
              <span className="text-white">
                {tag.created_date ? format(new Date(tag.created_date), "yyyy-MM-dd HH:mm") : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                更新时间
              </span>
              <span className="text-white">
                {tag.updated_date ? format(new Date(tag.updated_date), "yyyy-MM-dd HH:mm") : "-"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                创建者
              </span>
              <span className="text-white">{tag.created_by || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-2">
                {tag.is_locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                锁定状态
              </span>
              <Badge variant={tag.is_locked ? "destructive" : "outline"}>
                {tag.is_locked ? "已锁定" : "未锁定"}
              </Badge>
            </div>
          </div>
        </div>

        {/* 操作按钮组 */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-white/20 hover:bg-white/10 text-white"
          >
            <Copy className="w-4 h-4 mr-2" />
            复制路径
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-white/20 hover:bg-white/10 text-white"
            onClick={() => onUpdate(tag.id, { ...tag, is_locked: !tag.is_locked })}
          >
            {tag.is_locked ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
            {tag.is_locked ? "解锁" : "锁定"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}