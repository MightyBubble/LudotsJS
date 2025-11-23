import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Plus, Edit3, Trash2, X, Save, Link as LinkIcon, Share2, ArrowRight, Settings2 } from "lucide-react";

export default function EntityRelationEditorPage() {
  const [activeTab, setActiveTab] = useState("definitions");
  
  return (
    <div className="h-screen flex flex-col bg-[#0D0F14] text-white">
      <div className="h-12 bg-[#15171C] border-b border-[#2A2E37] flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-5 h-5 text-gray-400" />
          <span className="text-lg font-semibold text-gray-200">关系编辑器</span>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="bg-[#0D0F14] border border-[#2A2E37] h-8">
            <TabsTrigger value="definitions" className="text-xs px-3 data-[state=active]:bg-[#D97706] data-[state=active]:text-white">
              <Settings2 className="w-3 h-3 mr-2" />
              关系定义 (Definitions)
            </TabsTrigger>
            <TabsTrigger value="static" className="text-xs px-3 data-[state=active]:bg-[#D97706] data-[state=active]:text-white">
              <Share2 className="w-3 h-3 mr-2" />
              静态关系 (Static Relations)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "definitions" ? <RelationDefinitionsView /> : <StaticRelationsView />}
      </div>
    </div>
  );
}

// ==========================================
// 视图 1: 关系类型定义 (Schema)
// ==========================================
function RelationDefinitionsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntityRelation.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityRelations'] });
      setCreatingNew(false);
      setEditData(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityRelation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityRelations'] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntityRelation.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityRelations'] });
    },
  });

  const filteredRelations = useMemo(() => {
    if (!searchQuery) return relations;
    return relations.filter(r => 
      r.relation_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [relations, searchQuery]);

  const handleSave = () => {
    if (!editData.relation_id || !editData.name) {
      alert('请填写关系ID和名称');
      return;
    }
    if (creatingNew) {
      createMutation.mutate(editData);
    } else {
      updateMutation.mutate({ id: editData.id, data: editData });
    }
  };

  const renderConfigCell = (relation) => {
    return (
      <div className="space-y-1 text-xs text-gray-300">
        <div className="flex gap-2">
          <span className={relation.is_directional ? "text-blue-400" : "text-green-400"}>
            {relation.is_directional ? "有向" : "无向"}
          </span>
          {relation.inverse_relation_id && (
            <span className="text-gray-500">反向: {relation.inverse_relation_id}</span>
          )}
        </div>
        {relation.attributes && relation.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-gray-500">属性:</span>
            {relation.attributes.map(attrId => {
              const attr = attributes.find(a => a.attribute_id === attrId);
              return (
                <span key={attrId} className="bg-[#262626] px-1 rounded text-gray-300">
                  {attr?.name || attrId}
                </span>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderEditRow = (data) => {
    return (
      <tr className="border-b border-[#2A2E37] bg-[#15171C]">
        <td className="p-2 align-top">
          <Input
            value={data.relation_id}
            onChange={(e) => setEditData({ ...data, relation_id: e.target.value })}
            className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white font-mono"
            placeholder="relation_id"
          />
        </td>
        <td className="p-2 align-top">
          <Input
            value={data.name}
            onChange={(e) => setEditData({ ...data, name: e.target.value })}
            className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
            placeholder="名称"
          />
        </td>
        <td className="p-2 align-top">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.is_directional ?? true}
                  onChange={(e) => setEditData({ ...data, is_directional: e.target.checked })}
                  className="rounded bg-[#0D0F14] border-[#2A2E37]"
                />
                有向关系
              </label>
              {data.is_directional && (
                 <Input
                   value={data.inverse_relation_id || ""}
                   onChange={(e) => setEditData({ ...data, inverse_relation_id: e.target.value })}
                   className="h-6 w-32 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                   placeholder="反向关系ID"
                 />
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-gray-500">关联属性:</div>
              <div className="flex flex-wrap gap-1 mb-1">
                {(data.attributes || []).map((attrId) => {
                   const attr = attributes.find(a => a.attribute_id === attrId);
                   return (
                    <div key={attrId} className="bg-[#262626] px-2 py-0.5 rounded text-xs flex items-center gap-1 text-gray-200">
                      <span>{attr?.name || attrId}</span>
                      <button 
                        onClick={() => setEditData({ ...data, attributes: data.attributes.filter(id => id !== attrId) })}
                        className="hover:text-red-400"
                      >
                        ×
                      </button>
                    </div>
                   );
                })}
              </div>
              <Select
                value=""
                onValueChange={(val) => {
                  if (val && !data.attributes?.includes(val)) {
                    setEditData({ ...data, attributes: [...(data.attributes || []), val] });
                  }
                }}
              >
                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                  <SelectValue placeholder="添加属性..." />
                </SelectTrigger>
                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                  {attributes.map(a => (
                    <SelectItem key={a.id} value={a.attribute_id} className="text-white text-xs">
                      {a.name} ({a.attribute_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </td>
        <td className="p-2 align-top">
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="h-7 px-2 bg-[#D97706] hover:bg-[#B45309] text-xs">
              <Save className="w-3 h-3" />
            </Button>
            <Button size="sm" onClick={() => { setCreatingNew(false); setEditingId(null); setEditData(null); }} className="h-7 px-2 bg-[#262626] hover:bg-[#4d4d4d] text-xs">
              <X className="w-3 h-3" />
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-[#15171C] border-b border-[#2A2E37] flex justify-between items-center">
        <div className="text-sm text-gray-400">
          在此定义系统中存在的<span className="text-white font-bold">关系类型</span>（如：父子、盟友、宿敌）。
          <br/>这些定义将被用于原型配置和运行时实例。
        </div>
        <div className="flex gap-2">
           <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <Input
              placeholder="搜索定义..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 w-48 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
            />
          </div>
          <Button size="sm" onClick={() => {
            setCreatingNew(true);
            setEditingId(null);
            setEditData({
              relation_id: "", name: "", description: "", is_directional: true, attributes: [], tags: []
            });
          }} className="h-8 bg-[#262626] hover:bg-[#4d4d4d] text-white text-xs">
            <Plus className="w-3 h-3 mr-1" /> 新建定义
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-[#15171C] border-b border-[#2A2E37] text-left">
            <tr>
              <th className="p-2 font-semibold text-gray-300 w-48">关系ID</th>
              <th className="p-2 font-semibold text-gray-300 w-40">名称</th>
              <th className="p-2 font-semibold text-gray-300">配置详情</th>
              <th className="p-2 font-semibold text-gray-300 w-20">操作</th>
            </tr>
          </thead>
          <tbody>
            {creatingNew && editData && renderEditRow(editData)}
            {filteredRelations.map(relation => {
              if (editingId === relation.id && editData) return <React.Fragment key={relation.id}>{renderEditRow(editData)}</React.Fragment>;
              return (
                <tr key={relation.id} className="border-b border-[#2A2E37] hover:bg-[#15171C]">
                  <td className="p-2 font-mono text-blue-400">{relation.relation_id}</td>
                  <td className="p-2 text-white font-medium">{relation.name}</td>
                  <td className="p-2">{renderConfigCell(relation)}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => { setEditingId(relation.id); setCreatingNew(false); setEditData({...relation}); }} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#4d4d4d]">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" onClick={() => { if(confirm('确认删除?')) deleteMutation.mutate(relation.id); }} className="h-6 w-6 p-0 bg-[#262626] hover:bg-[#5a1e1e]">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 视图 2: 静态关系配置 (Data on Prototype)
// ==========================================
function StaticRelationsView() {
  const [selectedPrototypeId, setSelectedPrototypeId] = useState(null);
  
  const queryClient = useQueryClient();

  const { data: prototypes = [] } = useQuery({
    queryKey: ['entityPrototypes'],
    queryFn: () => base44.entities.EntityPrototype.list(),
    initialData: [],
  });

  const { data: relations = [] } = useQuery({
    queryKey: ['entityRelations'],
    queryFn: () => base44.entities.EntityRelation.list(),
    initialData: [],
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => base44.entities.Attribute.list(),
    initialData: [],
  });

  const selectedPrototype = prototypes.find(p => p.prototype_id === selectedPrototypeId);

  const updatePrototypeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityPrototype.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] });
    },
  });

  const handleAddRelation = () => {
    if (!selectedPrototype) return;
    const newRelations = [
      ...(selectedPrototype.static_relations || []),
      {
        relation_definition_id: relations[0]?.relation_id || "",
        target_prototype_id: "",
        attribute_values: {}
      }
    ];
    updatePrototypeMutation.mutate({ id: selectedPrototype.id, data: { ...selectedPrototype, static_relations: newRelations } });
  };

  const handleUpdateRelation = (index, updatedRel) => {
    if (!selectedPrototype) return;
    const newRelations = [...(selectedPrototype.static_relations || [])];
    newRelations[index] = updatedRel;
    updatePrototypeMutation.mutate({ id: selectedPrototype.id, data: { ...selectedPrototype, static_relations: newRelations } });
  };

  const handleRemoveRelation = (index) => {
    if (!selectedPrototype) return;
    const newRelations = [...(selectedPrototype.static_relations || [])];
    newRelations.splice(index, 1);
    updatePrototypeMutation.mutate({ id: selectedPrototype.id, data: { ...selectedPrototype, static_relations: newRelations } });
  };

  return (
    <div className="flex h-full">
      {/* 左侧：原型列表 */}
      <div className="w-64 bg-[#15171C] border-r border-[#2A2E37] flex flex-col">
        <div className="p-3 border-b border-[#2A2E37]">
          <div className="text-xs font-bold text-gray-400 mb-2 uppercase">选择源原型</div>
          <Select value={selectedPrototypeId || ""} onValueChange={setSelectedPrototypeId}>
            <SelectTrigger className="w-full bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
              <SelectValue placeholder="选择原型..." />
            </SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37] max-h-[300px]">
              {prototypes.map(p => (
                <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                  {p.name} <span className="text-gray-500">({p.prototype_id})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {prototypes.map(p => (
            <div 
              key={p.id}
              onClick={() => setSelectedPrototypeId(p.prototype_id)}
              className={`p-2 rounded cursor-pointer text-xs flex justify-between items-center ${selectedPrototypeId === p.prototype_id ? 'bg-[#D97706] text-white' : 'text-gray-300 hover:bg-[#262626]'}`}
            >
              <span className="truncate">{p.name}</span>
              {p.static_relations?.length > 0 && (
                <span className="bg-[#262626] px-1.5 rounded-full text-[10px] text-gray-400">{p.static_relations.length}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 右侧：关系配置 */}
      <div className="flex-1 bg-[#0D0F14] flex flex-col overflow-hidden">
        {selectedPrototype ? (
          <>
            <div className="p-4 border-b border-[#2A2E37] bg-[#15171C] flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  {selectedPrototype.name}
                  <span className="text-sm font-normal text-gray-400 font-mono">({selectedPrototype.prototype_id})</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  配置此原型的静态关系。这些关系在游戏开始时即存在（如：羁绊、固有敌对）。
                  <br/>
                  <span className="text-yellow-500/80">注意：实例间的动态关系（如战场上的位置、即时仇恨）请在关卡数据或运行时逻辑中处理。</span>
                </p>
              </div>
              <Button onClick={handleAddRelation} className="bg-[#D97706] hover:bg-[#B45309] text-xs">
                <Plus className="w-3 h-3 mr-1" /> 添加关系
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(selectedPrototype.static_relations || []).length === 0 ? (
                <div className="text-center py-12 text-gray-500 border border-dashed border-[#2A2E37] rounded-lg">
                  <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p>暂无静态关系配置</p>
                </div>
              ) : (
                (selectedPrototype.static_relations || []).map((rel, idx) => {
                  const relDef = relations.find(r => r.relation_id === rel.relation_definition_id);
                  
                  return (
                    <Card key={idx} className="bg-[#15171C] border-[#2A2E37] shadow-none">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* 连接线图示 */}
                          <div className="flex flex-col items-center pt-2 gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" title="Source (Self)" />
                            <div className="w-0.5 h-8 bg-gray-600" />
                            <div className="w-2 h-2 rounded-full bg-gray-500" title="Target" />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">关系类型</label>
                                <Select 
                                  value={rel.relation_definition_id} 
                                  onValueChange={(v) => handleUpdateRelation(idx, { ...rel, relation_definition_id: v, attribute_values: {} })}
                                >
                                  <SelectTrigger className="h-8 bg-[#0D0F14] border-[#2A2E37] text-xs text-white">
                                    <SelectValue placeholder="选择类型" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                    {relations.map(r => (
                                      <SelectItem key={r.id} value={r.relation_id} className="text-white text-xs">
                                        {r.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex-none pt-6">
                                <ArrowRight className="w-4 h-4 text-gray-500" />
                              </div>

                              <div className="flex-1">
                                <label className="text-[10px] text-gray-500 uppercase mb-1 block">目标原型</label>
                                <Select 
                                  value={rel.target_prototype_id} 
                                  onValueChange={(v) => handleUpdateRelation(idx, { ...rel, target_prototype_id: v })}
                                >
                                  <SelectTrigger className="h-8 bg-[#0D0F14] border-[#2A2E37] text-xs text-white">
                                    <SelectValue placeholder="选择目标" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                    {prototypes.filter(p => p.prototype_id !== selectedPrototype.prototype_id).map(p => (
                                      <SelectItem key={p.id} value={p.prototype_id} className="text-white text-xs">
                                        {p.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* 属性配置 */}
                            {relDef?.attributes?.length > 0 && (
                              <div className="bg-[#0D0F14] p-3 rounded border border-[#2A2E37]">
                                <div className="text-[10px] text-gray-500 uppercase mb-2">关系属性配置</div>
                                <div className="grid grid-cols-2 gap-2">
                                  {relDef.attributes.map(attrId => {
                                    const attr = attributes.find(a => a.attribute_id === attrId);
                                    return (
                                      <div key={attrId} className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400">{attr?.name || attrId}</label>
                                        <Input
                                          type="number"
                                          placeholder="默认值"
                                          value={rel.attribute_values?.[attrId] ?? ""}
                                          onChange={(e) => {
                                            const newVal = parseFloat(e.target.value);
                                            handleUpdateRelation(idx, { 
                                              ...rel, 
                                              attribute_values: { 
                                                ...(rel.attribute_values || {}), 
                                                [attrId]: isNaN(newVal) ? 0 : newVal 
                                              } 
                                            });
                                          }}
                                          className="h-7 bg-[#15171C] border-[#2A2E37] text-xs text-white"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveRelation(idx)}
                            className="text-gray-500 hover:text-red-400 hover:bg-[#262626] h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Share2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>请在左侧选择一个原型以配置关系</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}