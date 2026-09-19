import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TextField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import VectorField from './VectorField';
import PresenterBehaviorList from './PresenterBehaviorList';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';
import { readInstanceOverrides, writeInstanceParams, writeInstanceTransform } from '@/lib/runtime/presenterOverrides';

export default function PresenterInstanceTabs({ instance, presenters, onChange }) {
  const refs = usePresentationRefs();
  const overrides = readInstanceOverrides(instance);
  const patchTransform = patch => onChange(writeInstanceTransform(instance, { ...overrides.transform, ...patch }));
  return <Tabs defaultValue="instance" className="min-w-0">
    <TabsList className="grid h-8 w-full grid-cols-2 rounded bg-[#0D0F14] p-0.5">
      <TabsTrigger value="instance" className="h-7 text-[11px]">实例设置</TabsTrigger>
      <TabsTrigger value="params" className="h-7 text-[11px]">参数覆盖</TabsTrigger>
    </TabsList>
    <TabsContent value="instance" className="mt-3 space-y-3">
      <ReferenceSelect label="Definition ID" value={instance.definitionId} options={presenters} onChange={definitionId => onChange({ ...instance, definitionId })} />
      <TextField label="Scope Tag" value={instance.scopeTag} onChange={scopeTag => onChange({ ...instance, scopeTag })} hint="命名作用域；C# 运行时通过 PresenterScopeTagRegistry 解析" />
      <div className="space-y-3 rounded border border-[#424a55] bg-[#0D0F14] p-3">
        <p className="text-[10px] font-semibold text-[#cbd3dc]">实例 Transform Override</p>
        <VectorField label="Local Position" value={overrides.transform.localPosition} onChange={localPosition => patchTransform({ localPosition })} />
        <VectorField label="Local Rotation (deg)" value={overrides.transform.localRotation} onChange={localRotation => patchTransform({ localRotation })} />
        <VectorField label="Local Scale" value={overrides.transform.localScale} onChange={localScale => patchTransform({ localScale })} />
      </div>
    </TabsContent>
    <TabsContent value="params" className="mt-3 space-y-3">
      <JsonValueField label="Param Overrides" value={overrides.params} onChange={params => onChange(writeInstanceParams(instance, params))} />
      <PresenterBehaviorList title="Instance Runtime Behaviors" description="仅属于当前 Child 实例；不修改被引用的 Presenter 模板。" behaviors={instance.runtime_behaviors || []} refs={refs} onChange={runtime_behaviors => onChange({ ...instance, runtime_behaviors })} />
    </TabsContent>
  </Tabs>;
}
