import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, SelectField } from '@/components/ludots/ui';
import ReferenceSelect from './ReferenceSelect';
import AnimationSourcePreview from './AnimationSourcePreview';
import { clipNameFromRef, findLocatorAsset, sourceBaseForBackend, withClipName } from './animationAssetOptions';

const BACKENDS = ['browser', 'raylib', 'ue5'].map(value => ({ value, label: value }));

export default function AnimationLocatorRow({ locator, assets, assetOptions, onChange, onRemove }) {
  const linked = findLocatorAsset(locator, assets);
  const clipName = clipNameFromRef(locator.asset_ref);
  const selectAsset = assetId => {
    const asset = assets.find(item => item.asset_id === assetId);
    onChange({ ...locator, asset_ref: sourceBaseForBackend(asset, locator.backend_id || 'browser') });
  };
  const selectBackend = backend_id => onChange({ ...locator, backend_id, asset_ref: withClipName(sourceBaseForBackend(linked, backend_id), clipName) });
  return <div className="space-y-3 border border-[#2A2E37] bg-[#0D0F14] p-3">
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[160px_minmax(260px,1fr)_auto] lg:items-end">
      <SelectField label="Backend" value={locator.backend_id} options={BACKENDS} onChange={selectBackend} />
      <ReferenceSelect label="Animation Source" value={linked?.asset_id || ''} options={assetOptions} onChange={selectAsset} />
      <Button size="sm" variant="ghost" onClick={onRemove} className="h-8 text-red-400"><Trash2 className="h-3.5 w-3.5" />删除</Button>
    </div>
    <Field label="Generated Asset Ref"><div className="min-h-8 break-all border border-[#2A2E37] bg-[#15171C] px-3 py-2 font-mono text-[11px] text-gray-300">{locator.asset_ref || '选择动画资源后自动生成'}</div></Field>
    {linked && <AnimationSourcePreview asset={linked} clipName={clipName} onClipChange={name => onChange({ ...locator, asset_ref: withClipName(sourceBaseForBackend(linked, locator.backend_id), name) })} />}
  </div>;
}