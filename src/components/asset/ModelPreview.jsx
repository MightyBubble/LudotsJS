import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { acquireModelAsset } from '@/lib/playground/modelAssetCache';

/** FBX / GLTF / GLB 模型预览，带动画剪辑播放。 */
export default function ModelPreview({ uri, resourceMap }) {
  const hostRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [clips, setClips] = useState([]);
  const controlRef = useRef({});

  useEffect(() => {
    if (!uri) return;
    let disposed = false;
    const host = hostRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0f13);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(host.clientWidth, 320);
    host.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2));
    scene.add(new THREE.GridHelper(10, 10, 0x334155, 0x1f2937));
    let mixer = null;
    let releaseModel = null;
    const clock = new THREE.Clock();

    const fit = (object) => {
      const box = new THREE.Box3().setFromObject(object);
      const size = box.getSize(new THREE.Vector3()).length() || 1;
      const center = box.getCenter(new THREE.Vector3());
      object.position.sub(center);
      camera.position.set(size * 0.6, size * 0.5, size * 0.9);
      camera.lookAt(0, 0, 0);
      camera.near = size / 100; camera.far = size * 20; camera.updateProjectionMatrix();
    };

    (async () => {
      const ext = (uri.split('?')[0].split('.').pop() || '').toLowerCase();
      try {
        let object, animations;
        if (ext === 'fbx') {
          const loader = new (await import('three/examples/jsm/loaders/FBXLoader.js')).FBXLoader();
          object = await loader.loadAsync(uri); animations = object.animations || [];
        } else {
          const acquired = await acquireModelAsset({ uri, resourceMap });
          if (disposed) { acquired.release(); return; }
          object = acquired.object; animations = acquired.animations; releaseModel = acquired.release;
        }
        if (disposed) return;
        scene.add(object); fit(object);
        setClips(animations.map((a, i) => a.name || `clip_${i}`));
        if (animations.length) {
          mixer = new THREE.AnimationMixer(object); mixer.clipAction(animations[0]).play();
          controlRef.current.play = (index) => { mixer.stopAllAction(); mixer.clipAction(animations[index]).play(); };
        }
        setStatus('ready');
      } catch { if (!disposed) setStatus('error'); }
    })();

    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (mixer) mixer.update(clock.getDelta());
      scene.rotation.y += 0.002;
      renderer.render(scene, camera);
    };
    camera.aspect = host.clientWidth / 320; camera.updateProjectionMatrix();
    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      releaseModel?.();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, [uri, resourceMap]);

  if (!uri) return null;
  return <div className="space-y-2">
    <div ref={hostRef} data-testid="model-preview" className="rounded border border-[#2A2E37] overflow-hidden" />
    {status === 'loading' && <p className="text-[11px] text-gray-500">正在加载模型…</p>}
    {status === 'error' && <p className="text-[11px] text-red-400">模型加载失败，请确认地址可访问且为 FBX / GLTF / GLB。</p>}
    {clips.length > 0 && <div className="flex flex-wrap gap-2">
      {clips.map((name, i) => <button key={name + i} onClick={() => controlRef.current.play?.(i)}
        className="px-2 py-1 rounded border border-[#2A2E37] bg-[#1E2128] text-[11px] text-gray-300">{name}</button>)}
    </div>}
  </div>;
}