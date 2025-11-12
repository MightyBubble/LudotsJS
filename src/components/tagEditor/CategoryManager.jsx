import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Edit3, Save, X, Palette } from "lucide-react";

export default function CategoryManager({ isOpen, onClose }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newCategory, setNewCategory] = useState({
    key: "",
    name: "",
    color: "#60a5fa",
    description: "",
    sort_order: 0,
  });
  const [showNewForm, setShowNewForm] = useState(false);

  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ['tagCategories'],
    queryFn: () => base44.entities.TagCategory.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TagCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagCategories'] });
      setShowNewForm(false);
      setNewCategory({ key: "", name: "", color: "#60a5fa", description: "", sort_order: 0 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TagCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagCategories'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TagCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tagCategories'] });
    },
  });

  const handleCreate = () => {
    if (!newCategory.key || !newCategory.name || !newCategory.color) {
      alert('请填写必填项：键名、名称、颜色');
      return;
    }
    createMutation.mutate(newCategory);
  };

  const handleUpdate = (id) => {
    updateMutation.mutate({ id, data: editForm });
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除该分类吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setEditForm({ ...category });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-[#252526] border border-[#3d3d3d] rounded-lg w-[700px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-[#3d3d3d]">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-white">分类管理</h2>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-[#3d3d3d]"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-4">
          {/* 新建表单 */}
          {showNewForm && (
            <div className="mb-4 p-3 bg-[#1e1e1e] border border-[#3d3d3d] rounded">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">新建分类</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">键名 *</label>
                    <Input
                      value={newCategory.key}
                      onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value })}
                      placeholder="ability"
                      className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">名称 *</label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      placeholder="能力"
                      className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">颜色 *</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="w-10 h-7 rounded cursor-pointer bg-[#2d2d2d] border border-[#3d3d3d]"
                      />
                      <Input
                        value={newCategory.color}
                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                        className="flex-1 h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">排序</label>
                    <Input
                      type="number"
                      value={newCategory.sort_order}
                      onChange={(e) => setNewCategory({ ...newCategory, sort_order: parseInt(e.target.value) || 0 })}
                      className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">说明</label>
                  <Input
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    placeholder="分类说明"
                    className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleCreate}
                    className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    创建
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNewForm(false);
                      setNewCategory({ key: "", name: "", color: "#60a5fa", description: "", sort_order: 0 });
                    }}
                    className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
                  >
                    <X className="w-3 h-3 mr-1" />
                    取消
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 分类列表 */}
          <div className="space-y-2">
            {categories.sort((a, b) => a.sort_order - b.sort_order).map(category => (
              <div
                key={category.id}
                className="p-3 bg-[#1e1e1e] border border-[#3d3d3d] rounded hover:border-[#0e639c] transition-colors"
              >
                {editingId === category.id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">键名</label>
                        <Input
                          value={editForm.key}
                          onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                          className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">名称</label>
                        <Input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">颜色</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editForm.color}
                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                            className="w-10 h-7 rounded cursor-pointer bg-[#2d2d2d] border border-[#3d3d3d]"
                          />
                          <Input
                            value={editForm.color}
                            onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                            className="flex-1 h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">排序</label>
                        <Input
                          type="number"
                          value={editForm.sort_order}
                          onChange={(e) => setEditForm({ ...editForm, sort_order: parseInt(e.target.value) || 0 })}
                          className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">说明</label>
                      <Input
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="h-7 bg-[#2d2d2d] border-[#3d3d3d] text-sm text-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(category.id)}
                        className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
                      >
                        <X className="w-3 h-3 mr-1" />
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{category.name}</span>
                          <span className="text-xs text-gray-500 font-mono">({category.key})</span>
                        </div>
                        {category.description && (
                          <p className="text-xs text-gray-400 mt-0.5">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(category)}
                        className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(category.id)}
                        className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#5a1e1e] text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {categories.length === 0 && !showNewForm && (
              <div className="text-center py-8 text-gray-500 text-sm">
                暂无分类，点击下方按钮创建
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="p-4 border-t border-[#3d3d3d] flex justify-between">
          <Button
            size="sm"
            onClick={() => setShowNewForm(true)}
            disabled={showNewForm}
            className="bg-[#0e639c] hover:bg-[#1177bb] text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            新建分类
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="bg-[#2d2d2d] border-[#3d3d3d] hover:bg-[#3d3d3d] text-gray-300"
          >
            关闭
          </Button>
        </div>
      </div>
    </div>
  );
}