import React from 'react';
import { useLocation } from 'react-router-dom';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import PresentationConfigDetails from '@/components/presentation/PresentationConfigDetails';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';
import { PRESENTATION_CONFIGS } from '@/components/presentation/presentationConfigSpecs';

export function ConfigWorkspace({ type }) {
  const spec = PRESENTATION_CONFIGS[type] || PRESENTATION_CONFIGS.mesh;
  const refs = usePresentationRefs();
  const editor = useRecordEditor(spec.entity, spec.query, spec.blank);
  return <RecordWorkspace entityName={spec.entity} records={editor.records}
    columns={[{key:spec.key,label:'ID',render:r=><span className="font-mono text-[#E2D8B3]">{r[spec.key]}</span>}]} 
    toItem={r=>({id:r.id,name:r[spec.key],subtitle:spec.title})}
    selectedId={editor.selectedId} onSelect={r=>editor.setSelectedId(r.id)} onCreate={editor.create} onSave={editor.save} dirty={editor.dirty}
    onDelete={r=>{if(window.confirm(`确定删除「${r[spec.key]}」吗？`)) editor.remove(r.id)}}>
    {editor.draft && <PresentationConfigDetails type={type} draft={editor.draft} patch={editor.patch} refs={refs}/>} 
  </RecordWorkspace>;
}

export default function PresentationConfigEditor() {
  const requestedType = new URLSearchParams(useLocation().search).get('type') || 'mesh';
  const type = PRESENTATION_CONFIGS[requestedType] ? requestedType : 'mesh';
  return <ConfigWorkspace key={type} type={type} />;
}