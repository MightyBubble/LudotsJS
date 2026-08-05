import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { acquireModelAsset } from '@/lib/playground/modelAssetCache';
import { createVfxRuntime } from '@/lib/playground/vfxRuntime';

const vector = (value, fallback) => Array.isArray(value) ? value : fallback;

export default function usePerformerPreviewScene(containerRef, root, performers, bindings, assets, effects, selectedPerformerId, targetSlot, mode, onTransform) {
  const releases = useRef([]);
  const [status, setStatus] = useState('准备预览');

  useEffect(() => {
    const host = containerRef.current;
    if (!host || !root) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c0f13');
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    camera.position.set(4, 3, 6);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    host.replaceChildren(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    const transform = new TransformControls(camera, renderer.domElement);
    transform.setMode(mode);
    transform.addEventListener('dragging-changed', event => { controls.enabled = !event.value; });
    scene.add(transform.getHelper());
    scene.add(new THREE.HemisphereLight(0xffffff, 0x303845, 2.2));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(4, 6, 3);
    scene.add(key, new THREE.GridHelper(12, 24, 0x566070, 0x242a32));
    const content = new THREE.Group();
    scene.add(content);
    const vfx = createVfxRuntime(scene);
    const byId = new Map(performers.map(item => [item.performer_id, item]));
    byId.set(root.performer_id, root);
    const assetById = new Map(assets.map(item => [item.asset_id, item]));
    const effectById = new Map(effects.map(item => [item.asset_id, item]));
    const appearanceByAsset = new Map(bindings.map(binding => {
      const editorAsset = assetById.get(binding.editor_asset_id);
      return [binding.asset_id, { uri: binding.source_uris?.[0] || editorAsset?.uri, resourceMap: editorAsset?.metadata?.resource_map || {} }];
    }));
    let cancelled = false;

    const addDefinition = async (definition, parent, visited = new Set()) => {
      if (!definition || visited.has(definition.performer_id)) return;
      const nextVisited = new Set(visited).add(definition.performer_id);
      const group = new THREE.Group();
      group.name = definition.performer_id;
      parent.add(group);
      for (const behavior of definition.behaviors || []) {
        if (behavior.kind !== 'AssetBinding' || behavior.activeByDefault === false) continue;
        const asset = behavior.assetBinding || {};
        let object;
        if (asset.assetKind === 'Vfx') {
          const effect = effectById.get(asset.assetId);
          if (!effect) continue;
          object = await vfx.play(effect);
        } else {
          const appearance = appearanceByAsset.get(asset.assetId);
          if (!appearance?.uri) continue;
          const acquired = await acquireModelAsset(appearance);
          if (cancelled) { acquired.release(); continue; }
          releases.current.push(acquired.release);
          object = acquired.object;
        }
        object.position.fromArray(vector(asset.localOffset, [0, 0, 0]));
        object.rotation.set(...vector(asset.localRotation, [0, 0, 0]).map(THREE.MathUtils.degToRad));
        object.scale.fromArray(vector(asset.localScale, [1, 1, 1]));
        group.add(object);
        if (definition.performer_id === selectedPerformerId && behavior.slot === targetSlot) transform.attach(object);
      }
      await Promise.all((definition.children || []).map(child => addDefinition(byId.get(child.definition_id), group, nextVisited)));
    };

    let frame = 0;
    const clock = new THREE.Clock();
    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const animate = () => { frame = requestAnimationFrame(animate); controls.update(); vfx.update(clock.getDelta()); renderer.render(scene, camera); };
    const commitTransform = () => {
      const object = transform.object;
      if (!object) return;
      onTransform({
        localOffset: object.position.toArray(),
        localRotation: [object.rotation.x, object.rotation.y, object.rotation.z].map(THREE.MathUtils.radToDeg),
        localScale: object.scale.toArray(),
      });
    };
    transform.addEventListener('mouseUp', commitTransform);
    resize();
    addDefinition(root, content).then(() => {
      if (cancelled) return;
      const box = new THREE.Box3().setFromObject(content);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = Math.max(...box.getSize(new THREE.Vector3()).toArray(), 1);
        controls.target.copy(center);
        camera.position.copy(center).add(new THREE.Vector3(size * 1.2, size * 0.8, size * 1.5));
      }
      setStatus('拖动旋转 · 滚轮缩放');
    });
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    animate();
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      transform.removeEventListener('mouseUp', commitTransform);
      transform.detach();
      transform.dispose();
      vfx.dispose();
      controls.dispose();
      renderer.dispose();
      releases.current.splice(0).forEach(release => release());
      host.replaceChildren();
    };
  }, [containerRef, root, performers, bindings, assets, effects, selectedPerformerId, targetSlot, mode, onTransform]);

  return status;
}