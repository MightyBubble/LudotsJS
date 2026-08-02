import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section, TextField, NumberField } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';

function ClipRows({ title, rows = [], builtin, clips, onChange }) {
  const patch = (i, p) => onChange(rows.map((r, x) => x === i ? { ...r, ...p } : r));
  return <Section title={title} right={<Button size="sm" onClick={() => onChange([...rows, builtin ? { builtin_clip_id: '', clip_asset_id: '' } : { packed_state_index: 0, clip_asset_id: '' }])} className="h-7 bg-[#1E2128]"><Plus className="w-3 h-3" />添加</Button>}>
    {rows.map((r,i)=><div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-3 items-end">
      {builtin ? <TextField label="Builtin Clip ID" value={r.builtin_clip_id} onChange={builtin_clip_id=>patch(i,{builtin_clip_id})}/> : <NumberField label="Packed State Index" value={r.packed_state_index} onChange={packed_state_index=>patch(i,{packed_state_index})}/>} 
      <ReferenceSelect label="Clip Asset" value={r.clip_asset_id} options={clips} onChange={clip_asset_id=>patch(i,{clip_asset_id})}/>
      <Button size="sm" variant="ghost" onClick={()=>onChange(rows.filter((_,x)=>x!==i))} className="text-red-400"><Trash2 className="w-3 h-3"/></Button>
    </div>)}
  </Section>;
}

export default function AnimationProfileDetails({ draft, patch, refs }) {
  return <div className="space-y-3"><Section title="animation_profiles.json"><TextField label="ID" value={draft.profile_id} onChange={profile_id=>patch({profile_id})}/><ReferenceSelect label="Animator Controller" value={draft.animator_controller_id} options={refs.controllers} onChange={animator_controller_id=>patch({animator_controller_id})}/></Section><ClipRows title="State Clips" rows={draft.state_clips} clips={refs.clips} onChange={state_clips=>patch({state_clips})}/><ClipRows title="Builtin Clips" builtin rows={draft.builtin_clips} clips={refs.clips} onChange={builtin_clips=>patch({builtin_clips})}/></div>;
}