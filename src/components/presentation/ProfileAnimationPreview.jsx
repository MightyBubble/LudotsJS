import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';
import AnimatedModelPreview from './AnimatedModelPreview';
import { clipNameFromRef, findLocatorAsset } from './animationAssetOptions';

export default function ProfileAnimationPreview({ draft, patch, controller }) {
  const results = useQueries({ queries: ['Asset', 'AnimationClipAsset'].map(entity => ({ queryKey: ['profile-preview', entity], queryFn: () => base44.entities[entity].list('-updated_date', 500) })) });
  const [assets, clips] = results.map(result => result.data || []);
  const [activeIndex, setActiveIndex] = useState(draft.state_clips?.[0]?.packed_state_index ?? 0);
  useEffect(() => setActiveIndex(draft.state_clips?.[0]?.packed_state_index ?? 0), [draft.profile_id]);
  const states = useMemo(() => (draft.state_clips || []).map(mapping => {
    const state = (controller?.authoring_layers || []).flatMap(layer => layer.states || []).find(item => item.packed_state_index === mapping.packed_state_index);
    return { ...mapping, name: state?.name || `State ${mapping.packed_state_index}` };
  }), [controller, draft.state_clips]);
  const tracks = useMemo(() => states.map(state => {
    const clip = clips.find(item => item.asset_id === state.clip_asset_id);
    const locator = clip?.locators?.find(item => item.backend_id === 'browser') || clip?.locators?.[0];
    return { id: state.clip_asset_id, asset: findLocatorAsset(locator, assets), clipName: clipNameFromRef(locator?.asset_ref) };
  }).filter(track => track.asset), [assets, clips, states]);
  const meshAsset = assets.find(asset => asset.asset_id === draft.preview_mesh_asset_id);
  const modelOptions = assets.filter(asset => asset.asset_type === 'model').map(asset => ({ value: asset.asset_id, label: asset.name || asset.asset_id }));
  const activeClip = states.find(state => state.packed_state_index === activeIndex)?.clip_asset_id;
  return <Section title="Animator Preview">
    <ReferenceSelect label="Preview Mesh" value={draft.preview_mesh_asset_id || ''} options={modelOptions} onChange={preview_mesh_asset_id => patch({ preview_mesh_asset_id })} hint="仅用于编辑器预览，不导出到 animation_profiles.json" />
    <div className="grid gap-3 lg:grid-cols-[190px_minmax(0,1fr)]">
      <div className="border border-[#424a55] bg-[#0D0F14] p-2"><div className="mb-2 text-[10px] font-semibold uppercase text-gray-500">States</div>{states.map(state => <button key={state.packed_state_index} type="button" onClick={() => setActiveIndex(state.packed_state_index)} className={`mb-1 w-full border px-2 py-2 text-left text-xs ${activeIndex === state.packed_state_index ? 'border-emerald-400 bg-emerald-950 text-emerald-200' : 'border-[#2A2E37] bg-[#171b21] text-gray-300'}`}>{state.name}<span className="block truncate text-[10px] text-gray-500">{state.clip_asset_id}</span></button>)}</div>
      <AnimatedModelPreview meshAsset={meshAsset} tracks={tracks} activeTrackId={activeClip} height={320} />
    </div>
  </Section>;
}