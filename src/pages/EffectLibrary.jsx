import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import EffectDetailsEditor from '@/components/ludots/EffectDetailsEditor';
import { validateEffect } from '@/components/ludots/validation';

export default function EffectLibraryPage() {
  const editor = useRecordEditor('Effect', 'effects', () => ({
    effect_id: `effect_${Date.now()}`,
    tags: [],
    presetType: 'None',
    lifetime: 'Instant',
    participatesInResponse: false,
  }));
  const refs = useCoreRefs();
  const issues = editor.draft ? validateEffect(editor.draft, refs) : [];
  return (
    <RecordWorkspace
      entityName="Effect" records={editor.records}
      columns={[
        { key: 'effect_id', label: 'id', width: 220, render: (r) => <span className="font-mono text-[#E2D8B3]">{r.effect_id}</span> },
        { key: 'presetType', label: 'presetType', width: 160 },
        { key: 'lifetime', label: 'lifetime', width: 110 },
        { key: 'participatesInResponse', label: '响应链', width: 80, render: (r) => r.participatesInResponse ? '是' : '否' },
        { key: 'tags', label: 'tags', render: (r) => (r.tags || []).join(', ') || '-' },
      ]}
      toItem={(r) => ({ id: r.id, name: r.effect_id, subtitle: `${r.lifetime || 'Instant'} · ${r.presetType || 'None'}` })}
      selectedId={editor.selectedId} onSelect={(r) => editor.setSelectedId(r.id)} onCreate={editor.create}
      onDelete={(r) => window.confirm(`确定删除「${r.effect_id}」吗？`) && editor.remove(r.id)}
      onSave={editor.save} dirty={editor.dirty} hideBrowserOnMobile
    >
      {editor.draft && <EffectDetailsEditor draft={editor.draft} patch={editor.patch} refs={refs} issues={issues} effects={editor.records.map(record => record.id === editor.draft.id ? editor.draft : record)} />}
    </RecordWorkspace>
  );
}