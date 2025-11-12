import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X, Trash2, Move, Edit3, Lock, 
  Unlock, Copy, AlertTriangle 
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BulkOperationsPanel({ selectedTags, allTags, onClose, onRefresh }) {
  const [operation, setOperation] = useState(null);
  const [newPath, setNewPath] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedTagsData = allTags.filter(t => selectedTags.includes(t.id));

  const handleBulkDelete = async () => {
    if (!window.confirm(`确定要删除 ${selectedTags.length} 个标签吗？`)) return;

    setIsProcessing(true);
    try {
      for (const id of selectedTags) {
        await base44.entities.GameplayTag.delete(id);
      }
      onRefresh();
      onClose();
    } catch (error) {
      alert("删除失败: " + error.message);
    }
    setIsProcessing(false);
  };

  const handleBulkLock = async (locked) => {
    setIsProcessing(true);
    try {
      for (const id of selectedTags) {
        await base44.entities.GameplayTag.update(id, { is_locked: locked });
      }
      onRefresh();
    } catch (error) {
      alert("操作失败: " + error.message);
    }
    setIsProcessing(false);
  };

  const handleBulkMove = async () => {
    if (!newPath.trim()) {
      alert("请输入新的父级路径");
      return;
    }

    setIsProcessing(true);
    try {
      for (const tag of selectedTagsData) {
        const newFullPath = newPath ? `${newPath}.${tag.name}` : tag.name;
        await base44.entities.GameplayTag.update(tag.id, {
          parent_path: newPath,
          full_path: newFullPath,
          depth: newFullPath.split('.').length - 1,
        });
      }
      onRefresh();
      setOperation(null);
      setNewPath("");
    } catch (error) {
      alert("移动失败: " + error.message);
    }
    setIsProcessing(false);
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-96 border-l border-white/10 glass-effect p-6 overflow-auto"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">批量操作</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {selectedTags.length === 0 ? (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            请先在列表视图中选择要操作的标签
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <p className="text-sm text-gray-400">已选择</p>
            <p className="text-2xl font-bold text-white">{selectedTags.length} 个标签</p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start border-white/20 hover:bg-white/10 text-white"
              onClick={() => setOperation(operation === 'move' ? null : 'move')}
            >
              <Move className="w-4 h-4 mr-2" />
              批量移动
            </Button>

            {operation === 'move' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="ml-6 space-y-2"
              >
                <Label className="text-gray-300">新的父级路径</Label>
                <Input
                  value={newPath}
                  onChange={(e) => setNewPath(e.target.value)}
                  placeholder="留空表示移动到根级"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button
                  size="sm"
                  onClick={handleBulkMove}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  确认移动
                </Button>
              </motion.div>
            )}

            <Button
              variant="outline"
              className="w-full justify-start border-white/20 hover:bg-white/10 text-white"
              onClick={() => handleBulkLock(true)}
              disabled={isProcessing}
            >
              <Lock className="w-4 h-4 mr-2" />
              批量锁定
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start border-white/20 hover:bg-white/10 text-white"
              onClick={() => handleBulkLock(false)}
              disabled={isProcessing}
            >
              <Unlock className="w-4 h-4 mr-2" />
              批量解锁
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start border-red-500/50 hover:bg-red-500/20 text-red-400"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              批量删除
            </Button>
          </div>

          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl">
            <p className="text-xs text-red-300">
              ⚠️ 批量操作不可撤销，请谨慎操作
            </p>
          </div>
        </>
      )}
    </motion.div>
  );
}