import * as THREE from 'three';
import { normalizeModelMaterials } from '@/lib/playground/normalizeModelMaterials';

const entries = new Map();
const queue = [];
const maxIdleEntries = 24;
const maxConcurrentLoads = 3;
let activeLoads = 0;

const disposeSource = (scene) => scene?.traverse(child => {
  child.geometry?.dispose();
  (Array.isArray(child.material) ? child.material : child.material ? [child.material] : []).forEach(material => {
    Object.values(material).forEach(value => value?.isTexture && value.dispose());
    material.dispose();
  });
});

const evictIdle = () => {
  const idle = [...entries.entries()].filter(([, entry]) => entry.refs === 0 && entry.scene).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
  while (entries.size > maxIdleEntries && idle.length) {
    const [uri, entry] = idle.shift();
    entries.delete(uri);
    disposeSource(entry.scene);
  }
};

const drain = () => {
  while (activeLoads < maxConcurrentLoads && queue.length) {
    activeLoads += 1;
    queue.shift()().finally(() => { activeLoads -= 1; drain(); });
  }
};

const scheduleLoad = (appearance, entry, cacheKey) => new Promise((resolve, reject) => {
  queue.push(async () => {
    try {
      const manager = new THREE.LoadingManager();
      manager.setURLModifier(url => Object.entries(appearance.resourceMap || {}).find(([path]) => decodeURI(url).endsWith(path))?.[1] || url);
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const loaded = await new GLTFLoader(manager).loadAsync(appearance.uri);
      entry.scene = normalizeModelMaterials(loaded.scene);
      entry.animations = loaded.animations || [];
      resolve(entry);
    } catch (error) {
      entries.delete(cacheKey);
      reject(error);
    }
  });
  drain();
});

export async function acquireModelAsset(appearance) {
  const cacheKey = `${appearance.uri}|${JSON.stringify(appearance.resourceMap || {})}`;
  let entry = entries.get(cacheKey);
  if (!entry) {
    entry = { refs: 0, scene: null, animations: [], lastUsed: Date.now() };
    entry.promise = scheduleLoad(appearance, entry, cacheKey);
    entries.set(cacheKey, entry);
  }
  await entry.promise;
  entry.refs += 1;
  entry.lastUsed = Date.now();
  let released = false;
  return {
    object: entry.scene.clone(true),
    animations: entry.animations,
    release: () => {
      if (released) return;
      released = true;
      entry.refs = Math.max(0, entry.refs - 1);
      entry.lastUsed = Date.now();
      evictIdle();
    }
  };
}

export const getModelCacheStats = () => ({ entries: entries.size, activeLoads, queuedLoads: queue.length, referenced: [...entries.values()].filter(entry => entry.refs > 0).length });