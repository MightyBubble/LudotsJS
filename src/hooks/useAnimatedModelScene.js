import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { acquireModelAsset } from '@/lib/playground/modelAssetCache';

export default function useAnimatedModelScene(hostRef, meshAsset, tracks, activeTrackId, onTrackNames) {
  const actionsRef = useRef(new Map());
  const activeRef = useRef(null);
  const onTrackNamesRef = useRef(onTrackNames);
  const [status, setStatus] = useState('loading');
  useEffect(() => { onTrackNamesRef.current = onTrackNames; }, [onTrackNames]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !meshAsset?.uri) return;
    let cancelled = false;
    const releases = [];
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c0f13');
    const camera = new THREE.PerspectiveCamera(42, 1, 0.01, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.replaceChildren(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303845, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.4);
    key.position.set(4, 6, 3);
    scene.add(key, new THREE.GridHelper(10, 20, 0x566070, 0x242a32));
    const clock = new THREE.Clock();
    let mixer;
    let frame;

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 280;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    (async () => {
      try {
        const mesh = await acquireModelAsset({ uri: meshAsset.uri, resourceMap: meshAsset.metadata?.resource_map });
        if (cancelled) return mesh.release();
        releases.push(mesh.release);
        scene.add(mesh.object);
        const box = new THREE.Box3().setFromObject(mesh.object);
        const size = Math.max(...box.getSize(new THREE.Vector3()).toArray(), 1);
        const center = box.getCenter(new THREE.Vector3());
        mesh.object.position.sub(center);
        camera.position.set(size * 0.8, size * 0.55, size * 1.25);
        controls.target.set(0, 0, 0);
        mixer = new THREE.AnimationMixer(mesh.object);
        const actions = new Map();
        for (const track of tracks) {
          let animations = mesh.animations || [];
          if (track.asset?.uri && track.asset.uri !== meshAsset.uri) {
            const source = await acquireModelAsset({ uri: track.asset.uri, resourceMap: track.asset.metadata?.resource_map });
            if (cancelled) { source.release(); break; }
            releases.push(source.release);
            animations = source.animations || [];
          }
          onTrackNamesRef.current?.(track.id, animations.map((clip, index) => clip.name || `clip_${index}`));
          const clip = animations.find(item => item.name === track.clipName) || animations[0];
          if (clip) actions.set(track.id, mixer.clipAction(clip));
        }
        actionsRef.current = actions;
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      mixer?.update(clock.getDelta());
      controls.update();
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    animate();
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      controls.dispose();
      renderer.dispose();
      releases.forEach(release => release());
      actionsRef.current.clear();
      activeRef.current = null;
      host.replaceChildren();
    };
  }, [hostRef, meshAsset, tracks]);

  useEffect(() => {
    const next = actionsRef.current.get(activeTrackId);
    if (!next || next === activeRef.current) return;
    next.reset().fadeIn(0.18).play();
    activeRef.current?.fadeOut(0.18);
    activeRef.current = next;
  }, [activeTrackId, status]);

  return status;
}