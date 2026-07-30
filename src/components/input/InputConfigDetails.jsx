import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';
import InputActionEditor from '@/components/input/InputActionEditor';
import InputContextEditor from '@/components/input/InputContextEditor';
import ExampleConfigPanel from '@/components/input/ExampleConfigPanel';
import { inputEditorExamples } from '@/components/input/contract/inputEditorExamples';

export default function InputConfigDetails({ draft, patch }) {
  return <div className="h-full overflow-auto p-3">
    <ExampleConfigPanel example={inputEditorExamples.InputConfig} />
    <Section title="C# InputConfigRoot">
      <div className="grid gap-3 md:grid-cols-2">
        <TextField label="Config ID" value={draft.config_id} onChange={config_id => patch({ config_id })} />
        <TextField label="名称" value={draft.name} onChange={name => patch({ name })} />
      </div>
    </Section>
    <Section title={`Actions · ${draft.actions?.length || 0}`}><InputActionEditor actions={draft.actions} onChange={actions => patch({ actions })} /></Section>
    <Section title={`Contexts · ${draft.contexts?.length || 0}`}><InputContextEditor contexts={draft.contexts} actions={draft.actions || []} onChange={contexts => patch({ contexts })} /></Section>
    <Section title="运行时 JSON"><pre className="overflow-auto whitespace-pre-wrap rounded bg-[#0D0F14] p-3 font-mono text-[10px] text-gray-400">{JSON.stringify({ actions: draft.actions || [], contexts: draft.contexts || [] }, null, 2)}</pre></Section>
  </div>;
}