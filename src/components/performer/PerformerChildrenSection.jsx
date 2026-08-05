import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, NumberField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import PerformerBehaviorList from './PerformerBehaviorList';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';

export default function PerformerChildrenSection({ value = [], performers, onChange }) {
  const refs = usePresentationRefs();
  const patch=(i,p)=>onChange(value.map((r,x)=>x===i?{...r,...p}:r));
  return <Section title="Children" right={<Button size="sm" onClick={()=>onChange([...value,{definition_id:'',scope_tag:0,param_overrides:[],runtime_behaviors:[]}])} className="h-7 bg-[#1E2128]"><Plus className="w-3 h-3"/>添加子 Performer</Button>}>
    {value.map((r,i)=><div key={i} className="space-y-3 rounded border border-[#2A2E37] bg-[#0D0F14] p-3"><div className="grid grid-cols-[2fr_1fr_2fr_auto] gap-3 items-end"><ReferenceSelect label="Definition ID" value={r.definition_id} options={performers} onChange={definition_id=>patch(i,{definition_id})}/><NumberField label="Scope Tag" value={r.scope_tag} onChange={scope_tag=>patch(i,{scope_tag})}/><JsonValueField label="Param Overrides" value={r.param_overrides} onChange={param_overrides=>patch(i,{param_overrides})}/><Button size="sm" variant="ghost" onClick={()=>onChange(value.filter((_,x)=>x!==i))} className="text-red-400"><Trash2 className="w-3 h-3"/></Button></div><PerformerBehaviorList title="Instance Runtime Behaviors" description="实例创建后自动激活，与 Performer 模板 Behavior 相互独立。" behaviors={r.runtime_behaviors || []} refs={refs} onChange={runtime_behaviors=>patch(i,{runtime_behaviors})}/></div>)}
  </Section>;
}