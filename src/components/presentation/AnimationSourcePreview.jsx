import { useEffect, useState } from 'react';
import ModelPreview from '@/components/asset/ModelPreview';
import ReferenceSelect from './ReferenceSelect';

export default function AnimationSourcePreview({ asset, clipName, onClipChange }) {
  const [clips, setClips] = useState([]);
  useEffect(() => setClips([]), [asset?.asset_id]);
  const receiveClips = next => {
    setClips(next);
    if (next.length && !next.includes(clipName)) onClipChange(next[0]);
  };
  if (!asset?.uri) return <p className="text-xs text-gray-500">所选资源没有可预览地址。</p>;
  return <div className="space-y-3">
    {clips.length > 0 && <ReferenceSelect label="Animation Clip" value={clipName} options={clips.map(name => ({ value: name, label: name }))} onChange={onClipChange} />}
    <ModelPreview uri={asset.uri} resourceMap={asset.metadata?.resource_map} selectedClip={clipName} onClipsChange={receiveClips} />
  </div>;
}