import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section } from '@/components/ludots/ui';
import PerformerPreviewViewport from './PerformerPreviewViewport';
import PerformerTransformEditor from './PerformerTransformEditor';

export default function PerformerPreviewEditor({ draft, patch }) {
  const [selectedSlot, setSelectedSlot] = useState('0');
  const [mode, setMode] = useState('translate');
  const performers = useQuery({ queryKey: ['performer-preview-records'], queryFn: () => base44.entities.Performer.list() }).data || [];
  const bindings = useQuery({ queryKey: ['performer-preview-bindings'], queryFn: () => base44.entities.HostAssetBinding.list() }).data || [];
  const assetBehaviors = useMemo(() => (draft.behaviors || []).filter(behavior => behavior.kind === 'AssetBinding'), [draft.behaviors]);
  useEffect(() => setSelectedSlot('0'), [draft.performer_id]);
  const updateAssetBehaviors = useCallback(next => {
    let cursor = 0;
    patch({ behaviors: (draft.behaviors || []).map(behavior => behavior.kind === 'AssetBinding' ? next[cursor++] : behavior) });
  }, [draft.behaviors, patch]);
  const applyTransform = useCallback(next => {
    const index = Number(selectedSlot || 0);
    updateAssetBehaviors(assetBehaviors.map((behavior, itemIndex) => itemIndex === index ? { ...behavior, assetBinding: { ...(behavior.assetBinding || {}), ...next } } : behavior));
  }, [assetBehaviors, selectedSlot, updateAssetBehaviors]);
  return <Section title="3D Prefab 预览与变换">
    <PerformerPreviewViewport draft={draft} performers={performers} bindings={bindings} targetSlot={assetBehaviors[Number(selectedSlot || 0)]?.slot} mode={mode} onModeChange={setMode} onTransform={applyTransform} />
    <PerformerTransformEditor behaviors={assetBehaviors} selectedSlot={selectedSlot} onSelectSlot={setSelectedSlot} onChange={updateAssetBehaviors} />
  </Section>;
}