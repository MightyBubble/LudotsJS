import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Trash2, Shield, Edit3, Save, X, ChevronDown, ChevronUp } from "lucide-react";

export default function ValidatorEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const queryClient = useQueryClient();

  const { data: validators = [] } = useQuery({
    queryKey: ['validators'],
    queryFn: () => base44.entities.Validator.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Validator.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validators'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Validator.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validators'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Validator.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validators'] });
    },
  });

  const filteredValidators = useMemo(() => {
    if (!searchQuery) return validators;
    return validators.filter(v => 
      v.validator_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [validators, searchQuery]);

  const handleCreate = (type) => {
    const newValidator = {
      validator_id: `validator_${Date.now()}`,
      name: "新验证器",
      description: "",
      validator_type: type,
      negate: false,
      failure_result: "false"
    };
    createMutation.mutate(newValidator);
  };

  const handleEdit = (validator) => {
    setEditingId(validator.id);
    setEditData({ ...validator });
  };

  const handleSave = () => {
    if (!editData.validator_id || !editData.name) {
      alert('请填写验证器ID和名称');
      return;
    }
    updateMutation.mutate({ id: editData.id, data: editData });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此验证器吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpand = (id) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getValidatorTypeName = (type) => {
    const typeMap = {
      unit_compare: '单位比较',
      unit_test: '单位测试',
      unit_filters: '单位过滤',
      location: '位置验证',
      player: '玩家验证',
      combine: '组合验证器'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-2 md:px-4 gap-2 md:gap-3">
        <Shield className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">验证器编辑器</span>
        <span className="text-xs text-gray-500 hidden sm:inline">共 {filteredValidators.length} 个</span>
        
        <div className="flex-1" />

        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </div>

        <div className="flex gap-1">
          <Button size="sm" onClick={() => handleCreate('unit_test')} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
            <Plus className="w-3 h-3 mr-1" />
            <span className="hidden md:inline">单位测试</span>
          </Button>
          <Button size="sm" onClick={() => handleCreate('unit_compare')} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs hidden md:flex">
            单位比较
          </Button>
        </div>
      </div>

      <div className="md:hidden px-2 py-2 bg-[#252526] border-b border-[#3d3d3d]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 w-full bg-[#1e1e1e] border-[#3d3d3d] text-sm text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="space-y-2 p-2 md:p-4">
          {filteredValidators.map((validator) => {
            const isEditing = editingId === validator.id;
            const isExpanded = expandedRows.has(validator.id);
            const currentData = isEditing ? editData : validator;

            return (
              <div key={validator.id} className="bg-[#252526] rounded border border-[#3e3e42]">
                <div className="p-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editData.validator_id}
                          onChange={(e) => setEditData({ ...editData, validator_id: e.target.value })}
                          placeholder="验证器ID"
                          className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                        />
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          placeholder="名称"
                          className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                        />
                        <Textarea
                          value={editData.description || ''}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          placeholder="描述"
                          className="h-16 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-white mb-1">
                          {validator.name}
                          <span className="text-xs text-white/50 ml-2 font-mono">{validator.validator_id}</span>
                        </div>
                        <div className="text-xs text-white/70 mb-1">
                          类型: {getValidatorTypeName(validator.validator_type)}
                          {validator.negate && <span className="text-red-400 ml-2">(取反)</span>}
                        </div>
                        {validator.description && (
                          <div className="text-xs text-white/50">{validator.description}</div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-1 ml-3">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb]"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCancel}
                          className="h-7 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d]"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleExpand(validator.id)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(validator)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(validator.id)}
                          className="text-white/30 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 border-t border-[#3e3e42]">
                    <div className="mt-3 text-xs text-white/50">
                      详细配置编辑器正在开发中...
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredValidators.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无验证器</p>
          </div>
        )}
      </div>
    </div>
  );
}