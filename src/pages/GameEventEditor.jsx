import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, Search, Plus, Trash2, Edit2, Save, X } from "lucide-react";

export default function GameEventEditor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['gameEvents'],
    queryFn: () => base44.entities.GameEvent.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GameEvent.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameEvents'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GameEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameEvents'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GameEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gameEvents'] }),
  });

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    return events.filter(e =>
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.event_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [events, searchQuery]);

  const handleCreate = () => {
    const newEvent = {
      event_id: `event_${Date.now()}`,
      name: '新事件',
      description: '',
      input_parameters: [],
      output_parameters: [],
      category: ''
    };
    createMutation.mutate(newEvent);
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setEditData({ ...event });
  };

  const handleSave = () => {
    if (!editData) return;
    updateMutation.mutate({ id: editingId, data: editData });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData(null);
  };

  const getDefaultValueForType = (type) => {
    switch (type) {
      case 'number': return '0';
      case 'boolean': return 'false';
      case 'string': return '""';
      case 'array': return '[]';
      case 'object': return '{}';
      case 'entity': return 'null';
      case 'entities': return '[]';
      default: return 'null';
    }
  };

  const addParameter = (type) => {
    const paramList = type === 'input' ? 'input_parameters' : 'output_parameters';
    const newParam = {
      name: `param_${(editData[paramList]?.length || 0) + 1}`,
      type: 'number',
      description: ''
    };
    if (type === 'input') newParam.default_value = '0';
    
    setEditData({
      ...editData,
      [paramList]: [...(editData[paramList] || []), newParam]
    });
  };

  const updateParameter = (type, index, field, value) => {
    const paramList = type === 'input' ? 'input_parameters' : 'output_parameters';
    const params = [...(editData[paramList] || [])];
    
    if (field === 'type' && type === 'input') {
      params[index] = { 
        ...params[index], 
        [field]: value,
        default_value: getDefaultValueForType(value)
      };
    } else {
      params[index] = { ...params[index], [field]: value };
    }
    
    setEditData({ ...editData, [paramList]: params });
  };

  const removeParameter = (type, index) => {
    const paramList = type === 'input' ? 'input_parameters' : 'output_parameters';
    const params = (editData[paramList] || []).filter((_, i) => i !== index);
    setEditData({ ...editData, [paramList]: params });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white">
      <div className="h-10 bg-[#141414] border-b border-[#262626] flex items-center px-2 md:px-4 gap-2 md:gap-3">
        <Zap className="w-4 h-4 text-yellow-400" />
        <span className="text-sm font-semibold text-gray-300">事件编辑器</span>
        <span className="text-xs text-gray-500 hidden sm:inline">共 {filteredEvents.length} 个</span>
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
        <Button onClick={handleCreate} size="sm" className="h-7 px-2 md:px-3 bg-[#D97706] hover:bg-[#B45309] text-xs">
          <Plus className="w-3 h-3 md:mr-1" />
          <span className="hidden md:inline">新建事件</span>
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

      <div className="flex-1 overflow-auto p-2 md:p-4">
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const isEditing = editingId === event.id;
            const data = isEditing ? editData : event;

            return (
              <div key={event.id} className="bg-[#252526] rounded border border-[#3e3e42] p-3 md:p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">事件ID</label>
                      {isEditing ? (
                        <Input
                          value={data.event_id || ''}
                          onChange={(e) => setEditData({ ...data, event_id: e.target.value })}
                          className="h-7 text-xs bg-[#3c3c3c] border-[#434343] text-white"
                        />
                      ) : (
                        <div className="text-sm text-white/90 font-mono break-all">{data.event_id}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">事件名称</label>
                      {isEditing ? (
                        <Input
                          value={data.name || ''}
                          onChange={(e) => setEditData({ ...data, name: e.target.value })}
                          className="h-7 text-xs bg-[#3c3c3c] border-[#434343] text-white"
                        />
                      ) : (
                        <div className="text-sm text-white/90">{data.name}</div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-white/50 mb-1 block">分类</label>
                      {isEditing ? (
                        <Input
                          value={data.category || ''}
                          onChange={(e) => setEditData({ ...data, category: e.target.value })}
                          className="h-7 text-xs bg-[#3c3c3c] border-[#434343] text-white"
                        />
                      ) : (
                        <div className="text-sm text-white/90">{data.category || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {isEditing ? (
                      <>
                        <Button onClick={handleSave} size="sm" className="h-7 px-2 bg-green-600 hover:bg-green-700">
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button onClick={handleCancel} size="sm" variant="ghost" className="h-7 px-2 text-white/60">
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => handleEdit(event)} size="sm" variant="ghost" className="h-7 px-2 text-white/60">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button onClick={() => deleteMutation.mutate(event.id)} size="sm" variant="ghost" className="h-7 px-2 text-red-400 hover:text-red-300">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {data.description && (
                  <div className="mb-3">
                    <label className="text-xs text-white/50 mb-1 block">描述</label>
                    {isEditing ? (
                      <Input
                        value={data.description || ''}
                        onChange={(e) => setEditData({ ...data, description: e.target.value })}
                        className="h-7 text-xs bg-[#3c3c3c] border-[#434343] text-white"
                      />
                    ) : (
                      <div className="text-xs text-white/70">{data.description}</div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-white/50">输入参数（订阅）</label>
                      {isEditing && (
                        <Button onClick={() => addParameter('input')} size="sm" className="h-5 px-2 bg-[#D97706] hover:bg-[#B45309] text-xs">
                          <Plus className="w-2 h-2" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {(data.input_parameters || []).map((param, idx) => (
                        <div key={idx} className="bg-[#0a0a0a] rounded p-2 border border-[#3e3e42]">
                          {isEditing ? (
                            <div className="space-y-1.5">
                              <div className="flex gap-1.5">
                                <Input
                                  placeholder="参数名"
                                  value={param.name || ''}
                                  onChange={(e) => updateParameter('input', idx, 'name', e.target.value)}
                                  className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white flex-1"
                                />
                                <Select
                                  value={param.type || 'number'}
                                  onValueChange={(v) => updateParameter('input', idx, 'type', v)}
                                >
                                  <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                                    <SelectItem value="number" className="text-white text-xs">number</SelectItem>
                                    <SelectItem value="boolean" className="text-white text-xs">boolean</SelectItem>
                                    <SelectItem value="string" className="text-white text-xs">string</SelectItem>
                                    <SelectItem value="array" className="text-white text-xs">array</SelectItem>
                                    <SelectItem value="object" className="text-white text-xs">object</SelectItem>
                                    <SelectItem value="entity" className="text-white text-xs">entity</SelectItem>
                                    <SelectItem value="entities" className="text-white text-xs">entities</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button onClick={() => removeParameter('input', idx)} size="sm" variant="ghost" className="h-6 px-1.5 text-red-400">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="默认值"
                                value={param.default_value ?? ''}
                                onChange={(e) => updateParameter('input', idx, 'default_value', e.target.value)}
                                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
                              />
                            </div>
                          ) : (
                            <div className="text-xs">
                              <span className="text-white/90 font-mono">{param.name}</span>
                              <span className="text-white/50 ml-2">{param.type}</span>
                              {param.default_value !== undefined && param.default_value !== null && (
                                <span className="text-white/40 ml-2">= {param.default_value}</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {(!data.input_parameters || data.input_parameters.length === 0) && (
                        <div className="text-xs text-white/30 text-center py-2">无参数</div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs text-white/50">输出参数（触发）</label>
                      {isEditing && (
                        <Button onClick={() => addParameter('output')} size="sm" className="h-5 px-2 bg-[#D97706] hover:bg-[#B45309] text-xs">
                          <Plus className="w-2 h-2" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {(data.output_parameters || []).map((param, idx) => (
                        <div key={idx} className="bg-[#0a0a0a] rounded p-2 border border-[#3e3e42]">
                          {isEditing ? (
                            <div className="flex gap-1.5">
                              <Input
                                placeholder="参数名"
                                value={param.name || ''}
                                onChange={(e) => updateParameter('output', idx, 'name', e.target.value)}
                                className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white flex-1"
                              />
                              <Select
                                value={param.type || 'number'}
                                onValueChange={(v) => updateParameter('output', idx, 'type', v)}
                              >
                                <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                                  <SelectItem value="number" className="text-white text-xs">number</SelectItem>
                                  <SelectItem value="boolean" className="text-white text-xs">boolean</SelectItem>
                                  <SelectItem value="string" className="text-white text-xs">string</SelectItem>
                                  <SelectItem value="array" className="text-white text-xs">array</SelectItem>
                                  <SelectItem value="object" className="text-white text-xs">object</SelectItem>
                                  <SelectItem value="entity" className="text-white text-xs">entity</SelectItem>
                                  <SelectItem value="entities" className="text-white text-xs">entities</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button onClick={() => removeParameter('output', idx)} size="sm" variant="ghost" className="h-6 px-1.5 text-red-400">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs">
                              <span className="text-white/90 font-mono">{param.name}</span>
                              <span className="text-white/50 ml-2">{param.type}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {(!data.output_parameters || data.output_parameters.length === 0) && (
                        <div className="text-xs text-white/30 text-center py-2">无参数</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无事件</p>
          </div>
        )}
      </div>
    </div>
  );
}