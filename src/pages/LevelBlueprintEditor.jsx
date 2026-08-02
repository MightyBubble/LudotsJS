import React, { useState } from 'react';
import useProjectScope from '@/lib/projectScope';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import LevelBlueprintDetails from '@/components/level/LevelBlueprintDetails';

export default function LevelBlueprintEditor() {
  const scope = useProjectScope();
  const [error, setError] = useState('');
  const editor = useRecordEditor('LevelBlueprint', 'level-blueprints', () => ({
    blueprint_id: `Level.${Date.now()}`, label: '新关卡蓝图', description: '', trigger_type_name: '', ...scope.newScopeFields(),
  }));
  const records = editor.records.filter(scope.inScope);
  const save = () => {
    if (!editor.draft?.blueprint_id?.trim()) return setError('Blueprint ID 必填。');
    if (!editor.draft?.trigger_type_name?.trim()) return setError('Trigger 类型名必填，Map 需要用它引用蓝图。');
    setError('');
    editor.save();
  };
  return <RecordWorkspace entityName="LevelBlueprint" records={records} hideBrowserOnMobile
    columns={[{ key: 'blueprint_id', label: 'Blueprint ID', width: 240 }, { key: 'label', label: '名称' }, { key: 'trigger_type_name', label: 'Trigger 类型名' }]}
    toItem={r => ({ id: r.id, name: r.label || r.blueprint_id, subtitle: r.trigger_type_name || '未设置 Trigger 类型名' })}
    selectedId={editor.selectedId} onSelect={r => { setError(''); editor.setSelectedId(r.id); }} onCreate={editor.create}
    onDelete={r => window.confirm(`确定删除「${r.label || r.blueprint_id}」吗？`) && editor.remove(r.id)} onSave={save} dirty={editor.dirty}>
    {editor.draft && <LevelBlueprintDetails draft={editor.draft} patch={editor.patch} error={error} />}
  </RecordWorkspace>;
}