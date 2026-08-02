import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, NumberField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';

export default function PerformerChildrenSection({ value = [], performers, onChange }) {
  const patch=(i,p)=>onChange(value.map((r,x)=>x===i?{...r,...p}:r));
  return <Section title="Children" right={<Button size="sm" onClick={()=>onChange([...value,{definition_id:'',scope_tag:0,param_overrides:[]}])} className="h-7 bg-[#1E2128]"><Plus className="w-3 h-3"/>添加子 Performer</Button>}>
    {value.map((r,i)=><div key={i} className="grid grid-cols-[2fr_1fr_2fr_auto] gap-3 items-end"><ReferenceSelect label="Definition ID" value={r.definition_id} options={performers} onChange={definition_id=>patch(i,{definition_id})}/><NumberField label="Scope Tag" value={r.scope_tag} onChange={scope_tag=>patch(i,{scope_tag})}/><JsonValueField label="Param Overrides" value={r.param_overrides} onChange={param_overrides=>patch(i,{param_overrides})}/><Button size="sm" variant="ghost" onClick={()=>onChange(value.filter((_,x)=>x!==i))} className="text-red-400"><Trash2 className="w-3 h-3"/></Button></div>)}
  </Section>;
}