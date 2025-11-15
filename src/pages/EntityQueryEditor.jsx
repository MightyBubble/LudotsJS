import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Trash2, Filter, Edit3, Save, X, ChevronRight, ChevronDown } from "lucide-react";

function ConditionEditor({ condition, onChange, onDelete, level = 0, attributes, tags, relations, prototypes }) {
  const [expanded, setExpanded] = useState(true);

  const updateCondition = (updates) => {
    onChange({ ...condition, ...updates });
  };

  const addChildCondition = () => {
    const newCondition = { type: 'prototype', prototype_id: '' };
    onChange({
      ...condition,
      conditions: [...(condition.conditions || []), newCondition]
    });
  };

  const updateChildCondition = (index, childCondition) => {
    const newConditions = [...(condition.conditions || [])];
    newConditions[index] = childCondition;
    onChange({ ...condition, conditions: newConditions });
  };

  const deleteChildCondition = (index) => {
    const newConditions = (condition.conditions || []).filter((_, i) => i !== index);
    onChange({ ...condition, conditions: newConditions });
  };

  if (condition.type === 'group') {
    return (
      <div className={`border border-[#3d3d3d] rounded bg-[#2d2d2d] p-2 ${level > 0 ? 'ml-4' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => setExpanded(!expanded)} className="text-white/70 hover:text-white">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <Select value={condition.operator || 'and'} onValueChange={(val) => updateCondition({ operator: val })}>
            <SelectTrigger className="h-6 w-20 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="and" className="text-white text-xs">与 (AND)</SelectItem>
              <SelectItem value="or" className="text-white text-xs">或 (OR)</SelectItem>
              <SelectItem value="not" className="text-white text-xs">非 (NOT)</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-white/50 text-xs">条件组</span>
          {level > 0 && (
            <button onClick={onDelete} className="ml-auto text-white/30 hover:text-red-400">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        {expanded && (
          <div className="space-y-2">
            {(condition.conditions || []).map((child, idx) => (
              <ConditionEditor
                key={idx}
                condition={child}
                onChange={(c) => updateChildCondition(idx, c)}
                onDelete={() => deleteChildCondition(idx)}
                level={level + 1}
                attributes={attributes}
                tags={tags}
                relations={relations}
                prototypes={prototypes}
              />
            ))}
            <Button size="sm" onClick={addChildCondition} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
              <Plus className="w-3 h-3 mr-1" />添加条件
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border border-[#3d3d3d] rounded bg-[#252526] p-2 flex items-center gap-2 ${level > 0 ? 'ml-4' : ''}`}>
      <Select value={condition.type} onValueChange={(val) => onChange({ type: val })}>
        <SelectTrigger className="h-6 w-24 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
          <SelectItem value="group" className="text-white text-xs">条件组</SelectItem>
          <SelectItem value="prototype" className="text-white text-xs">原型</SelectItem>
          <SelectItem value="attribute" className="text-white text-xs">属性</SelectItem>
          <SelectItem value="tag" className="text-white text-xs">标签</SelectItem>
          <SelectItem value="relation" className="text-white text-xs">关系</SelectItem>
        </SelectContent>
      </Select>

      {condition.type === 'prototype' && (
        <Select value={condition.prototype_id || ''} onValueChange={(val) => updateCondition({ prototype_id: val })}>
          <SelectTrigger className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
            <SelectValue placeholder="选择原型" />
          </SelectTrigger>
          <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
            {prototypes.map(p => (
              <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {condition.type === 'attribute' && (
        <>
          <Select value={condition.attribute_id || ''} onValueChange={(val) => updateCondition({ attribute_id: val })}>
            <SelectTrigger className="h-6 w-24 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue placeholder="属性" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {attributes.map(a => (
                <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={condition.attribute_key || ''} onValueChange={(val) => updateCondition({ attribute_key: val })}>
            <SelectTrigger className="h-6 w-24 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue placeholder="键" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {(attributes.find(a => a.attribute_id === condition.attribute_id)?.keys || []).map(k => (
                <SelectItem key={k.name} value={k.name} className="text-white text-xs">
                  {k.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={condition.operator || 'eq'} onValueChange={(val) => updateCondition({ operator: val })}>
            <SelectTrigger className="h-6 w-16 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="eq" className="text-white text-xs">=</SelectItem>
              <SelectItem value="ne" className="text-white text-xs">≠</SelectItem>
              <SelectItem value="gt" className="text-white text-xs">&gt;</SelectItem>
              <SelectItem value="gte" className="text-white text-xs">≥</SelectItem>
              <SelectItem value="lt" className="text-white text-xs">&lt;</SelectItem>
              <SelectItem value="lte" className="text-white text-xs">≤</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={condition.value || 0}
            onChange={(e) => updateCondition({ value: parseFloat(e.target.value) || 0 })}
            className="h-6 w-20 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </>
      )}

      {condition.type === 'tag' && (
        <>
          <Select value={condition.operator || 'has'} onValueChange={(val) => updateCondition({ operator: val })}>
            <SelectTrigger className="h-6 w-20 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="has" className="text-white text-xs">拥有</SelectItem>
              <SelectItem value="not_has" className="text-white text-xs">没有</SelectItem>
              <SelectItem value="count_gt" className="text-white text-xs">数量&gt;</SelectItem>
              <SelectItem value="count_gte" className="text-white text-xs">数量≥</SelectItem>
            </SelectContent>
          </Select>
          <Select value={condition.tag_path || ''} onValueChange={(val) => updateCondition({ tag_path: val })}>
            <SelectTrigger className="h-6 flex-1 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue placeholder="选择标签" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d] max-h-48">
              {tags.map(t => (
                <SelectItem key={t.id} value={t.full_path} className="text-white text-xs">
                  {t.full_path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(condition.operator === 'count_gt' || condition.operator === 'count_gte') && (
            <Input
              type="number"
              value={condition.count || 0}
              onChange={(e) => updateCondition({ count: parseInt(e.target.value) || 0 })}
              className="h-6 w-16 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            />
          )}
        </>
      )}

      {condition.type === 'relation' && (
        <>
          <Select value={condition.relation_id || ''} onValueChange={(val) => updateCondition({ relation_id: val })}>
            <SelectTrigger className="h-6 w-24 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue placeholder="关系" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {relations.map(r => (
                <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={condition.relation_role || 'source'} onValueChange={(val) => updateCondition({ relation_role: val })}>
            <SelectTrigger className="h-6 w-20 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="source" className="text-white text-xs">源实体</SelectItem>
              <SelectItem value="target" className="text-white text-xs">目标实体</SelectItem>
            </SelectContent>
          </Select>
          <Select value={condition.has_relation ? 'true' : 'false'} onValueChange={(val) => updateCondition({ has_relation: val === 'true' })}>
            <SelectTrigger className="h-6 w-20 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="true" className="text-white text-xs">存在</SelectItem>
              <SelectItem value="false" className="text-white text-xs">不存在</SelectItem>
            </SelectContent>
          </Select>
        </>
      )}

      <button onClick={onDelete} className="ml-auto text-white/30 hover:text-red-400">
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function EntityQueryEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: queries = [] } = useQuery({
    queryKey: ['entityQueries'],
    queryFn: () => base44.entities.EntityQuery.list(),
    initialData: [],
  });

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['gameplayTags'],
    queryFn: () => base44.entities.GameplayTag.list(),
    initialData: [],
  });

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntityQuery.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityQuery.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntityQuery.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityQueries'] });
    },
  });

  const filteredQueries = useMemo(() => {
    if (!searchQuery) return queries;
    return queries.filter(q => 
      q.query_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.description && q.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [queries, searchQuery]);

  const handleCreate = () => {
    const newQuery = {
      query_name: "新查询",
      description: "",
      root_condition: {
        type: 'group',
        operator: 'and',
        conditions: []
      }
    };
    createMutation.mutate(newQuery);
  };

  const handleEdit = (query) => {
    setEditingRow(query.id);
    setEditData({ 
      ...query,
      root_condition: query.root_condition || { type: 'group', operator: 'and', conditions: [] }
    });
  };

  const handleSave = () => {
    if (!editData.query_name || !editData.root_condition) {
      alert('请填写必填项');
      return;
    }
    
    updateMutation.mutate({ id: editData.id, data: editData });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除？')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">实体查询编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredQueries.length} 个</span>
        
        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <Input
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#0e639c] hover:bg-[#1177bb] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {editingRow ? (
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="bg-[#252526] rounded border border-[#3d3d3d] p-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-white/70 mb-1.5 block">查询名称</label>
                  <Input
                    value={editData.query_name}
                    onChange={(e) => setEditData({ ...editData, query_name: e.target.value })}
                    className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70 mb-1.5 block">描述</label>
                  <Input
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="bg-[#1e1e1e] border-[#3d3d3d] text-white"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#252526] rounded border border-[#3d3d3d] p-4">
              <div className="text-sm font-semibold text-white mb-3">查询条件</div>
              <ConditionEditor
                condition={editData.root_condition}
                onChange={(c) => setEditData({ ...editData, root_condition: c })}
                onDelete={() => {}}
                attributes={attributes}
                tags={tags}
                relations={relations}
                prototypes={prototypes}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={handleCancel} variant="outline" className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white border-[#3d3d3d]">
                取消
              </Button>
              <Button onClick={handleSave} className="bg-[#0e639c] hover:bg-[#1177bb]">
                保存
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filteredQueries.map((query) => (
              <div key={query.id} className="bg-[#252526] rounded border border-[#3d3d3d] p-4 hover:border-[#0e639c] transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-white font-medium">{query.query_name}</h3>
                    {query.description && <p className="text-white/60 text-xs mt-1">{query.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(query.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Button size="sm" onClick={() => handleEdit(query)} className="w-full h-7 bg-[#0e639c] hover:bg-[#1177bb] mt-2">
                  <Edit3 className="w-3 h-3 mr-1" />编辑查询
                </Button>
              </div>
            ))}
          </div>
        )}

        {filteredQueries.length === 0 && !editingRow && (
          <div className="text-center py-12 text-gray-500">
            <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无查询</p>
          </div>
        )}
      </div>
    </div>
  );
}