import { useCallback, useEffect, useMemo, useState } from 'react';
import ReferenceSelect from './ReferenceSelect';
import AnimatedModelPreview from './AnimatedModelPreview';

export default function AnimationSourcePreview({ asset, previewMesh, clipName, onClipChange }) {
  const [clips, setClips] = useState([]);
  useEffect(() => setClips([]), [asset?.asset_id]);
  const tracks = useMemo(() => [{ id: 'binding-preview', asset, clipName }], [asset, clipName]);
  const receiveClips = useCallback((_id, next) => {
    setClips(next);
    if (next.length && !next.includes(clipName)) onClipChange(next[0]);
  }, [clipName, onClipChange]);
  if (!asset?.uri) return <p className="text-xs text-gray-500">所选资源没有可预览地址。</p>;
  return <div className="space-y-3">
    {clips.length > 0 && <ReferenceSelect label="Animation Clip" value={clipName} options={clips.map(name => ({ value: name, label: name }))} onChange={onClipChange} />}
    <AnimatedModelPreview meshAsset={previewMesh} tracks={tracks} activeTrackId="binding-preview" onTrackNames={receiveClips} height={320} />
  </div>;
}