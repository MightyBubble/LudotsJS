import { BatchedRenderer, QuarksLoader, QuarksUtil } from 'three.quarks';

const scripts = new Map();
const loadScript = (uri) => {
  if (scripts.has(uri)) return scripts.get(uri);
  const pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = uri; script.onload = resolve; script.onerror = reject;
    document.head.appendChild(script);
  });
  scripts.set(uri, pending);
  return pending;
};

export function createVfxRuntime(scene, renderer, camera) {
  const batch = new BatchedRenderer();
  scene.add(batch);
  const loaded = new Map();
  let effekseerReady = false;
  const load = async (asset) => {
    if (asset.backend === 'quarks') return new QuarksLoader().loadAsync(asset.source_uris[0]);
    if (loaded.has(asset.asset_id)) return loaded.get(asset.asset_id);
    await loadScript(asset.runtime?.script_uri);
    if (!effekseerReady) {
      await new Promise((resolve, reject) => window.effekseer.initRuntime(asset.runtime?.wasm_uri, resolve, reject));
      window.effekseer.init(renderer.getContext()); effekseerReady = true;
    }
    const effect = window.effekseer.loadEffect(asset.source_uris[0], asset.scale || 1);
    loaded.set(asset.asset_id, effect); return effect;
  };
  return {
    async play(asset, position = { x: 0, y: 0, z: 0 }) {
      const effect = await load(asset);
      if (asset.backend === 'quarks') {
        const instance = effect; scene.add(instance);
        QuarksUtil.addToBatchRenderer(instance, batch); QuarksUtil.setAutoDestroy(instance, true); QuarksUtil.play(instance);
        instance.position.set(position.x, position.y, position.z); return instance;
      }
      return window.effekseer.play(effect, position.x, position.y, position.z);
    },
    update(delta) { batch.update(delta); if (effekseerReady) window.effekseer.update(delta * 60); },
    draw() {
      if (!effekseerReady) return;
      window.effekseer.setProjectionMatrix(camera.projectionMatrix.elements);
      window.effekseer.setCameraMatrix(camera.matrixWorldInverse.elements);
      window.effekseer.draw(); renderer.resetState();
    },
    dispose() { scene.remove(batch); batch.dispose?.(); if (effekseerReady) window.effekseer.stopAll(); loaded.clear(); },
  };
}