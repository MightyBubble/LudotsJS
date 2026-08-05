import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import VectorField from './VectorField';
import PerformerBehaviorList from './PerformerBehaviorList';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';
import { readInstanceOverrides, writeInstanceParams, writeInstanceTransform } from '@/lib/runtime/performerOverrides';

export default function PerformerInstanceTabs({ instance, performers, onChange }) {
  const refs = usePresentationRefs();
  const overrides = readInstanceOverrides(instance);
  const patchTransform = patch => onChange(writeInstanceTransform(instance, { ...overrides.transform, ...patch }));
  return <Tabs defaultValue="instance" className="min-w-0">
    <TabsList className="grid h-8 w-full grid-cols-2 rounded bg-[#0D0F14] p-0.5">
      <TabsTrigger value="instance" className="h-7 text-[11px]">实例设置</TabsTrigger>
      <TabsTrigger value="params" className="h-7 text-[11px]">参数覆盖</TabsTrigger>
    </TabsList>
    <TabsContent value="instance" className="mt-3 space-y-3">
      <ReferenceSelect label="Definition ID" value={instance.definition_id} options={performers} onChange={definition_id => onChange({ ...instance, definition_id })} />
      <TextField label="Scope Tag" value={instance.scope_tag} onChange={scope_tag => onChange({ ...instance, scope_tag })} hint="命名作用域；C# 运行时通过 PerformerScopeTagRegistry 解析" />
      <div className="space-y-3 rounded border border-[#424a55] bg-[#0D0F14] p-3">
        <p className="text-[10px] font-semibold text-[#cbd3dc]">实例 Transform Override · JS Runtime · C# 待对齐</p>
        <VectorField label="Local Position" value={overrides.transform.local_position} onChange={local_position => patchTransform({ local_position })} />
        <VectorField label="Local Rotation (deg)" value={overrides.transform.local_rotation} onChange={local_rotation => patchTransform({ local_rotation })} />
        <VectorField label="Local Scale" value={overrides.transform.local_scale} onChange={local_scale => patchTransform({ local_scale })} />
      </div>
    </TabsContent>
    <TabsContent value="params" className="mt-3 space-y-3">
      <JsonValueField label="Param Overrides" value={overrides.params} onChange={params => onChange(writeInstanceParams(instance, params))} />
      <PerformerBehaviorList title="Instance Runtime Behaviors" description="仅属于当前 Child 实例；不修改被引用的 Performer 模板。" behaviors={instance.runtime_behaviors || []} refs={refs} onChange={runtime_behaviors => onChange({ ...instance, runtime_behaviors })} />
    </TabsContent>
  </Tabs>;
}