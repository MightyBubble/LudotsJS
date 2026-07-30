import React from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import AbilityDetailsEditor from '@/components/ludots/AbilityDetailsEditor';
import { getAbilityDisplayName, toAbilityContract } from '@/components/ludots/abilityContract';
import { validateAbility } from '@/components/ludots/validation';

export default function AbilityLibraryPage() {
  const editor = useRecordEditor('Ability', 'abilities', () => ({
    ability_id: `Ability.New.${Date.now()}`,
    exec: { clockId: 'FixedFrame', interruptAny: [], callerParams: [], items: [{ kind: 'End', tick: 0 }] },
    onActivateEffects: [], blockTags: { requiredAll: [], blockedAny: [] }, catalogTags: [],
    presentation: { displayName: '新能力' },
  }), toAbilityContract);
  const refs = useCoreRefs();
  const issues = editor.draft ? validateAbility(editor.draft, refs) : [];

  return <RecordWorkspace
    entityName="Ability" records={editor.records}
    columns={[
      { key: 'ability_id', label: 'Ability ID', width: 240, render: record => <span className="font-mono text-[#E2D8B3]">{record.ability_id}</span> },
      { key: 'presentation', label: '显示名称', width: 180, render: getAbilityDisplayName },
      { key: 'exec', label: 'Exec Items', width: 90, render: record => record.exec?.items?.length || 0 },
      { key: 'onActivateEffects', label: '激活效果', width: 90, render: record => record.onActivateEffects?.length || 0 },
      { key: 'catalogTags', label: '目录标签', render: record => (record.catalogTags || []).join(', ') || '-' },
    ]}
    toItem={record => ({ id: record.id, name: getAbilityDisplayName(record), subtitle: `${record.ability_id} · ${record.exec?.items?.length || 0} Exec Items` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${getAbilityDisplayName(record)}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}
  >
    {editor.draft && <AbilityDetailsEditor draft={editor.draft} patch={editor.patch} refs={refs} issues={issues} />}
  </RecordWorkspace>;
}