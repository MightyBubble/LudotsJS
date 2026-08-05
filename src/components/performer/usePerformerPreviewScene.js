import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { acquireModelAsset } from '@/lib/playground/modelAssetCache';
import { createVfxRuntime } from '@/lib/playground/vfxRuntime';
import { readInstanceOverrides } from '@/lib/runtime/performerOverrides';
import { resolvePerformerChildren } from '@/lib/runtime/performerComposition';
import { clipNameFromRef, findLocatorAsset } from '@/components/presentation/animationAssetOptions';

const vector = (value, fallback) => Array.isArray(value) ? value : fallback;

export default function usePerformerPreviewScene(containerRef, root, performers, bindings, assets, effects, controllers, profiles, clips, activeStateIndex, selectedInstancePath, mode, onSelectPath, onTransform) {
  const releases = useRef([]);
  const cameraState = useRef(null);
  const animationRef = useRef({ players: [] });
  const activeStateRef = useRef(activeStateIndex);
  const transformRef = useRef(null);
  const onSelectPathRef = useRef(onSelectPath);
  const onTransformRef = useRef(onTransform);
  const [status, setStatus] = useState('准备预览');
  useEffect(() => { onSelectPathRef.current = onSelectPath; }, [onSelectPath]);
  useEffect(() => { onTransformRef.current = onTransform; }, [onTransform]);
  useEffect(() => { transformRef.current?.setMode(mode); }, [mode]);
  useEffect(() => {
    activeStateRef.current = activeStateIndex;
    let switched = 0;
    animationRef.current.players.forEach(player => {
      const next = player.actions.get(activeStateIndex);
      if (!next || next === player.active) return;
      next.reset().fadeIn(0.18).play();
      player.active?.fadeOut(0.18);
      player.active = next;
      switched += 1;
    });
    if (switched) setStatus(`动画状态 ${activeStateIndex} · ${switched} 个 Animator`);
  }, [activeStateIndex]);

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
    if (cameraState.current) {
      camera.position.fromArray(cameraState.current.position);
      controls.target.fromArray(cameraState.current.target);
    }
    let transforming = false;
    const transform = new TransformControls(camera, renderer.domElement);
    transformRef.current = transform;
    transform.setMode(mode);
    const handleDraggingChanged = event => { controls.enabled = !event.value; transforming = event.value; };
    transform.addEventListener('dragging-changed', handleDraggingChanged);
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
    const controllerById = new Map(controllers.map(item => [item.controller_id, item]));
    const profileById = new Map(profiles.map(item => [item.profile_id, item]));
    const clipById = new Map(clips.map(item => [item.asset_id, item]));
    const mixers = [];
    const appearanceByAsset = new Map(bindings.map(binding => {
      const editorAsset = assetById.get(binding.editor_asset_id);
      return [binding.asset_id, { uri: binding.source_uris?.[0] || editorAsset?.uri, resourceMap: editorAsset?.metadata?.resource_map || {} }];
    }));
    let cancelled = false;

    let selectedGroup = null;
    let selectionBox = null;
    const nodeGroups = [];
    const addDefinition = async (definition, parent, path = 'root', visited = new Set(), instance = {}) => {
      if (!definition || visited.has(definition.performer_id)) return;
      const nextVisited = new Set(visited).add(definition.performer_id);
      const instanceGroup = new THREE.Group();
      const instanceTransform = readInstanceOverrides(instance).transform;
      instanceGroup.name = path;
      instanceGroup.position.fromArray(instanceTransform.local_position);
      instanceGroup.rotation.set(...instanceTransform.local_rotation.map(THREE.MathUtils.degToRad));
      instanceGroup.scale.fromArray(instanceTransform.local_scale);
      parent.add(instanceGroup);
      const group = new THREE.Group();
      const rootTransform = definition.transform || {};
      group.name = `${path}:root`;
      group.position.fromArray(vector(rootTransform.local_position, [0, 0, 0]));
      group.rotation.set(...vector(rootTransform.local_rotation, [0, 0, 0]).map(THREE.MathUtils.degToRad));
      group.scale.fromArray(vector(rootTransform.local_scale, [1, 1, 1]));
      instanceGroup.add(group);
      nodeGroups.push({ path, group: instanceGroup });
      if (path === selectedInstancePath) selectedGroup = path === 'root' ? group : instanceGroup;
      let primaryModel = null;
      const behaviors = [...(definition.behaviors || []), ...(instance.runtime_behaviors || [])];
      for (const behavior of behaviors) {
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
          if (!primaryModel) primaryModel = { object, animations: acquired.animations || [], appearance };
        }
        object.position.fromArray(vector(asset.localOffset, [0, 0, 0]));
        object.rotation.set(...vector(asset.localRotation, [0, 0, 0]).map(THREE.MathUtils.degToRad));
        object.scale.fromArray(vector(asset.localScale, [1, 1, 1]));
        group.add(object);
      }
      const animator = behaviors.find(behavior => behavior.kind === 'Animator' && behavior.activeByDefault !== false)?.animator;
      if (animator && primaryModel) {
        const controller = controllerById.get(animator.animatorControllerId);
        const profile = profileById.get(animator.animationProfileId);
        const mixer = new THREE.AnimationMixer(primaryModel.object);
        mixers.push(mixer);
        const actions = new Map();
        for (const mapping of profile?.state_clips || []) {
          const clipDefinition = clipById.get(mapping.clip_asset_id);
          const locator = clipDefinition?.locators?.find(item => item.backend_id === 'browser') || clipDefinition?.locators?.[0];
          const sourceAsset = findLocatorAsset(locator, assets);
          let animations = primaryModel.animations;
          if (sourceAsset?.uri && sourceAsset.uri !== primaryModel.appearance.uri) {
            const source = await acquireModelAsset({ uri: sourceAsset.uri, resourceMap: sourceAsset.metadata?.resource_map });
            if (cancelled) { source.release(); continue; }
            releases.current.push(source.release);
            animations = source.animations || [];
          }
          const clipName = clipNameFromRef(locator?.asset_ref);
          const clip = animations.find(item => item.name === clipName) || animations[0];
          if (clip) actions.set(mapping.packed_state_index, mixer.clipAction(clip));
        }
        const player = { actions, active: null, controller, path };
        animationRef.current.players.push(player);
        const initial = actions.get(activeStateRef.current) || actions.values().next().value;
        if (initial) { initial.play(); player.active = initial; }
      }
      await Promise.all(resolvePerformerChildren(definition, instance).map((child, index) => addDefinition(byId.get(child.definition_id), group, `${path}/${index}`, nextVisited, child)));
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
    const animate = () => { frame = requestAnimationFrame(animate); const delta = clock.getDelta(); controls.update(); selectionBox?.update(); mixers.forEach(mixer => mixer.update(delta)); vfx.update(delta); renderer.render(scene, camera); };
    const commitTransform = () => {
      const object = transform.object;
      if (!object) return;
      const rotation = [object.rotation.x, object.rotation.y, object.rotation.z].map(THREE.MathUtils.radToDeg);
      onTransformRef.current?.({
        local_position: object.position.toArray(), local_rotation: rotation, local_scale: object.scale.toArray(),
      });
    };
    transform.addEventListener('mouseUp', commitTransform);
    const raycaster = new THREE.Raycaster();
    const pointerStart = new THREE.Vector2();
    const pointerDown = event => pointerStart.set(event.clientX, event.clientY);
    const pointerUp = event => {
      if (transforming || Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 4) return;
      const rect = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1), camera);
      const point = new THREE.Vector3();
      const hits = nodeGroups.map(item => {
        const box = new THREE.Box3().setFromObject(item.group);
        if (box.isEmpty()) box.setFromCenterAndSize(item.group.getWorldPosition(new THREE.Vector3()), new THREE.Vector3(1, 1, 1));
        return { ...item, point: raycaster.ray.intersectBox(box, point.clone()) };
      }).filter(item => item.point).sort((a, b) => b.path.split('/').length - a.path.split('/').length || a.point.distanceTo(camera.position) - b.point.distanceTo(camera.position));
      if (hits[0]) onSelectPathRef.current?.(hits[0].path);
    };
    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointerup', pointerUp);
    resize();
    addDefinition(root, content).then(() => {
      if (cancelled) return;
      if (selectedGroup) {
        if (selectedInstancePath !== 'root') {
          selectionBox = new THREE.BoxHelper(selectedGroup, 0xcbd3dc);
          scene.add(selectionBox);
        }
        transform.attach(selectedGroup);
      }
      const box = new THREE.Box3().setFromObject(content);
      if (!cameraState.current && !box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const size = Math.max(...box.getSize(new THREE.Vector3()).toArray(), 1);
        controls.target.copy(center);
        camera.position.copy(center).add(new THREE.Vector3(size * 1.2, size * 0.8, size * 1.5));
      }
      const animatorCount = animationRef.current.players.length;
      setStatus(`${animatorCount ? `${animatorCount} 个 Animator · ` : ''}点击包围盒选择 · 拖动旋转 · 滚轮缩放`);
    });
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    animate();
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      cameraState.current = { position: camera.position.toArray(), target: controls.target.toArray() };
      transform.removeEventListener('mouseUp', commitTransform);
      transform.removeEventListener('dragging-changed', handleDraggingChanged);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      transform.detach();
      transform.dispose();
      transformRef.current = null;
      mixers.forEach(mixer => {
        mixer.stopAllAction();
        mixer.uncacheRoot(mixer.getRoot());
      });
      selectionBox?.geometry.dispose();
      selectionBox?.material.dispose();
      vfx.dispose();
      controls.dispose();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      releases.current.splice(0).forEach(release => release());
      animationRef.current = { players: [] };
      host.replaceChildren();
    };
  }, [containerRef, root, performers, bindings, assets, effects, controllers, profiles, clips, selectedInstancePath]);

  return status;
}