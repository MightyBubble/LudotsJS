import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';
import { getSourceFileName } from '@/lib/assets/sourceFileName';
import AnimationLocatorRow from './AnimationLocatorRow';
import { isAnimationSource } from './animationAssetOptions';

export default function AnimationLocatorList({ rows = [], assets, previewMesh, onChange }) {
  const animationAssets = assets.filter(isAnimationSource);
  const options = animationAssets.map(asset => ({ value: asset.asset_id, label: `${getSourceFileName(asset)} · ${asset.asset_type}` }));
  const patch = (index, row) => onChange(rows.map((item, i) => i === index ? row : item));
  return <Section title="Animation Host Bindings" right={<Button size="sm" onClick={() => onChange([...rows, { backend_id: 'browser', asset_ref: '', variant: '' }])} className="h-7 bg-[#242a32]"><Plus className="h-3.5 w-3.5" />Binding</Button>}>
    <p className="text-xs text-gray-500">每条 Binding 对应 animation_clips.json 的一个 Locator；仅显示 Animation、FBX、GLTF、GLB 资源。</p>
    {rows.length === 0 && <div className="border border-dashed border-[#424a55] p-4 text-center text-xs text-gray-500">尚未绑定动画资源</div>}
    {rows.map((row, index) => <AnimationLocatorRow key={`${row.backend_id}-${index}`} locator={row} assets={animationAssets} assetOptions={options} previewMesh={previewMesh} onChange={next => patch(index, next)} onRemove={() => onChange(rows.filter((_, i) => i !== index))} />)}
  </Section>;
}