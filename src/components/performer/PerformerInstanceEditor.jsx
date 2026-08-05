import React from 'react';
import { NumberField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';

export default function PerformerInstanceEditor({ node, performers, onChange }) {
  if (!node?.instance) return null;
  const instance = node.instance;
  return <div className="space-y-3 rounded border border-[#424a55] bg-[#171b21] p-3">
    <div>
      <p className="text-xs font-semibold text-[#dce2e8]">子 Performer 实例</p>
      <p className="mt-1 font-mono text-[10px] text-gray-500">{node.path}</p>
    </div>
    {onChange ? <>
      <ReferenceSelect label="Definition ID" value={instance.definition_id} options={performers} onChange={definition_id => onChange({ ...instance, definition_id })} />
      <NumberField label="Scope Tag" value={instance.scope_tag} onChange={scope_tag => onChange({ ...instance, scope_tag })} />
      <JsonValueField label="Param Overrides" value={instance.param_overrides} onChange={param_overrides => onChange({ ...instance, param_overrides })} />
    </> : <p className="text-[11px] text-gray-500">该实例属于嵌套定义，此处仅选择与预览，不会切换当前父级数据。</p>}
  </div>;
}