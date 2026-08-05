import React from 'react';
import { NumberField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import VectorField from './VectorField';
import { readInstanceOverrides, writeInstanceParams, writeInstanceTransform } from '@/lib/runtime/performerOverrides';

export default function PerformerInstanceEditor({ node, performers, onChange }) {
  if (!node?.instance) return null;
  const instance = node.instance;
  const overrides = readInstanceOverrides(instance);
  const patchTransform = patch => onChange(writeInstanceTransform(instance, { ...overrides.transform, ...patch }));
  return <div className="space-y-3 rounded border border-[#424a55] bg-[#171b21] p-3">
    <div>
      <p className="text-xs font-semibold text-[#dce2e8]">子 Performer 实例</p>
      <p className="mt-1 font-mono text-[10px] text-gray-500">{node.path}</p>
    </div>
    {onChange ? <>
      <ReferenceSelect label="Definition ID" value={instance.definition_id} options={performers} onChange={definition_id => onChange({ ...instance, definition_id })} />
      <NumberField label="Scope Tag" value={instance.scope_tag} onChange={scope_tag => onChange({ ...instance, scope_tag })} />
      <div className="rounded border border-[#424a55] bg-[#0D0F14] p-3 space-y-3">
        <p className="text-[10px] font-semibold text-[#cbd3dc]">实例 Transform Override · JS Runtime · C# 待对齐</p>
        <VectorField label="Local Position" value={overrides.transform.local_position} onChange={local_position => patchTransform({ local_position })} />
        <VectorField label="Local Rotation (deg)" value={overrides.transform.local_rotation} onChange={local_rotation => patchTransform({ local_rotation })} />
        <VectorField label="Local Scale" value={overrides.transform.local_scale} onChange={local_scale => patchTransform({ local_scale })} />
      </div>
      <JsonValueField label="Param Overrides" value={overrides.params} onChange={params => onChange(writeInstanceParams(instance, params))} />
    </> : <p className="text-[11px] text-gray-500">该实例属于嵌套定义，此处仅选择与预览，不会切换当前父级数据。</p>}
  </div>;
}