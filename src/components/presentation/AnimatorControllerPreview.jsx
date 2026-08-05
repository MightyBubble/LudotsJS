import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';
import AnimatedModelPreview from './AnimatedModelPreview';
import AnimatorPreviewParameters from './AnimatorPreviewParameters';
import { findLocatorAsset } from './animationAssetOptions';
import useControllerPreviewMachine from '@/hooks/useControllerPreviewMachine';

export default function AnimatorControllerPreview({ draft, patch, layer, parameters, playing, onRuntimeChange }) {
  const results = useQueries({ queries: ['Asset', 'AnimationClipAsset', 'AnimationProfileDefinition'].map(entity => ({ queryKey: ['animator-preview', entity], queryFn: () => base44.entities[entity].list('-updated_date', 500) })) });
  const [assets, clips, profiles] = results.map(result => result.data || []);
  const preview = draft.authoring_preview || {};
  const meshAsset = assets.find(asset => asset.asset_id === preview.mesh_asset_id);
  const profile = profiles.find(item => item.profile_id === preview.profile_id);
  const [values, setValues] = useState({});
  useEffect(() => setValues(Object.fromEntries(parameters.map(item => [item.name, item.default_value ?? 0]))), [draft.controller_id, parameters]);
  const runtime = useControllerPreviewMachine(layer, values, playing);
  useEffect(() => onRuntimeChange(runtime), [onRuntimeChange, runtime.activeStateId, runtime.activeTransitionId]);
  const activeState = layer?.states.find(item => item.id === runtime.activeStateId);
  const activeClipId = profile?.state_clips?.find(item => item.packed_state_index === activeState?.packed_state_index)?.clip_asset_id || activeState?.animation_clip_asset_id;
  const tracks = useMemo(() => (profile?.state_clips || []).map(mapping => {
    const clip = clips.find(item => item.asset_id === mapping.clip_asset_id);
    const locator = clip?.locators?.find(item => item.backend_id === 'browser') || clip?.locators?.[0];
    return { id: mapping.clip_asset_id, asset: findLocatorAsset(locator, assets), clipName: String(locator?.asset_ref || '').match(/#anim:([^#]+)$/)?.[1] ? decodeURIComponent(String(locator.asset_ref).match(/#anim:([^#]+)$/)[1]) : '' };
  }).filter(item => item.asset), [assets, clips, profile]);
  const modelOptions = assets.filter(asset => asset.asset_type === 'model').map(asset => ({ value: asset.asset_id, label: asset.name || asset.asset_id }));
  const profileOptions = profiles.filter(item => item.animator_controller_id === draft.controller_id).map(item => ({ value: item.profile_id, label: item.profile_id }));
  return <Section title="运行预览">
    <div className="grid grid-cols-2 gap-2">
      <ReferenceSelect label="Preview Mesh" value={preview.mesh_asset_id || ''} options={modelOptions} onChange={mesh_asset_id => patch({ authoring_preview: { ...preview, mesh_asset_id } })} />
      <ReferenceSelect label="Animation Profile" value={preview.profile_id || ''} options={profileOptions} onChange={profile_id => patch({ authoring_preview: { ...preview, profile_id } })} />
    </div>
    <AnimatedModelPreview meshAsset={meshAsset} tracks={tracks} activeTrackId={activeClipId} height={220} />
    <AnimatorPreviewParameters parameters={parameters} values={values} onChange={(name, value) => setValues(current => ({ ...current, [name]: value }))} />
    <div className="text-[11px] text-gray-500">当前状态：<span className="text-[#dce2e8]">{activeState?.name || '未播放'}</span></div>
  </Section>;
}