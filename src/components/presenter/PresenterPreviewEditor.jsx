import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section } from '@/components/ludots/ui';
import PresenterPreviewViewport from './PresenterPreviewViewport';
import PresenterInstanceEditor from './PresenterInstanceEditor';
import PresenterAnimatorPreviewTab from './PresenterAnimatorPreviewTab';
import VectorField from './VectorField';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { writeInstanceTransform } from '@/lib/runtime/presenterOverrides';

export default function PresenterPreviewEditor({ root, draft, records, patch, selectedInstance, onSelectInstancePath, onChangeInstance, onRequestInheritedEdit, details }) {
  const [mode, setMode] = useState('translate');
  const [previewStateIndex, setPreviewStateIndex] = useState(0);
  const bindingsQuery = useQuery({ queryKey: ['presenter-preview-bindings'], queryFn: () => base44.entities.HostAssetBinding.list('-updated_date', 500) });
  const assetsQuery = useQuery({ queryKey: ['presenter-preview-assets'], queryFn: () => base44.entities.Asset.list('-updated_date', 500) });
  const effectsQuery = useQuery({ queryKey: ['presenter-preview-effects'], queryFn: () => base44.entities.PresentationEffectAsset.list('-updated_date', 500) });
  const controllersQuery = useQuery({ queryKey: ['presenter-preview-controllers'], queryFn: () => base44.entities.AnimatorControllerDefinition.list('-updated_date', 500) });
  const profilesQuery = useQuery({ queryKey: ['presenter-preview-profiles'], queryFn: () => base44.entities.AnimationProfileDefinition.list('-updated_date', 500) });
  const clipsQuery = useQuery({ queryKey: ['presenter-preview-clips'], queryFn: () => base44.entities.AnimationClipAsset.list('-updated_date', 500) });
  const bindings = bindingsQuery.data || [];
  const assets = assetsQuery.data || [];
  const effects = effectsQuery.data || [];
  const controllers = controllersQuery.data || [];
  const profiles = profilesQuery.data || [];
  const clips = clipsQuery.data || [];
  const ready = bindingsQuery.isSuccess && assetsQuery.isSuccess && effectsQuery.isSuccess && controllersQuery.isSuccess && profilesQuery.isSuccess && clipsQuery.isSuccess;
  useEffect(() => { setPreviewStateIndex(0); }, [draft.presenter_id]);
  const applyTransform = useCallback(next => {
    if (selectedInstance) {
      if (selectedInstance.source === 'nested_template') {
        onRequestInheritedEdit?.();
        return;
      }
      onChangeInstance?.(writeInstanceTransform(selectedInstance.instance, next));
      return;
    }
    patch({ anchor: { ...(draft.anchor || {}), offset: next.localPosition || [0, 0, 0] } });
  }, [draft.anchor, onChangeInstance, onRequestInheritedEdit, patch, selectedInstance]);
  const presenterOptions = records.map(item => ({ value: item.presenter_id, label: item.label || item.presenter_id }));
  return <>
    <Section title="3D Prefab 预览">
      {ready ? <PresenterPreviewViewport root={root} selectedInstancePath={selectedInstance?.path || 'root'} presenters={records} bindings={bindings} assets={assets} effects={effects} controllers={controllers} profiles={profiles} clips={clips} activeStateIndex={previewStateIndex} mode={mode} onModeChange={setMode} onSelectPath={onSelectInstancePath} onTransform={applyTransform} /> : <div className="flex h-[480px] items-center justify-center rounded border border-[#424a55] bg-[#0D0F14] text-xs text-gray-500">正在加载 Prefab 资源…</div>}
    </Section>
    <div className="min-w-0">
      <Tabs defaultValue="settings" className="min-w-0">
        <TabsList className="grid h-9 w-full grid-cols-2 rounded bg-[#0D0F14] p-0.5">
          <TabsTrigger value="settings" className="h-8 text-[11px]">{selectedInstance ? '实例设置' : '根节点设置'}</TabsTrigger>
          <TabsTrigger value="animator" className="h-8 text-[11px]">Animator 预览</TabsTrigger>
        </TabsList>
        <TabsContent value="settings" className="mt-3">
          {selectedInstance ? <PresenterInstanceEditor node={selectedInstance} presenters={presenterOptions} onChange={onChangeInstance} onRequestInheritedEdit={onRequestInheritedEdit} /> : <Section title="Presenter Root Anchor"><VectorField label="Anchor Offset (XYZ)" value={draft.anchor?.offset || [0, 0, 0]} onChange={offset => patch({ anchor: { ...(draft.anchor || {}), offset } })} /></Section>}
        </TabsContent>
        <TabsContent value="animator" className="mt-3">
          <PresenterAnimatorPreviewTab root={root} presenters={records} controllers={controllers} profiles={profiles} stateIndex={previewStateIndex} onStateIndex={setPreviewStateIndex} />
        </TabsContent>
      </Tabs>
    </div>
    {!selectedInstance && <div className="xl:col-span-3 min-w-0">{details}</div>}
  </>;
}
