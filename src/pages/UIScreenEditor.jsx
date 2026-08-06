import React, { useEffect } from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import UIScreenProfileDetails from '@/components/uiScreen/UIScreenProfileDetails';
import { DEFAULT_UI_SKIN } from '@/lib/runtime/uiScreenRuntime';

export default function UIScreenEditor() {
  const editor = useRecordEditor('UIScreenProfile', 'ui-screen-profiles', () => ({
    screen_id: `screen_${Date.now()}`, label: '', description: '', skin: { ...DEFAULT_UI_SKIN },
    slots: [{ slot_id: 'slot_main', label: '', anchor: { horizontal: 'center', vertical: 'bottom', offset_x: 0, offset_y: 12 }, width: 320 }],
  }));
  useEffect(() => { if (!editor.selectedId && editor.records[0]) editor.setSelectedId(editor.records[0].id); }, [editor.selectedId, editor.records]);
  return <RecordWorkspace entityName="UIScreenProfile" records={editor.records} hideBrowserOnMobile
    columns={[{ key: 'screen_id', label: 'Screen ID', width: 240 }, { key: 'label', label: '显示名' }, { key: 'slots', label: '槽位数', render: record => (record.slots || []).length }]}
    toItem={record => ({ id: record.id, name: record.label || record.screen_id, subtitle: `${(record.slots || []).length} 个槽位` })}
    selectedId={editor.selectedId} onSelect={record => editor.setSelectedId(record.id)} onCreate={editor.create}
    onDelete={record => window.confirm(`确定删除「${record.screen_id}」吗？`) && editor.remove(record.id)} onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <UIScreenProfileDetails draft={editor.draft} patch={editor.patch} />}
  </RecordWorkspace>;
}
