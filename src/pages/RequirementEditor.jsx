import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Trash2, X, Save, CheckSquare } from "lucide-react";

export default function RequirementEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: () => base44.entities.Requirement.list(),
    initialData: [],
  });

  const { data: validators = [] } = useQuery({
    queryKey: ['validators'],
    queryFn: () => base44.entities.Validator.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Requirement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
      setCreatingNew(false);
      setEditData(null);
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

  const handleCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      requirement_id: "",
      name: "",
      description: "",
      requirement_type: "node",
      state: "active",
      node_config: { logic_operator: 'AND', sub_requirements: [] }
    });
  };

  const handleEdit = (requirement) => {
    setEditingId(requirement.id);
    setCreatingNew(false);
    setEditData({ ...requirement });
  };

  const handleSave = () => {
    if (!editData.requirement_id || !editData.name) {
      alert('请填写需求ID和名称');
      return;
    }
    if (creatingNew) {
      createMutation.mutate(editData);
    } else {
      updateMutation.mutate({ id: editData.id, data: editData });
    }
  };

  const handleCancel = () => {
    setCreatingNew(false);
    setEditingId(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此需求吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const renderConfigCell = (requirement) => {
    if (requirement.requirement_type === 'node') {
      const cfg = requirement.node_config || {};
      return (
        <div className="text-xs text-gray-300">
          {cfg.logic_operator && <div>逻辑: {cfg.logic_operator}</div>}
          {cfg.sub_requirements && <div>子项: {cfg.sub_requirements.length}个</div>}
        </div>
      );
    }
    if (requirement.requirement_type === 'count') {
      const cfg = requirement.count_config || {};
      return (
        <div className="text-xs text-gray-300">
          {cfg.count_type && <div>类型: {cfg.count_type}</div>}
          {cfg.operator && <div>操作: {cfg.operator}</div>}
          {cfg.count_value !== undefined && <div>值: {cfg.count_value}</div>}
        </div>
      );
    }
    return <span className="text-gray-600">-</span>;
  };

  const renderEditRow = (data) => {
    return (
      <tr className="border-b border-[#2A2E37] bg-[#15171C]">
        <td className="p-2">
          <Input
            value={data.requirement_id}
            onChange={(e) => setEditData({ ...data, requirement_id: e.target.value })}
            className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
            placeholder="需求ID"
          />
        </td>
        <td className="p-2">
          <Input
            value={data.name}
            onChange={(e) => setEditData({ ...data, name: e.target.value })}
            className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
            placeholder="名称"
          />
        </td>
        <td className="p-2">
          <Select
            value={data.requirement_type}
            onValueChange={(val) => setEditData({ ...data, requirement_type: val })}
          >
            <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37]">
              <SelectItem value="node" className="text-white text-xs">节点</SelectItem>
              <SelectItem value="count" className="text-white text-xs">计数</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <span className="text-xs text-gray-500">编辑配置...</span>
        </td>
        <td className="p-2">
          <Select
            value={data.state}
            onValueChange={(val) => setEditData({ ...data, state: val })}
          >
            <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37]">
              <SelectItem value="active" className="text-white text-xs">激活</SelectItem>
              <SelectItem value="disabled" className="text-white text-xs">禁用</SelectItem>
              <SelectItem value="hidden" className="text-white text-xs">隐藏</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-6 px-2 bg-[#D97706] hover:bg-[#B45309] text-xs">
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#0D0F14] text-white">
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] flex items-center px-4 gap-3">
        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#262626] hover:bg-[#4d4d4d] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#15171C] border-b border-[#2A2E37]">
            <tr>
              <th className="text-left p-2 font-semibold text-gray-300 w-48">需求ID</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">名称</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-24">类型</th>
              <th className="text-left p-2 font-semibold text-gray-300">配置</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-24">状态</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && renderEditRow(editData)}
            
            {filteredRequirements.map((requirement) => {
              const isEditing = editingId === requirement.id;
              
              if (isEditing && editData) {
                return <React.Fragment key={requirement.id}>{renderEditRow(editData)}</React.Fragment>;
              }
              
              return (
                <tr key={requirement.id} className="border-b border-[#2A2E37] hover:bg-[#15171C]">
                  <td className="p-2 text-gray-300 font-mono">{requirement.requirement_id}</td>
                  <td className="p-2 text-gray-300">{requirement.name}</td>
                  <td className="p-2 text-gray-300">{requirement.requirement_type === 'node' ? '节点' : '计数'}</td>
                  <td className="p-2">{renderConfigCell(requirement)}</td>
                  <td className="p-2 text-gray-300">{requirement.state}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(requirement)} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(requirement.id)} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#5a1e1e]">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredRequirements.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无需求</div>
          </div>
        )}
      </div>
    </div>
  );
}