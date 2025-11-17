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
      validator_type: "unit_test",
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

  const getTypeName = (type) => {
    const map = {
      unit_compare: '单位比较',
      unit_test: '单位测试',
      unit_filters: '单位过滤',
      location: '位置',
      player: '玩家',
      combine: '组合',
      function_graph: '函数图'
    };
    return map[type] || type;
  };

  const renderConfigCell = (validator) => {
    if (validator.validator_type === 'unit_compare') {
      const cfg = validator.unit_compare_config || {};
      return (
        <div className="text-xs text-gray-300">
          {cfg.compare_type && <div>类型: {cfg.compare_type}</div>}
          {cfg.attribute_id && <div>属性: {cfg.attribute_id}.{cfg.attribute_key}</div>}
          {cfg.operator && <div>操作: {cfg.operator}</div>}
        </div>
      );
    }
    if (validator.validator_type === 'unit_test') {
      const cfg = validator.unit_test_config || {};
      return (
        <div className="text-xs text-gray-300">
          {cfg.test_type && <div>测试: {cfg.test_type}</div>}
          {cfg.tag_path && <div>标签: {cfg.tag_path}</div>}
          {cfg.prototype_id && <div>原型: {cfg.prototype_id}</div>}
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

  const renderEditRow = (data) => {
    return (
      <tr className="border-b border-[#3d3d3d] bg-[#252526]">
        <td className="p-2">
          <Input
            value={data.validator_id}
            onChange={(e) => setEditData({ ...data, validator_id: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="验证器ID"
          />
        </td>
        <td className="p-2">
          <Input
            value={data.name}
            onChange={(e) => setEditData({ ...data, name: e.target.value })}
            className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
            placeholder="名称"
          />
        </td>
        <td className="p-2">
          <Select
            value={data.validator_type}
            onValueChange={(val) => setEditData({ ...data, validator_type: val })}
          >
            <SelectTrigger className="h-6 bg-[#1e1e1e] border-[#3d3d3d] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              <SelectItem value="unit_test" className="text-white text-xs">单位测试</SelectItem>
              <SelectItem value="unit_compare" className="text-white text-xs">单位比较</SelectItem>
              <SelectItem value="unit_filters" className="text-white text-xs">单位过滤</SelectItem>
              <SelectItem value="location" className="text-white text-xs">位置</SelectItem>
              <SelectItem value="player" className="text-white text-xs">玩家</SelectItem>
              <SelectItem value="combine" className="text-white text-xs">组合</SelectItem>
              <SelectItem value="function_graph" className="text-white text-xs">函数图</SelectItem>
            </SelectContent>
          </Select>
        </td>
        <td className="p-2">
          <span className="text-xs text-gray-500">编辑配置...</span>
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
            <Button size="sm" onClick={handleSave} className="h-6 px-2 bg-[#0e639c] hover:bg-[#1177bb] text-xs">
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={handleCancel} className="h-6 px-2 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-xs">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-[#1e1e1e] text-white">
      <div className="h-10 bg-[#2d2d2d] border-b border-[#3d3d3d] flex items-center px-4 gap-3">
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
            className="h-7 pl-7 w-48 bg-[#1e1e1e] border-[#3d3d3d] text-xs text-white"
          />
        </div>

        <Button size="sm" onClick={handleCreate} className="h-7 px-3 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs">
          <Plus className="w-3 h-3 mr-1" />
          新建
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#2d2d2d] border-b border-[#3d3d3d]">
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
                <tr key={validator.id} className="border-b border-[#3d3d3d] hover:bg-[#252526]">
                  <td className="p-2 text-gray-300 font-mono">{validator.validator_id}</td>
                  <td className="p-2 text-gray-300">{validator.name}</td>
                  <td className="p-2 text-gray-300">{getTypeName(validator.validator_type)}</td>
                  <td className="p-2">{renderConfigCell(validator)}</td>
                  <td className="p-2">
                    {validator.negate ? <span className="text-gray-300">✓</span> : <span className="text-gray-600">-</span>}
                  </td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleEdit(validator)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => handleDelete(validator.id)} className="h-6 w-6 p-0 bg-[#3d3d3d] hover:bg-[#5a1e1e]">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredValidators.length === 0 && !creatingNew && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-sm">暂无验证器</div>
          </div>
        )}
      </div>
    </div>
  );
}