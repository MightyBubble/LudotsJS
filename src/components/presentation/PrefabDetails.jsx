import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, TextField, NumberField, SelectField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from './ReferenceSelect';

export default function PrefabDetails({ draft, patch, refs }) {
  const rows = draft.parts || [];
  const set = (i,p) => patch({ parts: rows.map((r,x)=>x===i?{...r,...p}:r) });
  return <div className="space-y-3"><Section title="prefabs.json"><TextField label="ID" value={draft.prefab_id} onChange={prefab_id=>patch({prefab_id})}/><ReferenceSelect label="Root Mesh Asset" value={draft.mesh_asset_id} options={refs.meshes} onChange={mesh_asset_id=>patch({mesh_asset_id})}/><NumberField label="Base Scale" value={draft.base_scale} onChange={base_scale=>patch({base_scale})}/></Section><Section title="Parts" right={<Button size="sm" onClick={()=>patch({parts:[...rows,{kind:'Mesh'}]})} className="h-7 bg-[#1E2128]"><Plus className="w-3 h-3"/>添加 Part</Button>}>
    {rows.map((r,i)=><div key={i} className="rounded border border-[#2A2E37] p-3 space-y-3"><div className="grid grid-cols-1 md:grid-cols-4 gap-3"><SelectField label="Kind" value={r.kind} options={['Mesh','Surface','Decal','Vfx'].map(value=>({value,label:value}))} onChange={kind=>set(i,{kind})}/><ReferenceSelect label="Mesh Asset" value={r.mesh_asset_id} options={refs.meshes} onChange={mesh_asset_id=>set(i,{mesh_asset_id})}/><ReferenceSelect label="Material" value={r.material_id} options={refs.materials} onChange={material_id=>set(i,{material_id})}/><ReferenceSelect label="Effect" value={r.effect_asset_id} options={refs.effects} onChange={effect_asset_id=>set(i,{effect_asset_id})}/></div><JsonValueField label="Transform / Visual Fields" value={{local_position:r.local_position,local_rotation:r.local_rotation,local_scale:r.local_scale,color_tint:r.color_tint,size:r.size,tiling:r.tiling}} onChange={v=>set(i,v||{})}/><Button size="sm" variant="ghost" onClick={()=>patch({parts:rows.filter((_,x)=>x!==i)})} className="text-red-400"><Trash2 className="w-3 h-3"/>删除</Button></div>)}
  </Section></div>;
}