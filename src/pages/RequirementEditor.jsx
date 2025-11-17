import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Trash2, CheckSquare, Edit3, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import RequirementNodeEditor from "../components/requirement/RequirementNodeEditor";

export default function RequirementEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const queryClient = useQueryClient();

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Requirement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Requirement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Requirement.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });

  const filteredRequirements = useMemo(() => {
    if (!searchQuery) return requirements;
    return requirements.filter(r => 
      r.requirement_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [requirements, searchQuery]);

  const handleCreate = (type) => {
    const newRequirement = {
      requirement_id: `requirement_${Date.now()}`,
      name: "新需求",
      description: "",
      requirement_type: type,
      state: "active",
      ...(type === 'node' && { 
        node_config: { 
          logic_operator: 'AND', 
          sub_requirements: [] 
        } 
      }),
      ...(type === 'count' && { 
        count_config: { 
          count_type: 'validator_true_count',
          operator: 'gte',
          count_value: 1
        } 
      })
    };
    createMutation.mutate(newRequirement);
  };

  const handleEdit = (requirement) => {
    setEditingId(requirement.id);
    setEditData({ ...requirement });
  };

  const handleSave = () => {
    if (!editData.requirement_id || !editData.name) {
      alert('请填写需求ID和名称');
      return;
    }
    updateMutation.mutate({ id: editData.id, data: editData });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此需求吗？')) {
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

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-2 md:px-4 gap-2 md:gap-3">
        <CheckSquare className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">需求编辑器</span>
        <span className="text-xs text-gray-500 hidden sm:inline">共 {filteredRequirements.length} 个</span>
        
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
          <Button size="sm" onClick={() => handleCreate('node')} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
            <Plus className="w-3 h-3 mr-1" />
            <span className="hidden md:inline">节点</span>
          </Button>
          <Button size="sm" onClick={() => handleCreate('count')} className="h-7 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs hidden md:flex">
            计数
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
          {filteredRequirements.map((requirement) => {
            const isEditing = editingId === requirement.id;
            const isExpanded = expandedRows.has(requirement.id);
            const currentData = isEditing ? editData : requirement;

            return (
              <div key={requirement.id} className="bg-[#252526] rounded border border-[#3e3e42]">
                <div className="p-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editData.requirement_id}
                          onChange={(e) => setEditData({ ...editData, requirement_id: e.target.value })}
                          placeholder="需求ID"
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
                        <Input
                          value={editData.tooltip || ''}
                          onChange={(e) => setEditData({ ...editData, tooltip: e.target.value })}
                          placeholder="提示文本"
                          className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                        />
                        <Input
                          value={editData.error_message || ''}
                          onChange={(e) => setEditData({ ...editData, error_message: e.target.value })}
                          placeholder="错误消息"
                          className="h-7 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-sm font-semibold text-white mb-1">
                          {requirement.name}
                          <span className="text-xs text-white/50 ml-2 font-mono">{requirement.requirement_id}</span>
                        </div>
                        <div className="text-xs text-white/70 mb-1">
                          类型: {requirement.requirement_type === 'node' ? '节点' : '计数'}
                          {requirement.state !== 'active' && <span className="text-yellow-400 ml-2">({requirement.state})</span>}
                        </div>
                        {requirement.description && (
                          <div className="text-xs text-white/50">{requirement.description}</div>
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
                          onClick={() => toggleExpand(requirement.id)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(requirement)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(requirement.id)}
                          className="text-white/30 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {(isExpanded || isEditing) && (
                  <div className="px-3 pb-3 pt-0 border-t border-[#3e3e42]">
                    <div className="mt-3">
                      {currentData.requirement_type === 'node' && (
                        <RequirementNodeEditor
                          config={currentData.node_config}
                          onChange={(val) => isEditing && setEditData({ ...editData, node_config: val })}
                        />
                      )}

                      {currentData.requirement_type === 'count' && (
                        <div className="text-xs text-white/50">计数需求编辑器正在开发中...</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredRequirements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无需求</p>
          </div>
        )}
      </div>
    </div>
  );
}