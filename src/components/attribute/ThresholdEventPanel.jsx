import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Zap, Edit2, Save, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ThresholdEventPanel({ attributeId, attributeKeys = [] }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState(null);
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery({
    queryKey: ['thresholdEvents', attributeId],
    queryFn: async () => {
      const all = await base44.entities.AttributeThresholdEvent.list();
      return all.filter(e => e.attribute_id === attributeId);
    },
    initialData: [],
    enabled: !!attributeId
  });

  const { data: gameEvents = [] } = useQuery({
    queryKey: ['gameEvents'],
    queryFn: () => base44.entities.GameEvent.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AttributeThresholdEvent.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['thresholdEvents'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AttributeThresholdEvent.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thresholdEvents'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AttributeThresholdEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['thresholdEvents'] }),
  });

  const handleCreate = () => {
    const newEvent = {
      rule_name: '新阈值事件',
      attribute_id: attributeId,
      attribute_key: attributeKeys[0]?.name || '',
      comparison_mode: 'absolute',
      operator: 'gte',
      threshold_value: 0,
      event_id: gameEvents[0]?.event_id || '',
      parameter_bindings: [],
      is_active: true
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

  const addBinding = () => {
    const selectedEvent = gameEvents.find(e => e.event_id === editData.event_id);
    const availableParams = selectedEvent?.output_parameters || [];
    const newBinding = {
      event_param_name: availableParams[0]?.name || '',
      source_type: 'attribute_value',
      constant_value: null
    };
    setEditData({
      ...editData,
      parameter_bindings: [...(editData.parameter_bindings || []), newBinding]
    });
  };

  const updateBinding = (index, field, value) => {
    const bindings = [...(editData.parameter_bindings || [])];
    bindings[index] = { ...bindings[index], [field]: value };
    setEditData({ ...editData, parameter_bindings: bindings });
  };

  const removeBinding = (index) => {
    const bindings = (editData.parameter_bindings || []).filter((_, i) => i !== index);
    setEditData({ ...editData, parameter_bindings: bindings });
  };

  if (!attributeId) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-white/90">阈值事件</span>
        </div>
        <Button onClick={handleCreate} size="sm" className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
          <Plus className="w-3 h-3" />
        </Button>
      </div>

      <div className="space-y-2">
        {events.map((event) => {
          const isEditing = editingId === event.id;
          const data = isEditing ? editData : event;
          const selectedEvent = gameEvents.find(e => e.event_id === data.event_id);

          return (
            <div key={event.id} className="bg-[#1e1e1e] rounded border border-[#3e3e42] p-2">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 space-y-1.5">
                  {isEditing ? (
                    <Input
                      value={data.rule_name || ''}
                      onChange={(e) => setEditData({ ...data, rule_name: e.target.value })}
                      className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
                      placeholder="规则名称"
                    />
                  ) : (
                    <div className="text-sm text-white/90 font-medium">{data.rule_name}</div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                    {isEditing ? (
                      <>
                        <Select value={data.comparison_mode || 'absolute'} onValueChange={(v) => setEditData({ ...data, comparison_mode: v })}>
                          <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                            <SelectItem value="absolute" className="text-white text-xs">绝对值</SelectItem>
                            <SelectItem value="ratio" className="text-white text-xs">比例</SelectItem>
                            <SelectItem value="compare_key" className="text-white text-xs">比较键</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={data.attribute_key || ''} onValueChange={(v) => setEditData({ ...data, attribute_key: v })}>
                          <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                            <SelectValue placeholder="键" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                            {attributeKeys.map(k => (
                              <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {data.comparison_mode === 'compare_key' && (
                          <Select value={data.compare_target_key || ''} onValueChange={(v) => setEditData({ ...data, compare_target_key: v })}>
                            <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                              <SelectValue placeholder="目标键" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                              {attributeKeys.map(k => (
                                <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-white/70">
                          {data.comparison_mode === 'absolute' ? '绝对值' : data.comparison_mode === 'ratio' ? '比例' : '比较键'}
                        </div>
                        <div className="text-xs text-white/70 font-mono">{data.attribute_key}</div>
                        {data.comparison_mode === 'compare_key' && (
                          <div className="text-xs text-white/70 font-mono">{data.compare_target_key}</div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {isEditing ? (
                      <>
                        <Select value={data.operator} onValueChange={(v) => setEditData({ ...data, operator: v })}>
                          <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                            <SelectItem value="gt" className="text-white text-xs">&gt;</SelectItem>
                            <SelectItem value="lt" className="text-white text-xs">&lt;</SelectItem>
                            <SelectItem value="gte" className="text-white text-xs">≥</SelectItem>
                            <SelectItem value="lte" className="text-white text-xs">≤</SelectItem>
                            <SelectItem value="eq" className="text-white text-xs">=</SelectItem>
                            <SelectItem value="neq" className="text-white text-xs">≠</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          step={data.comparison_mode === 'ratio' ? '0.01' : '0.1'}
                          value={data.threshold_value || 0}
                          onChange={(e) => setEditData({ ...data, threshold_value: parseFloat(e.target.value) || 0 })}
                          className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white"
                          placeholder={data.comparison_mode === 'ratio' ? '0.0-1.0' : '阈值'}
                        />
                        <Select value={data.event_id} onValueChange={(v) => setEditData({ ...data, event_id: v })}>
                          <SelectTrigger className="h-6 text-xs bg-[#2d2d30] border-[#434343] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                            {gameEvents.map(e => (
                              <SelectItem key={e.id} value={e.event_id} className="text-white text-xs">{e.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    ) : (
                      <>
                        <div className="text-xs text-white/70">{data.operator}</div>
                        <div className="text-xs text-white/70">{data.threshold_value}</div>
                        <div className="text-xs text-white/70 truncate">{gameEvents.find(e => e.event_id === data.event_id)?.name || data.event_id}</div>
                      </>
                    )}
                  </div>

                  {isEditing && selectedEvent?.output_parameters?.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-white/50">参数绑定</label>
                        <Button onClick={addBinding} size="sm" className="h-5 px-1.5 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
                          <Plus className="w-2 h-2" />
                        </Button>
                      </div>
                      {(data.parameter_bindings || []).map((binding, idx) => (
                        <div key={idx} className="flex gap-1">
                          <Select value={binding.event_param_name} onValueChange={(v) => updateBinding(idx, 'event_param_name', v)}>
                            <SelectTrigger className="h-5 text-xs bg-[#2d2d30] border-[#434343] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                              {selectedEvent.output_parameters.map(p => (
                                <SelectItem key={p.name} value={p.name} className="text-white text-xs">{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={binding.source_type} onValueChange={(v) => updateBinding(idx, 'source_type', v)}>
                            <SelectTrigger className="h-5 text-xs bg-[#2d2d30] border-[#434343] text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#2d2d30] border-[#3e3e42]">
                              <SelectItem value="attribute_value" className="text-white text-xs">属性值</SelectItem>
                              <SelectItem value="threshold_value" className="text-white text-xs">阈值</SelectItem>
                              <SelectItem value="entity" className="text-white text-xs">实体</SelectItem>
                              <SelectItem value="constant" className="text-white text-xs">常量</SelectItem>
                            </SelectContent>
                          </Select>
                          {binding.source_type === 'constant' && (
                            <Input
                              value={binding.constant_value ?? ''}
                              onChange={(e) => updateBinding(idx, 'constant_value', e.target.value)}
                              className="h-5 text-xs bg-[#2d2d30] border-[#434343] text-white flex-1"
                            />
                          )}
                          <button onClick={() => removeBinding(idx)} className="text-white/30 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} size="sm" className="h-6 px-2 bg-green-600 hover:bg-green-700">
                        <Save className="w-3 h-3" />
                      </Button>
                      <Button onClick={() => { setEditingId(null); setEditData(null); }} size="sm" variant="ghost" className="h-6 px-2 text-white/60">
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(event)} className="text-white/30 hover:text-blue-400 p-1">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => deleteMutation.mutate(event.id)} className="text-white/30 hover:text-red-400 p-1">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-xs text-white/30 text-center py-3 border border-dashed border-[#3e3e42] rounded">
            暂无阈值事件
          </div>
        )}
      </div>
    </div>
  );
}