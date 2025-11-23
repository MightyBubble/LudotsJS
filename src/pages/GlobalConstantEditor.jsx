import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Settings, Edit3, Save, X } from "lucide-react";

export default function GlobalConstantEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: constants = [] } = useQuery({
    queryKey: ['globalConstants'],
    queryFn: () => base44.entities.GlobalConstant.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GlobalConstant.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalConstants'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GlobalConstant.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalConstants'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GlobalConstant.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalConstants'] });
    },
  });

  const filteredConstants = useMemo(() => {
    if (!searchQuery) return constants;
    return constants.filter(c => 
      c.constant_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [constants, searchQuery]);

  const getDefaultValueForType = (type) => {
    switch (type) {
      case 'number': return '0';
      case 'string': return '';
      case 'boolean': return 'true';
      case 'object': return '{}';
      case 'array': return '[]';
      default: return '';
    }
  };

  const handleCreate = () => {
    const newConstant = {
      constant_key: "new_constant",
      constant_value: "0",
      value_type: "number",
      description: "",
      category: ""
    };
    createMutation.mutate(newConstant);
  };

  const handleEdit = (constant) => {
    setEditingRow(constant.id);
    setEditData({ ...constant });
  };

  const handleSave = () => {
    if (!editData.constant_key || !editData.constant_value) {
      alert('请填写键名和值');
      return;
    }
    
    // 验证JSON格式
    try {
      if (editData.value_type === 'object' || editData.value_type === 'array') {
        JSON.parse(editData.constant_value);
      }
    } catch (e) {
      alert('值格式错误，请检查JSON格式');
      return;
    }
    
    updateMutation.mutate({ id: editData.id, data: editData });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此常量吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTypeChange = (type) => {
    setEditData({
      ...editData,
      value_type: type,
      constant_value: getDefaultValueForType(type)
    });
  };

  const renderValueInput = (data, isEditing) => {
    if (!isEditing) {
      let displayValue = data.constant_value;
      try {
        if (data.value_type === 'object' || data.value_type === 'array') {
          displayValue = JSON.stringify(JSON.parse(data.constant_value), null, 2);
        }
      } catch {}
      return <span className="text-white/90 font-mono text-xs">{displayValue}</span>;
    }

    if (data.value_type === 'boolean') {
      return (
        <Select value={data.constant_value} onValueChange={(v) => setEditData({ ...editData, constant_value: v })}>
          <SelectTrigger className="h-6 bg-[#0a0a0a] border-[#262626] text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#141414] border-[#262626]">
            <SelectItem value="true" className="text-white text-xs">true</SelectItem>
            <SelectItem value="false" className="text-white text-xs">false</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (data.value_type === 'object' || data.value_type === 'array') {
      return (
        <Textarea
          value={data.constant_value}
          onChange={(e) => setEditData({ ...editData, constant_value: e.target.value })}
          className="h-20 bg-[#0a0a0a] border-[#262626] text-xs text-white font-mono"
          placeholder={data.value_type === 'object' ? '{}' : '[]'}
        />
      );
    }

    return (
      <Input
        type={data.value_type === 'number' ? 'number' : 'text'}
        step={data.value_type === 'number' ? '0.1' : undefined}
        value={data.constant_value}
        onChange={(e) => setEditData({ ...editData, constant_value: e.target.value })}
        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
      />
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      <div className="h-10 bg-[#141414] border-b border-[#262626] flex items-center px-2 md:px-4 gap-2 md:gap-3">
        <Settings className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">全局常量</span>
        <span className="text-xs text-gray-500 hidden sm:inline">共 {filteredConstants.length} 个</span>
        
        <div className="flex-1" />

        <div className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#0a0a0a] border-[#262626] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-2 md:px-3 bg-[#f97316] hover:bg-[#ea580c] text-white text-xs">
          <Plus className="w-3 h-3 md:mr-1" />
          <span className="hidden md:inline">新建</span>
        </Button>
      </div>

      <div className="md:hidden px-2 py-2 bg-[#252526] border-b border-[#262626]">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-7 w-full bg-[#0a0a0a] border-[#262626] text-sm text-white"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs text-white hidden md:table">
          <thead className="bg-[#141414] border-b border-[#262626] sticky top-0 z-10">
            <tr>
              <th className="text-left p-2 font-medium text-white/70 w-48">常量键</th>
              <th className="text-left p-2 font-medium text-white/70 w-24">类型</th>
              <th className="text-left p-2 font-medium text-white/70">值</th>
              <th className="text-left p-2 font-medium text-white/70 w-32">分类</th>
              <th className="text-left p-2 font-medium text-white/70">说明</th>
              <th className="text-right p-2 font-medium text-white/70 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredConstants.map((constant) => {
              const isEditing = editingRow === constant.id;
              const currentData = isEditing ? editData : constant;
              
              return (
                <tr key={constant.id} className="border-b border-[#262626] hover:bg-[#141414]">
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.constant_key}
                        onChange={(e) => setEditData({ ...editData, constant_key: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white font-mono"
                      />
                    ) : (
                      <span className="text-white/90 font-mono">{constant.constant_key}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Select value={editData.value_type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="h-6 bg-[#0a0a0a] border-[#262626] text-white text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#141414] border-[#262626]">
                          <SelectItem value="number" className="text-white text-xs">数值</SelectItem>
                          <SelectItem value="string" className="text-white text-xs">字符串</SelectItem>
                          <SelectItem value="boolean" className="text-white text-xs">布尔</SelectItem>
                          <SelectItem value="object" className="text-white text-xs">对象</SelectItem>
                          <SelectItem value="array" className="text-white text-xs">数组</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-white/70">{constant.value_type}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {renderValueInput(currentData, isEditing)}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.category || ''}
                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                        placeholder="分类"
                      />
                    ) : (
                      <span className="text-white/70">{constant.category}</span>
                    )}
                  </td>
                  <td className="p-2">
                    {isEditing ? (
                      <Input
                        value={editData.description || ''}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="h-6 bg-[#0a0a0a] border-[#262626] text-xs text-white"
                        placeholder="说明"
                      />
                    ) : (
                      <span className="text-white/70">{constant.description}</span>
                    )}
                  </td>
                  <td className="p-2 text-right">
                    {isEditing ? (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="h-6 px-2 bg-[#f97316] hover:bg-[#ea580c]"
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCancel}
                          className="h-6 px-2 bg-[#262626] hover:bg-[#4d4d4d]"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleEdit(constant)}
                          className="text-white/30 hover:text-blue-400"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(constant.id)}
                          className="text-white/30 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="md:hidden space-y-2 p-2">
          {filteredConstants.map((constant) => {
            const isEditing = editingRow === constant.id;
            const currentData = isEditing ? editData : constant;

            return (
              <div key={constant.id} className="bg-[#252526] rounded border border-[#3e3e42] p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white font-mono">{currentData.constant_key}</div>
                    <div className="text-xs text-white/70">{currentData.value_type}</div>
                  </div>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-6 px-2 bg-[#f97316] hover:bg-[#ea580c]">
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#262626] hover:bg-[#4d4d4d]">
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(constant)} className="text-white/30 hover:text-blue-400 p-1">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(constant.id)} className="text-white/30 hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-white/50">
                  {currentData.description || '无说明'}
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredConstants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无全局常量</p>
          </div>
        )}
      </div>
    </div>
  );
}