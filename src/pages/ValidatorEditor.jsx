import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit3, Trash2, X, Save, Shield } from "lucide-react";

export default function ValidatorEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: validators = [] } = useQuery({
    queryKey: ['validators'],
    queryFn: () => base44.entities.Validator.list(),
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

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  const { data: functionGraphs = [] } = useQuery({
    queryKey: ['functionGraphs'],
    queryFn: () => base44.entities.FunctionGraph.list(),
    initialData: [],
  });

  const { data: constants = [] } = useQuery({
    queryKey: ['globalConstants'],
    queryFn: () => base44.entities.GlobalConstant.list(),
    initialData: [],
  });

  const booleanFunctionGraphs = useMemo(() => {
    return functionGraphs.filter(g => g.return_type === 'boolean');
  }, [functionGraphs]);

  const getAttributeKeys = (attributeId) => {
    const attr = attributes.find(a => a.attribute_id === attributeId);
    return attr?.keys || [];
  };

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Validator.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validators'] });
      setCreatingNew(false);
      setEditData(null);
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

  const handleCreate = () => {
    setCreatingNew(true);
    setEditingId(null);
    setEditData({
      validator_id: "",
      name: "",
      description: "",
      validator_type: "entity_check",
      entity_check_config: { source_entity: "source", check_type: "has_tag", tag_path: "" },
      negate: false,
      failure_result: "false"
    });
  };

  const handleEdit = (validator) => {
    setEditingId(validator.id);
    setCreatingNew(false);
    setEditData({ ...validator });
  };

  const handleSave = () => {
    if (!editData.validator_id || !editData.name) {
      alert('请填写验证器ID和名称');
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
    if (window.confirm('确定删除此验证器吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTypeChange = (newType) => {
    const defaults = {
      entity_check: { entity_check_config: { source_entity: "source", check_type: "has_tag", tag_path: "" } },
      entity_compare: { entity_compare_config: { source_entity: "source", compare_type: "attribute_value", operator: "gt", value_source: "literal", compare_value: 0 } },
      combine: { combine_config: { logic_operator: "AND", sub_validator_ids: [] } },
      function_graph: { function_graph_config: { function_graph_id: "", parameter_bindings: {} } }
    };
    
    setEditData({
      ...editData,
      validator_type: newType,
      ...(defaults[newType] || {})
    });
  };

  const getTypeName = (type) => {
    const map = {
      entity_check: '实体检查',
      entity_compare: '实体比较',
      combine: '组合',
      function_graph: '函数图'
    };
    return map[type] || type;
  };

  const renderConfigCell = (validator) => {
    if (validator.validator_type === 'entity_check') {
      const cfg = validator.entity_check_config || {};
      return (
        <div className="text-xs text-gray-300">
          <div>[{cfg.source_entity || 'source'}] {cfg.check_type}</div>
          {cfg.tag_path && <div>标签: {cfg.tag_path}</div>}
          {cfg.tag_paths && <div>标签: {cfg.tag_paths.length}个</div>}
        </div>
      );
    }
    if (validator.validator_type === 'entity_compare') {
      const cfg = validator.entity_compare_config || {};
      const rightSide = cfg.value_source === 'literal' ? cfg.compare_value : 
                        cfg.value_source === 'constant' ? `常量[${cfg.constant_key}]` : 
                        `[${cfg.target_entity}].${cfg.target_attribute_id}.${cfg.target_attribute_key}`;
      return (
        <div className="text-xs text-gray-300">
          <div>[{cfg.source_entity}].{cfg.attribute_id}.{cfg.attribute_key} {cfg.operator} {rightSide}</div>
        </div>
      );
    }
    if (validator.validator_type === 'combine') {
      const cfg = validator.combine_config || {};
      return (
        <div className="text-xs text-gray-300">
          {cfg.logic_operator && <div>逻辑: {cfg.logic_operator}</div>}
          {cfg.sub_validator_ids && <div>子验证器: {cfg.sub_validator_ids.length}个</div>}
        </div>
      );
    }
    if (validator.validator_type === 'function_graph') {
      const cfg = validator.function_graph_config || {};
      return (
        <div className="text-xs text-gray-300">
          {cfg.function_graph_id && <div>图: {cfg.function_graph_id}</div>}
          {cfg.parameter_bindings && <div>参数: {Object.keys(cfg.parameter_bindings).length}个</div>}
        </div>
      );
    }
    return <span className="text-gray-600">-</span>;
  };

  const renderConfigEditor = (data) => {
    if (data.validator_type === 'entity_check') {
      const cfg = data.entity_check_config || {};
      return (
        <div className="space-y-1">
          <div className="flex gap-1 items-center">
            <span className="text-xs text-gray-400">实体:</span>
            <Select
              value={cfg.source_entity || "source"}
              onValueChange={(v) => setEditData({ ...data, entity_check_config: { ...cfg, source_entity: v } })}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                <SelectItem value="source" className="text-white text-xs">源实体</SelectItem>
                <SelectItem value="target" className="text-white text-xs">目标实体</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Select
            value={cfg.check_type || "has_tag"}
            onValueChange={(v) => setEditData({ ...data, entity_check_config: { ...cfg, check_type: v } })}
          >
            <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37]">
              <SelectItem value="has_tag" className="text-white text-xs">有标签</SelectItem>
              <SelectItem value="has_any_tags" className="text-white text-xs">有任意标签</SelectItem>
              <SelectItem value="has_all_tags" className="text-white text-xs">有所有标签</SelectItem>
              <SelectItem value="is_prototype" className="text-white text-xs">是原型</SelectItem>
              <SelectItem value="has_attribute" className="text-white text-xs">有属性</SelectItem>
              <SelectItem value="has_relation" className="text-white text-xs">有关系</SelectItem>
              <SelectItem value="function_graph" className="text-white text-xs">函数图</SelectItem>
            </SelectContent>
          </Select>
          {cfg.check_type === 'has_tag' && (
            <Input
              value={cfg.tag_path || ""}
              onChange={(e) => setEditData({ ...data, entity_check_config: { ...cfg, tag_path: e.target.value } })}
              placeholder="标签路径"
              className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
              list="tags-list"
            />
          )}
          {(cfg.check_type === 'has_any_tags' || cfg.check_type === 'has_all_tags') && (
            <div className="space-y-1">
              <Input
                placeholder="输入标签路径后回车"
                className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                list="tags-list"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    const paths = cfg.tag_paths || [];
                    setEditData({ ...data, entity_check_config: { ...cfg, tag_paths: [...paths, e.target.value] } });
                    e.target.value = '';
                  }
                }}
              />
              <div className="flex flex-wrap gap-1">
                {(cfg.tag_paths || []).map((path, idx) => (
                  <div key={idx} className="bg-[#262626] px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    <span>{path}</span>
                    <button onClick={() => {
                      const paths = [...(cfg.tag_paths || [])];
                      paths.splice(idx, 1);
                      setEditData({ ...data, entity_check_config: { ...cfg, tag_paths: paths } });
                    }} className="text-red-400 hover:text-red-300">×</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {cfg.check_type === 'is_prototype' && (
            <Select
              value={cfg.prototype_id || ""}
              onValueChange={(v) => setEditData({ ...data, entity_check_config: { ...cfg, prototype_id: v } })}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                <SelectValue placeholder="选择原型" />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                {prototypes.map(p => (
                  <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {cfg.check_type === 'has_attribute' && (
            <Select
              value={cfg.attribute_id || ""}
              onValueChange={(v) => setEditData({ ...data, entity_check_config: { ...cfg, attribute_id: v } })}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                <SelectValue placeholder="选择属性" />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                {attributes.map(a => (
                  <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {cfg.check_type === 'has_relation' && (
            <Select
              value={cfg.relation_id || ""}
              onValueChange={(v) => setEditData({ ...data, entity_check_config: { ...cfg, relation_id: v } })}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                <SelectValue placeholder="选择关系" />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                {relations.map(r => (
                  <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {cfg.check_type === 'function_graph' && (
            <Select
              value={cfg.function_graph_id || ""}
              onValueChange={(v) => setEditData({ ...data, entity_check_config: { ...cfg, function_graph_id: v } })}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                <SelectValue placeholder="选择函数图" />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                {booleanFunctionGraphs.map(g => (
                  <SelectItem key={g.id} value={g.function_id} className="text-white text-xs">{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      );
    }

    if (data.validator_type === 'entity_compare') {
      const cfg = data.entity_compare_config || {};
      const attributeKeys = cfg.attribute_id ? getAttributeKeys(cfg.attribute_id) : [];
      const targetAttributeKeys = cfg.target_attribute_id ? getAttributeKeys(cfg.target_attribute_id) : [];
      
      return (
        <div className="space-y-1">
          {/* 比较值A */}
          <div className="bg-[#15171C] p-1.5 rounded">
            <div className="text-xs text-gray-400 mb-1">比较值A:</div>
            <Select
              value={cfg.compare_type || "attribute_value"}
              onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, compare_type: v } })}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                <SelectItem value="constant" className="text-white text-xs">全局常量</SelectItem>
                <SelectItem value="literal" className="text-white text-xs">固定值</SelectItem>
                <SelectItem value="attribute_value" className="text-white text-xs">属性值</SelectItem>
                <SelectItem value="tag_count" className="text-white text-xs">标签计数</SelectItem>
                <SelectItem value="relation_attribute" className="text-white text-xs">关系属性值</SelectItem>
                <SelectItem value="relation_count" className="text-white text-xs">关系计数</SelectItem>
                <SelectItem value="function_graph" className="text-white text-xs">函数图</SelectItem>
              </SelectContent>
            </Select>
            {['attribute_value', 'tag_count'].includes(cfg.compare_type) && (
              <Select
                value={cfg.source_entity || "source"}
                onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, source_entity: v } })}
              >
                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  <SelectItem value="source" className="text-white text-xs">源实体</SelectItem>
                  <SelectItem value="target" className="text-white text-xs">目标实体</SelectItem>
                  <SelectItem value="relation" className="text-white text-xs">关系关联实体</SelectItem>
                </SelectContent>
              </Select>
            )}
            {(cfg.source_entity === 'relation' && ['attribute_value', 'tag_count'].includes(cfg.compare_type)) && (
              <Select
                value={cfg.source_relation_id || ""}
                onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, source_relation_id: v } })}
              >
                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                  <SelectValue placeholder="选择关系" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {relations.map(r => (
                    <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {cfg.compare_type === 'constant' && (
              <Select
                value={cfg.constant_key || ""}
                onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, constant_key: v } })}
              >
                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                  <SelectValue placeholder="选择常量" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {constants.map(c => (
                    <SelectItem key={c.id} value={c.constant_key} className="text-white text-xs">{c.constant_key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {cfg.compare_type === 'literal' && (
              <Input
                type="number"
                value={cfg.compare_value ?? 0}
                onChange={(e) => setEditData({ ...data, entity_compare_config: { ...cfg, compare_value: parseFloat(e.target.value) || 0 } })}
                placeholder="输入值"
                className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
              />
            )}
            {cfg.compare_type === 'attribute_value' && (
              <div className="flex gap-1">
                <Select
                  value={cfg.attribute_id || ""}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, attribute_id: v, attribute_key: "" } })}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                    <SelectValue placeholder="属性" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    {attributes.map(a => (
                      <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={cfg.attribute_key || ""}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, attribute_key: v } })}
                  disabled={!cfg.attribute_id}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                    <SelectValue placeholder="键" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    {attributeKeys.map(k => (
                      <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {cfg.compare_type === 'tag_count' && (
              <Input
                value={cfg.tag_path || ""}
                onChange={(e) => setEditData({ ...data, entity_compare_config: { ...cfg, tag_path: e.target.value } })}
                placeholder="标签路径"
                className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                list="tags-list"
              />
            )}
            {['relation_attribute', 'relation_count'].includes(cfg.compare_type) && (
              <Select
                value={cfg.relation_id || ""}
                onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, relation_id: v } })}
              >
                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                  <SelectValue placeholder="选择关系" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {relations.map(r => (
                    <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {cfg.compare_type === 'relation_attribute' && (
              <div className="flex gap-1">
                <Select
                  value={cfg.relation_attribute_id || ""}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, relation_attribute_id: v, relation_attribute_key: "" } })}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                    <SelectValue placeholder="属性" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    {attributes.map(a => (
                      <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={cfg.relation_attribute_key || ""}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, relation_attribute_key: v } })}
                  disabled={!cfg.relation_attribute_id}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                    <SelectValue placeholder="键" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    {(cfg.relation_attribute_id ? getAttributeKeys(cfg.relation_attribute_id) : []).map(k => (
                      <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {cfg.compare_type === 'function_graph' && (
              <Select
                value={cfg.function_graph_id || ""}
                onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, function_graph_id: v } })}
              >
                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                  <SelectValue placeholder="选择函数图" />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {booleanFunctionGraphs.map(g => (
                    <SelectItem key={g.id} value={g.function_id} className="text-white text-xs">{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {/* 操作符 */}
          {cfg.compare_type !== 'function_graph' && (
            <Select
              value={cfg.operator || "gt"}
              onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, operator: v } })}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                <SelectItem value="gt" className="text-white text-xs">&gt;</SelectItem>
                <SelectItem value="lt" className="text-white text-xs">&lt;</SelectItem>
                <SelectItem value="gte" className="text-white text-xs">&gt;=</SelectItem>
                <SelectItem value="lte" className="text-white text-xs">&lt;=</SelectItem>
                <SelectItem value="eq" className="text-white text-xs">=</SelectItem>
                <SelectItem value="neq" className="text-white text-xs">!=</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* 比较值B */}
          {cfg.compare_type !== 'function_graph' && (
            <div className="bg-[#15171C] p-1.5 rounded">
              <div className="text-xs text-gray-400 mb-1">比较值B:</div>
              <Select
                value={cfg.value_source || "literal"}
                onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, value_source: v } })}
              >
                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  <SelectItem value="constant" className="text-white text-xs">全局常量</SelectItem>
                  <SelectItem value="literal" className="text-white text-xs">固定值</SelectItem>
                  <SelectItem value="attribute_key" className="text-white text-xs">属性值</SelectItem>
                  <SelectItem value="tag_count" className="text-white text-xs">标签计数</SelectItem>
                  <SelectItem value="relation_attribute" className="text-white text-xs">关系属性值</SelectItem>
                  <SelectItem value="relation_count" className="text-white text-xs">关系计数</SelectItem>
                </SelectContent>
              </Select>
              {['attribute_key', 'tag_count'].includes(cfg.value_source) && (
                <Select
                  value={cfg.target_entity || "target"}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_entity: v } })}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    <SelectItem value="source" className="text-white text-xs">源实体</SelectItem>
                    <SelectItem value="target" className="text-white text-xs">目标实体</SelectItem>
                    <SelectItem value="relation" className="text-white text-xs">关系关联实体</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {(cfg.target_entity === 'relation' && ['attribute_key', 'tag_count'].includes(cfg.value_source)) && (
                <Select
                  value={cfg.target_relation_id_for_type || ""}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_relation_id_for_type: v } })}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                    <SelectValue placeholder="选择关系" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    {relations.map(r => (
                      <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {cfg.value_source === 'constant' && (
                <Select
                  value={cfg.target_constant_key || ""}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_constant_key: v } })}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                    <SelectValue placeholder="选择常量" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    {constants.map(c => (
                      <SelectItem key={c.id} value={c.constant_key} className="text-white text-xs">{c.constant_key}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {cfg.value_source === 'literal' && (
                <Input
                  type="number"
                  value={cfg.compare_value ?? 0}
                  onChange={(e) => setEditData({ ...data, entity_compare_config: { ...cfg, compare_value: parseFloat(e.target.value) || 0 } })}
                  placeholder="输入值"
                  className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                />
              )}
              {cfg.value_source === 'attribute_key' && (
                <div className="flex gap-1">
                  <Select
                    value={cfg.target_attribute_id || ""}
                    onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_attribute_id: v, target_attribute_key: "" } })}
                  >
                    <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                      <SelectValue placeholder="属性" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {attributes.map(a => (
                        <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={cfg.target_attribute_key || ""}
                    onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_attribute_key: v } })}
                    disabled={!cfg.target_attribute_id}
                  >
                    <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                      <SelectValue placeholder="键" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {targetAttributeKeys.map(k => (
                        <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {cfg.value_source === 'tag_count' && (
                <Input
                  value={cfg.target_tag_path || ""}
                  onChange={(e) => setEditData({ ...data, entity_compare_config: { ...cfg, target_tag_path: e.target.value } })}
                  placeholder="标签路径"
                  className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                  list="tags-list"
                />
              )}
              {['relation_attribute', 'relation_count'].includes(cfg.value_source) && (
                <Select
                  value={cfg.target_relation_id_for_type || ""}
                  onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_relation_id_for_type: v } })}
                >
                  <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs mb-1">
                    <SelectValue placeholder="选择关系" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                    {relations.map(r => (
                      <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {cfg.value_source === 'relation_attribute' && (
                <div className="flex gap-1">
                  <Select
                    value={cfg.target_relation_attribute_id || ""}
                    onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_relation_attribute_id: v, target_relation_attribute_key: "" } })}
                  >
                    <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                      <SelectValue placeholder="属性" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {attributes.map(a => (
                        <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={cfg.target_relation_attribute_key || ""}
                    onValueChange={(v) => setEditData({ ...data, entity_compare_config: { ...cfg, target_relation_attribute_key: v } })}
                    disabled={!cfg.target_relation_attribute_id}
                  >
                    <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                      <SelectValue placeholder="键" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {(cfg.target_relation_attribute_id ? getAttributeKeys(cfg.target_relation_attribute_id) : []).map(k => (
                        <SelectItem key={k.name} value={k.name} className="text-white text-xs">{k.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (data.validator_type === 'combine') {
      const cfg = data.combine_config || {};
      const availableValidators = validators.filter(v => v.id !== data.id);
      const selectedValidators = (cfg.sub_validator_ids || [])
        .map(id => validators.find(v => v.validator_id === id))
        .filter(Boolean);
      
      return (
        <div className="space-y-1">
          <Select
            value={cfg.logic_operator || "AND"}
            onValueChange={(v) => setEditData({ ...data, combine_config: { ...cfg, logic_operator: v } })}
          >
            <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37]">
              <SelectItem value="AND" className="text-white text-xs">AND</SelectItem>
              <SelectItem value="OR" className="text-white text-xs">OR</SelectItem>
              <SelectItem value="NOT" className="text-white text-xs">NOT</SelectItem>
              <SelectItem value="XOR" className="text-white text-xs">XOR</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="space-y-1">
            {selectedValidators.map((v) => (
              <div key={v.validator_id} className="flex items-center gap-1 bg-[#262626] px-2 py-0.5 rounded text-xs">
                <span className="flex-1 text-white">{v.name}</span>
                <button
                  onClick={() => {
                    const ids = (cfg.sub_validator_ids || []).filter(id => id !== v.validator_id);
                    setEditData({ ...data, combine_config: { ...cfg, sub_validator_ids: ids } });
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            <Select
              value=""
              onValueChange={(validatorId) => {
                if (validatorId && !cfg.sub_validator_ids?.includes(validatorId)) {
                  setEditData({
                    ...data,
                    combine_config: {
                      ...cfg,
                      sub_validator_ids: [...(cfg.sub_validator_ids || []), validatorId]
                    }
                  });
                }
              }}
            >
              <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs flex-1">
                <SelectValue placeholder="添加验证器..." />
              </SelectTrigger>
              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                {availableValidators
                  .filter(v => !cfg.sub_validator_ids?.includes(v.validator_id))
                  .map(v => (
                    <SelectItem key={v.id} value={v.validator_id} className="text-white text-xs">
                      {v.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    if (data.validator_type === 'function_graph') {
      const cfg = data.function_graph_config || {};
      return (
        <div className="space-y-1">
          <Select
            value={cfg.function_graph_id || ""}
            onValueChange={(v) => setEditData({ ...data, function_graph_config: { ...cfg, function_graph_id: v } })}
          >
            <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
              <SelectValue placeholder="选择函数图" />
            </SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37]">
              {booleanFunctionGraphs.map(g => (
                <SelectItem key={g.id} value={g.function_id} className="text-white text-xs">{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="text-xs text-gray-500">参数绑定: {Object.keys(cfg.parameter_bindings || {}).length}个</div>
        </div>
      );
    }

    return <span className="text-xs text-gray-500">选择类型后配置</span>;
  };

  const renderEditRow = (data) => {
    return (
      <tr className="border-b border-[#2A2E37] bg-[#15171C]">
        <td className="p-2">
          <Input
            value={data.validator_id}
            onChange={(e) => setEditData({ ...data, validator_id: e.target.value })}
            className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
            placeholder="验证器ID"
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
            value={data.validator_type}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37]">
              <SelectItem value="entity_check" className="text-white text-xs">实体检查</SelectItem>
              <SelectItem value="entity_compare" className="text-white text-xs">实体比较</SelectItem>
              <SelectItem value="combine" className="text-white text-xs">组合</SelectItem>
              <SelectItem value="function_graph" className="text-white text-xs">函数图</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          {renderConfigEditor(data)}
        </td>
        <td className="p-2">
          <input
            type="checkbox"
            checked={data.negate || false}
            onChange={(e) => setEditData({ ...data, negate: e.target.checked })}
            className="w-3 h-3"
          />
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
        <Shield className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">验证器编辑器</span>
        <span className="text-xs text-gray-500">共 {filteredValidators.length} 个</span>
        
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
              <th className="text-left p-2 font-semibold text-gray-300 w-48">验证器ID</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-32">名称</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-24">类型</th>
              <th className="text-left p-2 font-semibold text-gray-300">配置</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-16">取反</th>
              <th className="text-left p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && renderEditRow(editData)}
            
            {filteredValidators.map((validator) => {
              const isEditing = editingId === validator.id;
              
              if (isEditing && editData) {
                return <React.Fragment key={validator.id}>{renderEditRow(editData)}</React.Fragment>;
              }
              
              return (
                <tr key={validator.id} className="border-b border-[#2A2E37] hover:bg-[#15171C]">
                  <td className="p-2 text-gray-300 font-mono">{validator.validator_id}</td>
                  <td className="p-2 text-gray-300">{validator.name}</td>
                  <td className="p-2 text-gray-300">{getTypeName(validator.validator_type)}</td>
                  <td className="p-2">{renderConfigCell(validator)}</td>
                  <td className="p-2">
                    {validator.negate ? <span className="text-gray-300">✓</span> : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(validator)} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(validator.id)} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#5a1e1e]">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <datalist id="tags-list">
          {tags.map(t => <option key={t.id} value={t.full_path} />)}
        </datalist>
        
        {filteredValidators.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无验证器</div>
          </div>
        )}
      </div>
    </div>
  );
}