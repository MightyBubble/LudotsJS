import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Box, Edit3, Save, X } from "lucide-react";
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import { Section } from '@/components/ludots/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PrototypeAbilitiesSection from '@/components/prototype/PrototypeAbilitiesSection';
import PrototypeRoleBindingsSection from '@/components/prototype/PrototypeRoleBindingsSection';

export default function EntityPrototypeEditorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState(null);

  const queryClient = useQueryClient();

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

  const { data: structures = [] } = useQuery({
    queryKey: ['structureDefinitions'],
    queryFn: () => base44.entities.StructureDefinition.list(),
    initialData: [],
  });

  const { data: abilities = [] } = useQuery({
    queryKey: ['abilities'],
    queryFn: () => base44.entities.Ability.list(),
    initialData: [],
  });

  const { data: semanticProfiles = [] } = useQuery({
    queryKey: ['ability-semantic-profiles'],
    queryFn: () => base44.entities.AbilitySemanticProfile.list('profile_id'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EntityPrototype.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] });
      handleEdit(record);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EntityPrototype.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] });
      setEditingRow(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EntityPrototype.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entityPrototypes'] });
    },
  });

  const filteredPrototypes = useMemo(() => {
    if (!searchQuery) return prototypes;
    return prototypes.filter(p => 
      p.prototype_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [prototypes, searchQuery]);

  const handleCreate = () => {
    const newPrototype = {
      prototype_id: "new_prototype",
      name: "新原型",
      description: "",
      referenced_attributes: [],
      ability_ids: [],
      semantic_profile_ref: "",
      role_bindings: [],
      structure_bindings: []
    };
    createMutation.mutate(newPrototype);
  };

  const handleEdit = (prototype) => {
    setEditingRow(prototype.id);
    setEditData({ 
      ...prototype, 
      referenced_attributes: prototype.referenced_attributes || [],
      ability_ids: prototype.ability_ids || [],
      semantic_profile_ref: prototype.semantic_profile_ref || "",
      role_bindings: prototype.role_bindings || [],
      structure_bindings: prototype.structure_bindings || []
    });
  };

  const handleSave = () => {
    if (!editData.prototype_id || !editData.name) {
      alert('请填写必填项');
      return;
    }
    
    const dataToSave = {
      prototype_id: editData.prototype_id,
      name: editData.name,
      description: editData.description || "",
      referenced_attributes: editData.referenced_attributes || [],
      ability_ids: (editData.ability_ids || []).filter(Boolean),
      semantic_profile_ref: editData.semantic_profile_ref || "",
      role_bindings: (editData.role_bindings || []).filter(b => b.role_id && b.ability_id),
      structure_bindings: editData.structure_bindings || []
    };
    
    updateMutation.mutate({ id: editData.id, data: dataToSave });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('确定删除此原型吗？')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddAttribute = () => {
    if (!editData.referenced_attributes) {
      setEditData({ ...editData, referenced_attributes: [] });
    }
    const availableAttrs = attributes.filter(a => !editData.referenced_attributes.includes(a.attribute_id));
    if (availableAttrs.length > 0) {
      setEditData({
        ...editData,
        referenced_attributes: [...editData.referenced_attributes, availableAttrs[0].attribute_id]
      });
    }
  };

  const handleUpdateAttribute = (index, attrId) => {
    const attrs = [...editData.referenced_attributes];
    attrs[index] = attrId;
    setEditData({ ...editData, referenced_attributes: attrs });
  };

  const handleRemoveAttribute = (index) => {
    setEditData({
      ...editData,
      referenced_attributes: editData.referenced_attributes.filter((_, i) => i !== index)
    });
  };

  return (
    <RecordWorkspace
      entityName="EntityPrototype"
      records={prototypes}
      toItem={(item) => ({ id: item.id, name: item.name, subtitle: `${item.prototype_id} · ${(item.referenced_attributes || []).length} 个属性` })}
      columns={[
        { key: 'prototype_id', label: '原型 ID', width: 220, render: (item) => <span className="font-mono text-[#E2D8B3]">{item.prototype_id}</span> },
        { key: 'name', label: '名称', width: 180 },
        { key: 'description', label: '描述' },
        { key: 'referenced_attributes', label: '引用属性', render: (item) => `${(item.referenced_attributes || []).length} 项` },
        { key: 'ability_ids', label: '技能', render: (item) => `${(item.ability_ids || []).length} 个` },
        { key: 'structure_bindings', label: '结构绑定', render: (item) => `${(item.structure_bindings || []).length} 项` },
      ]}
      selectedId={editingRow}
      onSelect={handleEdit}
      onCreate={handleCreate}
      onDelete={(item) => handleDelete(item.id)}
      onSave={handleSave}
      dirty={Boolean(editData)}
    >
      {editData && (
        <div className="max-w-3xl">
          <Section title="基础信息">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-400 mb-1">原型 ID</label><Input value={editData.prototype_id || ''} onChange={(e) => setEditData({ ...editData, prototype_id: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /></div>
              <div><label className="block text-xs text-gray-400 mb-1">名称</label><Input value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /></div>
            </div>
            <div><label className="block text-xs text-gray-400 mb-1">描述</label><Input value={editData.description || ''} onChange={(e) => setEditData({ ...editData, description: e.target.value })} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /></div>
          </Section>
          <Section title="引用属性">
            <div className="space-y-2">{(editData.referenced_attributes || []).map((attributeId, index) => <div key={`${attributeId}-${index}`} className="flex gap-2"><Select value={attributeId} onValueChange={(value) => handleUpdateAttribute(index, value)}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{attributes.map((attribute) => <SelectItem key={attribute.id} value={attribute.attribute_id}>{attribute.name}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="ghost" onClick={() => handleRemoveAttribute(index)} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button></div>)}</div>
            <Button size="sm" onClick={handleAddAttribute} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加属性</Button>
          </Section>
          <PrototypeAbilitiesSection
            abilityIds={editData.ability_ids || []}
            abilities={abilities}
            onChange={(patch) => setEditData({ ...editData, ...patch })}
          />
          <PrototypeRoleBindingsSection
            profileRef={editData.semantic_profile_ref}
            roleBindings={editData.role_bindings || []}
            profiles={semanticProfiles}
            abilityIds={editData.ability_ids || []}
            onChange={(patch) => setEditData({ ...editData, ...patch })}
          />
          <Section title="结构绑定">
            <div className="space-y-2">{(editData.structure_bindings || []).map((binding, index) => { const structure = structures.find(item => item.structure_id === binding.structure_id); return <div key={index} className="grid grid-cols-[1fr_1fr_32px] gap-2"><Select value={binding.structure_id || ''} onValueChange={(value) => { const list = [...editData.structure_bindings]; list[index] = { structure_id: value, node_id: '' }; setEditData({ ...editData, structure_bindings: list }); }}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue placeholder="结构" /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{structures.map((item) => <SelectItem key={item.id} value={item.structure_id}>{item.name}</SelectItem>)}</SelectContent></Select><Select value={binding.node_id || ''} onValueChange={(value) => { const list = [...editData.structure_bindings]; list[index] = { ...binding, node_id: value }; setEditData({ ...editData, structure_bindings: list }); }}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue placeholder="节点" /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]">{(structure?.nodes || []).map((node) => <SelectItem key={node.node_id} value={node.node_id}>{node.name}</SelectItem>)}</SelectContent></Select><Button size="sm" variant="ghost" onClick={() => setEditData({ ...editData, structure_bindings: editData.structure_bindings.filter((_, itemIndex) => itemIndex !== index) })} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button></div>; })}</div>
            <Button size="sm" onClick={() => setEditData({ ...editData, structure_bindings: [...(editData.structure_bindings || []), { structure_id: '', node_id: '' }] })} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加绑定</Button>
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}