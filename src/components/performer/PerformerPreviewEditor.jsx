import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section } from '@/components/ludots/ui';
import PerformerPreviewViewport from './PerformerPreviewViewport';
import PerformerTransformEditor from './PerformerTransformEditor';
import PerformerInstanceEditor from './PerformerInstanceEditor';
import { writeInstanceTransform } from '@/lib/runtime/performerOverrides';

export default function PerformerPreviewEditor({ root, draft, records, patch, selectedInstance, onChangeInstance }) {
  const [selectedSlot, setSelectedSlot] = useState('0');
  const [mode, setMode] = useState('translate');
  const bindingsQuery = useQuery({ queryKey: ['performer-preview-bindings'], queryFn: () => base44.entities.HostAssetBinding.list('-updated_date', 500) });
  const assetsQuery = useQuery({ queryKey: ['performer-preview-assets'], queryFn: () => base44.entities.Asset.list('-updated_date', 500) });
  const effectsQuery = useQuery({ queryKey: ['performer-preview-effects'], queryFn: () => base44.entities.PresentationEffectAsset.list('-updated_date', 500) });
  const bindings = bindingsQuery.data || [];
  const assets = assetsQuery.data || [];
  const effects = effectsQuery.data || [];
  const ready = bindingsQuery.isSuccess && assetsQuery.isSuccess && effectsQuery.isSuccess;
  const assetBehaviors = useMemo(() => (draft.behaviors || []).filter(behavior => behavior.kind === 'AssetBinding'), [draft.behaviors]);
  useEffect(() => setSelectedSlot('0'), [draft.performer_id]);
  const updateAssetBehaviors = useCallback(next => {
    let cursor = 0;
    patch({ behaviors: (draft.behaviors || []).map(behavior => behavior.kind === 'AssetBinding' ? next[cursor++] : behavior) });
  }, [draft.behaviors, patch]);
  const applyTransform = useCallback(next => {
    if (selectedInstance) {
      onChangeInstance?.(writeInstanceTransform(selectedInstance.instance, next));
      return;
    }
    const index = Number(selectedSlot || 0);
    updateAssetBehaviors(assetBehaviors.map((behavior, itemIndex) => itemIndex === index ? { ...behavior, assetBinding: { ...(behavior.assetBinding || {}), ...next } } : behavior));
  }, [assetBehaviors, onChangeInstance, selectedInstance, selectedSlot, updateAssetBehaviors]);
  const performerOptions = records.map(item => ({ value: item.performer_id, label: item.label || item.performer_id }));
  return <Section title="3D Prefab 预览与变换">
    {ready ? <PerformerPreviewViewport root={root} selectedInstancePath={selectedInstance?.path || 'root'} performers={records} bindings={bindings} assets={assets} effects={effects} targetSlot={!selectedInstance ? assetBehaviors[Number(selectedSlot || 0)]?.slot : undefined} mode={mode} onModeChange={setMode} onTransform={applyTransform} /> : <div className="flex h-[480px] items-center justify-center rounded border border-[#424a55] bg-[#0D0F14] text-xs text-gray-500">正在加载 Prefab 资源…</div>}
    {selectedInstance ? <PerformerInstanceEditor node={selectedInstance} performers={performerOptions} onChange={onChangeInstance} /> : <PerformerTransformEditor behaviors={assetBehaviors} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} onChange={updateAssetBehaviors} />}
  </Section>;
}