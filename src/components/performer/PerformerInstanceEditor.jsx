import React from 'react';
import { TextField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import VectorField from './VectorField';
import PerformerBehaviorList from './PerformerBehaviorList';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';
import { readInstanceOverrides, writeInstanceParams, writeInstanceTransform } from '@/lib/runtime/performerOverrides';

export default function PerformerInstanceEditor({ node, performers, onChange }) {
  const refs = usePresentationRefs();
  if (!node?.instance) return null;
  const instance = node.instance;
  const overrides = readInstanceOverrides(instance);
  const patchTransform = patch => onChange(writeInstanceTransform(instance, { ...overrides.transform, ...patch }));
  return <div className="space-y-3 rounded border border-[#424a55] bg-[#171b21] p-3">
    <div>
      <p className="text-xs font-semibold text-[#dce2e8]">子 Performer 实例</p>
      <p className="mt-1 font-mono text-[10px] text-gray-500">{node.path}</p>
      {node.source === 'nested_template' && <p className="mt-2 rounded border border-amber-900/60 bg-amber-950/30 px-2 py-1.5 text-[10px] text-amber-200">来自嵌套 Performer 模板；首次修改会在当前根 Performer 中生成局部覆盖，不会修改原模板。</p>}
      {node.source === 'nested_override' && <p className="mt-2 rounded border border-sky-900/60 bg-sky-950/30 px-2 py-1.5 text-[10px] text-sky-200">当前节点已由根 Performer 局部覆盖；运行时优先使用该实例数据。</p>}
    </div>
    {onChange ? <>
      <ReferenceSelect label="Definition ID" value={instance.definition_id} options={performers} onChange={definition_id => onChange({ ...instance, definition_id })} />
      <TextField label="Scope Tag" value={instance.scope_tag} onChange={scope_tag => onChange({ ...instance, scope_tag })} hint="命名作用域，例如 structure / working；C# 运行时通过 PerformerScopeTagRegistry 解析为整数 ID" />
      <div className="rounded border border-[#424a55] bg-[#0D0F14] p-3 space-y-3">
        <p className="text-[10px] font-semibold text-[#cbd3dc]">实例 Transform Override · JS Runtime · C# 待对齐</p>
        <VectorField label="Local Position" value={overrides.transform.local_position} onChange={local_position => patchTransform({ local_position })} />
        <VectorField label="Local Rotation (deg)" value={overrides.transform.local_rotation} onChange={local_rotation => patchTransform({ local_rotation })} />
        <VectorField label="Local Scale" value={overrides.transform.local_scale} onChange={local_scale => patchTransform({ local_scale })} />
      </div>
      <JsonValueField label="Param Overrides" value={overrides.params} onChange={params => onChange(writeInstanceParams(instance, params))} />
      <PerformerBehaviorList
        title="Instance Runtime Behaviors"
        description="仅属于当前 Child 实例；创建后自动激活，不修改被引用的 Performer 模板。"
        behaviors={instance.runtime_behaviors || []}
        refs={refs}
        onChange={runtime_behaviors => onChange({ ...instance, runtime_behaviors })}
      />
    </> : <p className="text-[11px] text-gray-500">该实例属于嵌套定义，此处仅选择与预览，不会切换当前父级数据。</p>}
  </div>;
}