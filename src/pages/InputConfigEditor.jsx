import React, { useState } from 'react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import InputConfigDetails from '@/components/input/InputConfigDetails';
import ConfigGuideButton from '@/components/help/ConfigGuideButton';
import ConfigGuideSidebar from '@/components/help/ConfigGuideSidebar';
import { inputConfigGuides } from '@/components/input/contract/inputConfigGuides';
import { inputConfigFieldGuides } from '@/components/input/contract/inputConfigFieldGuides';

export default function InputConfigEditorPage() {
  const editor = useRecordEditor('InputConfig', 'input-configs', () => ({
    config_id: `Input.Config.${Date.now()}`, name: '新输入配置',
    actions: [{ id: 'Move', name: 'Gameplay_Move', type: 'Axis2D' }],
    contexts: [{ id: 'Default_Gameplay', name: 'Default Gameplay', priority: 0, bindings: [] }],
  }));
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = { ...inputConfigGuides.InputConfig, ...inputConfigFieldGuides.InputConfig };
  return <RecordWorkspace entityName="InputConfig" records={editor.records} hideBrowserOnMobile
    columns={[{ key: 'config_id', label: 'Config ID', width: 240 }, { key: 'name', label: '名称' }, { key: 'actions', label: 'Actions', render: r => r.actions?.length || 0 }, { key: 'contexts', label: 'Contexts', render: r => r.contexts?.length || 0 }]}
    toItem={r => ({ id: r.id, name: r.name, subtitle: `${r.config_id} · ${r.actions?.length || 0} Actions` })}
    selectedId={editor.selectedId} onSelect={r => editor.setSelectedId(r.id)} onCreate={editor.create}
    headerRight={<ConfigGuideButton guide={guide} open={guideOpen} onToggle={() => setGuideOpen(open => !open)} />}
    detailAside={guideOpen ? <ConfigGuideSidebar guide={guide} onClose={() => setGuideOpen(false)} /> : null}
    onDelete={r => window.confirm(`确定删除「${r.name}」吗？`) && editor.remove(r.id)} onSave={editor.save} dirty={editor.dirty}>
    {editor.draft && <InputConfigDetails draft={editor.draft} patch={editor.patch} />}
  </RecordWorkspace>;
}