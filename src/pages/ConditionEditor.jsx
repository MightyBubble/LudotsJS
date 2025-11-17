import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, GitBranch, Edit3, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import PresetConditionEditor from "../components/condition/PresetConditionEditor";
import FunctionGraphConditionEditor from "../components/condition/FunctionGraphConditionEditor";
import ConditionGroupEditor from "../components/condition/ConditionGroupEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function ConditionEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const queryClient = useQueryClient();

  const { data: conditions = [] } = useQuery({
    queryKey: ['conditions'],
    queryFn: () => base44.entities.ConditionDefinition.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConditionDefinition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ConditionDefinition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ConditionDefinition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
    },
  });

  const filteredConditions = useMemo(() => {
    if (!searchQuery) return conditions;
    return conditions.filter(c => 
      c.condition_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [conditions, searchQuery]);

  const handleCreate = (type) => {
    const newCondition = {
      condition_id: `condition_${Date.now()}`,
      name: "新条件",
      description: "",
      condition_type: type,
      is_active: true,
      evaluate_context_parameters: [],
      ...(type === 'preset' && { preset_config: { preset_name: 'equals', param1_source: null, param2_source: null } }),
      ...(type === 'function_graph' && { function_graph_config: { function_graph_id: '', input_mappings: [] } }),
      ...(type === 'group' && { group_config: { logic_operator: 'AND', sub_conditions: '[]' } })
    };
    createMutation.mutate(newCondition);
  };

  const handleEdit = (condition) => {
    setEditingId(condition.id);
    setEditData({ ...condition });
  };

  const handleSave = () => {
    if (!editData.condition_id || !editData.name) {
      alert('请填写条件ID和名称');
      return;
    }
    updateMutation.mutate({ id: editData.id, data: editData });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此条件吗？')) {
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

  const getConditionSummary = (condition) => {
    if (condition.condition_type === 'preset') {
      const preset = condition.preset_config?.preset_name || '';
      return `预设: ${preset}`;
    }
    if (condition.condition_type === 'function_graph') {
      const graphId = condition.function_graph_config?.function_graph_id || '';
      return `函数图: ${graphId}`;
    }
    if (condition.condition_type === 'group') {
      const op = condition.group_config?.logic_operator || '';
      const subCount = condition.group_config?.sub_conditions ? 
        (typeof condition.group_config.sub_conditions === 'string' ? 
          JSON.parse(condition.group_config.sub_conditions).length : 
          condition.group_config.sub_conditions.length) : 0;
      return `条件组: ${op} (${subCount}个子条件)`;
    }
    return '';
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-2 md:px-4 gap-2 md:gap-3">
        <GitBranch className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">条件编辑器</span>
        <span className="text-xs text-gray-500 hidden sm:inline">共 {filteredConditions.length} 个</span>
        
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

        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 px-2 md:px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs">
              <Plus className="w-3 h-3 md:mr-1" />
              <span className="hidden md:inline">新建</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2d2d30] border-[#3e3e42] text-white">
            <DialogHeader><DialogTitle className="text-white">新建条件</DialogTitle></DialogHeader>
            <div className="space-y-3 py-4">
              <Button onClick={() => handleCreate('preset')} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">
                预设条件
              </Button>
              <Button onClick={() => handleCreate('function_graph')} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">
                函数图条件
              </Button>
              <Button onClick={() => handleCreate('group')} className="w-full bg-[#0e639c] hover:bg-[#1177bb]">
                条件组
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          {filteredConditions.map((condition) => {
            const isEditing = editingId === condition.id;
            const isExpanded = expandedRows.has(condition.id);
            const currentData = isEditing ? editData : condition;

            return (
              <div key={condition.id} className="bg-[#252526] rounded border border-[#3e3e42]">
                <div className="p-3 flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editData.condition_id}
                          onChange={(e) => setEditData({ ...editData, condition_id: e.target.value })}
                          placeholder="条件ID"
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
                          {condition.name}
                          <span className="text-xs text-white/50 ml-2 font-mono">{condition.condition_id}</span>
                        </div>
                        <div className="text-xs text-white/70 mb-1">{getConditionSummary(condition)}</div>
                        {condition.description && (
                          <div className="text-xs text-white/50">{condition.description}</div>
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
                          onClick={() => toggleExpand(condition.id)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(condition)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(condition.id)}
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
                      {currentData.condition_type === 'preset' && (
                        <PresetConditionEditor
                          config={currentData.preset_config}
                          onChange={(val) => isEditing && setEditData({ ...editData, preset_config: val })}
                        />
                      )}

                      {currentData.condition_type === 'function_graph' && (
                        <FunctionGraphConditionEditor
                          config={currentData.function_graph_config}
                          onChange={(val) => isEditing && setEditData({ ...editData, function_graph_config: val })}
                        />
                      )}

                      {currentData.condition_type === 'group' && (
                        <ConditionGroupEditor
                          config={currentData.group_config}
                          onChange={(val) => isEditing && setEditData({ ...editData, group_config: val })}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {filteredConditions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <GitBranch className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无条件定义</p>
          </div>
        )}
      </div>
    </div>
  );
}