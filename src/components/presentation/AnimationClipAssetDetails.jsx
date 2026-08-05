import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section, TextField, SelectField } from '@/components/ludots/ui';
import AnimationLocatorList from './AnimationLocatorList';

const CLIP_KINDS = ['Clip', 'BlendTree', 'Montage', 'PoseAsset'].map(value => ({ value, label: value }));
const BLEND_INPUTS = ['Zero', 'Scalar0', 'Scalar1', 'NormalizedTime', 'Weight01'].map(value => ({ value, label: value }));

export default function AnimationClipAssetDetails({ draft, patch }) {
  const { data: assets = [] } = useQuery({ queryKey: ['assets'], queryFn: () => base44.entities.Asset.list('-updated_date', 500) });
  const blendInputs = draft.blend_inputs && !Array.isArray(draft.blend_inputs) ? draft.blend_inputs : { x: 'Scalar0', y: 'Scalar1' };
  return <div className="flex max-w-5xl flex-col gap-3">
    <Section title="animation_clips.json">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_180px]">
        <TextField label="Clip ID" value={draft.asset_id} onChange={asset_id => patch({ asset_id })} />
        <SelectField label="Asset Kind" value={draft.asset_kind || 'Clip'} options={CLIP_KINDS} onChange={asset_kind => patch({ asset_kind })} />
      </div>
      {(draft.asset_kind === 'BlendTree' || draft.asset_kind === 'PoseAsset') && <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SelectField label="Blend Input X" value={blendInputs.x} options={BLEND_INPUTS} onChange={x => patch({ blend_inputs: { ...blendInputs, x } })} />
        <SelectField label="Blend Input Y" value={blendInputs.y} options={BLEND_INPUTS} onChange={y => patch({ blend_inputs: { ...blendInputs, y } })} />
      </div>}
    </Section>
    <AnimationLocatorList rows={draft.locators || []} assets={assets} onChange={locators => patch({ locators })} />
  </div>;
}