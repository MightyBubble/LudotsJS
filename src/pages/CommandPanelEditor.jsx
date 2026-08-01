import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import CommandPanelProfileDetails from '@/components/commandPanel/CommandPanelProfileDetails';

export default function CommandPanelEditorPage() {
  const { data: tags = [] } = useQuery({
    queryKey: ['gameplay-tags'],
    queryFn: () => base44.entities.GameplayTag.list('full_path'),
    initialData: [],
  });
  const { data: inputConfigs = [] } = useQuery({
    queryKey: ['input-configs'],
    queryFn: () => base44.entities.InputConfig.list(),
    initialData: [],
  });
  const { data: constants = [] } = useQuery({
    queryKey: ['global-constants'],
    queryFn: () => base44.entities.GlobalConstant.list('constant_key'),
    initialData: [],
  });

  const actions = inputConfigs.flatMap(c => c.actions || []);
  const keysOf = category => constants.filter(c => c.category === category).map(c => c.constant_key);

  const editor = useRecordEditor('CommandPanelProfile', 'command-panel-profiles', () => ({
    panel_id: `panel_${Date.now()}`,
    label: '',
    description: '',
    layout_mode: 'dynamic',
    aggregate_rules: [],
    slots: [],
  }));

  return <RecordWorkspace entityName="CommandPanelProfile" records={editor.records} hideBrowserOnMobile
    columns={[
      { key: 'panel_id', label: 'Panel ID', width: 240 },
      { key: 'label', label: '显示名', width: 160 },
      { key: 'layout_mode', label: '落位', width: 100 },
      { key: 'actor_collection_key', label: 'Actor 集合键' },
    ]}
    toItem={record => ({
      id: record.id,
      name: record.label || record.panel_id,
      subtitle: `${record.layout_mode === 'fixed' ? '固定槽位' : '动态排列'} · ${record.actor_collection_key || '未设置集合键'}`,
    })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.panel_id}」吗？`) && editor.remove(record.id)}
    onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <CommandPanelProfileDetails draft={editor.draft} patch={editor.patch} tags={tags} actions={actions}
      sortKeys={keysOf('panel_sort')} slotKeys={keysOf('panel_slot')} hotkeySequences={keysOf('panel_hotkey_sequence')} />}
  </RecordWorkspace>;
}