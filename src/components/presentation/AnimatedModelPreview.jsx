import { useRef } from 'react';
import useAnimatedModelScene from '@/hooks/useAnimatedModelScene';

export default function AnimatedModelPreview({ meshAsset, tracks, activeTrackId, onTrackNames, height = 260 }) {
  const hostRef = useRef(null);
  const status = useAnimatedModelScene(hostRef, meshAsset, tracks, activeTrackId, onTrackNames);
  if (!meshAsset) return <div className="flex h-40 items-center justify-center border border-dashed border-[#424a55] text-xs text-gray-500">请选择预览 Mesh</div>;
  return <div data-active-track={activeTrackId || ''} className="relative overflow-hidden rounded border border-[#424a55] bg-[#0D0F14]" style={{ height }}>
    <div ref={hostRef} data-testid="animated-model-preview" className="h-full w-full" />
    <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-[#0D0F14]/80 px-2 py-1 text-[10px] text-gray-400">
      {status === 'loading' ? '正在加载动画…' : status === 'error' ? '动画预览加载失败' : '拖动旋转 · 滚轮缩放'}
    </div>
  </div>;
}