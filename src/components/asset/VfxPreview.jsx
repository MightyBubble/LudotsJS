import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Play, RotateCcw } from 'lucide-react';
import { createVfxRuntime } from '@/lib/playground/vfxRuntime';
import { Button } from '@/components/ui/button';

export default function VfxPreview({ asset }) {
  const hostRef = useRef(null);
  const playRef = useRef(null);
  const [status, setStatus] = useState('ready');

  useEffect(() => {
    const host = hostRef.current;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0d0f13);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); camera.position.set(3, 2, 5); camera.lookAt(0, 0.7, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setSize(host.clientWidth, 320); host.appendChild(renderer.domElement);
    scene.add(new THREE.GridHelper(8, 8, 0x475569, 0x1f2937));
    const runtime = createVfxRuntime(scene, renderer, camera);
    const play = async () => { setStatus('loading'); try { await runtime.play(asset, { x: 0, y: 0.5, z: 0 }); setStatus('playing'); } catch { setStatus('error'); } };
    playRef.current = play;
    const clock = new THREE.Clock(); let raf;
    const tick = () => { raf = requestAnimationFrame(tick); runtime.update(clock.getDelta()); renderer.render(scene, camera); runtime.draw(); };
    camera.aspect = host.clientWidth / 320; camera.updateProjectionMatrix(); tick(); play();
    return () => { cancelAnimationFrame(raf); playRef.current = null; runtime.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, [asset]);

  return <div className="space-y-2">
    <div className="flex items-center justify-between"><span className="rounded border border-[#424A55] bg-[#242A32] px-2 py-1 text-[11px] text-gray-300">后端：{asset.backend === 'quarks' ? 'Quarks' : 'Effekseer'}</span>
      <Button size="sm" onClick={() => playRef.current?.()} disabled={status === 'loading'} className="h-7 gap-1 bg-[#1E2128]"><RotateCcw className="h-3 w-3" />重新播放</Button></div>
    <div ref={hostRef} data-testid="vfx-preview" className="overflow-hidden rounded border border-[#2A2E37]" />
    {status === 'loading' && <p className="text-[11px] text-gray-500"><Play className="mr-1 inline h-3 w-3" />正在加载特效…</p>}
    {status === 'error' && <p className="text-[11px] text-red-400">特效加载失败，请检查源文件与运行时资源。</p>}
  </div>;
}