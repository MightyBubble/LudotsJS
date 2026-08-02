import React from 'react';
import { Section, TextField } from '@/components/ludots/ui';

export default function LevelBlueprintDetails({ draft, patch, error }) {
  return <div className="max-w-3xl">
    {error && <p className="mb-3 text-xs text-red-300">{error}</p>}
    <Section title="关卡蓝图">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Blueprint ID" value={draft.blueprint_id} onChange={blueprint_id => patch({ blueprint_id })} />
        <TextField label="Trigger 类型名" value={draft.trigger_type_name} onChange={trigger_type_name => patch({ trigger_type_name })} hint="Map 引用本蓝图时写入 MapConfig.TriggerTypes 的 C# 类型名。" />
        <TextField label="名称" value={draft.label} onChange={label => patch({ label })} />
        <TextField label="说明" value={draft.description} onChange={description => patch({ description })} />
      </div>
    </Section>
  </div>;
}