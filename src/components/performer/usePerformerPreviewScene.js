import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { acquireModelAsset } from '@/lib/playground/modelAssetCache';

const vector = (value, fallback) => Array.isArray(value) ? value : fallback;

export default function usePerformerPreviewScene(containerRef, root, performers, bindings, targetSlot, mode, onTransform) {
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
    const byId = new Map(performers.map(item => [item.performer_id, item]));
    byId.set(root.performer_id, root);
    const uriByAsset = new Map(bindings.map(item => [item.asset_id, item.source_uris?.[0]]));
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
        const uri = uriByAsset.get(asset.assetId);
        if (!uri || asset.assetKind === 'Vfx') continue;
        const acquired = await acquireModelAsset({ uri });
        if (cancelled) { acquired.release(); continue; }
        releases.current.push(acquired.release);
        const object = acquired.object;
        object.position.fromArray(vector(asset.localOffset, [0, 0, 0]));
        object.rotation.set(...vector(asset.localRotation, [0, 0, 0]).map(THREE.MathUtils.degToRad));
        object.scale.fromArray(vector(asset.localScale, [1, 1, 1]));
        group.add(object);
        if (definition.performer_id === root.performer_id && behavior.slot === targetSlot) transform.attach(object);
      }
      await Promise.all((definition.children || []).map(child => addDefinition(byId.get(child.definition_id), group, nextVisited)));
    };

    let frame = 0;
    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const animate = () => { frame = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); };
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
      controls.dispose();
      renderer.dispose();
      releases.current.splice(0).forEach(release => release());
      host.replaceChildren();
    };
  }, [containerRef, root, performers, bindings, targetSlot, mode, onTransform]);

  return status;
}