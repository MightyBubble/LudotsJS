import { BatchedRenderer, QuarksLoader, QuarksUtil } from 'three.quarks';

const scripts = new Map();
const effekseerRuntimes = new Map();

const linkQuarksSubEmitters = (root) => {
  const emitters = new Map();
  root.traverse((child) => {
    if (child.system) emitters.set(child.uuid, child);
  });
  root.traverse((child) => {
    for (const behavior of child.system?.behaviors || []) {
      if (behavior.type !== 'EmitSubParticleSystem') continue;
      const reference = behavior.subParticleSystem;
      const emitter = typeof reference === 'string'
        ? emitters.get(reference)
        : reference?.system ? reference : emitters.get(reference?.uuid);
      behavior.subParticleSystem = emitter?.system ? emitter : undefined;
    }
  });
  return root;
};

const loadScript = (uri) => {
  if (!uri) return Promise.reject(new Error('缺少 Effekseer 运行时脚本地址'));
  if (scripts.has(uri)) return scripts.get(uri);
  const pending = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = uri; script.onload = resolve; script.onerror = () => reject(new Error(`Effekseer 脚本加载失败：${uri}`));
    document.head.appendChild(script);
  });
  scripts.set(uri, pending);
  return pending;
};

const initializeEffekseer = async (runtime) => {
  await loadScript(runtime?.script_uri);
  if (!window.effekseer) throw new Error('Effekseer 运行时未注册');
  const wasmUri = runtime?.wasm_uri;
  if (!wasmUri) throw new Error('缺少 Effekseer WASM 地址');
  if (!effekseerRuntimes.has(wasmUri)) {
    effekseerRuntimes.set(wasmUri, new Promise((resolve, reject) => {
      window.effekseer.initRuntime(wasmUri, resolve, () => reject(new Error(`Effekseer WASM 初始化失败：${wasmUri}`)));
    }));
  }
  await effekseerRuntimes.get(wasmUri);
};

export function createVfxRuntime(scene, renderer, camera) {
  const batch = new BatchedRenderer();
  scene.add(batch);
  const loaded = new Map();
  let effekseerContext = null;
  const load = async (asset) => {
    if (asset.backend === 'quarks') {
      const effect = await new QuarksLoader().loadAsync(asset.source_uris[0]);
      return linkQuarksSubEmitters(effect);
    }
    if (loaded.has(asset.asset_id)) return loaded.get(asset.asset_id);
    await initializeEffekseer(asset.runtime);
    if (!effekseerContext) {
      effekseerContext = window.effekseer.createContext();
      if (!effekseerContext) throw new Error('Effekseer 渲染上下文创建失败');
      effekseerContext.init(renderer.getContext());
    }
    const sourceUri = asset.source_uris?.[0];
    if (!sourceUri) throw new Error('缺少 Effekseer 特效文件地址');
    const effect = await new Promise((resolve, reject) => {
      let pending;
      pending = effekseerContext.loadEffect(
        sourceUri,
        asset.scale || 1,
        () => resolve(pending),
        (message, resourceUrl) => reject(new Error(`Effekseer 特效加载失败：${message || resourceUrl || sourceUri}`))
      );
    });
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
      return effekseerContext.play(effect, position.x, position.y, position.z);
    },
    update(delta) { batch.update(delta); effekseerContext?.update(delta * 60); },
    draw() {
      if (!effekseerContext) return;
      effekseerContext.setProjectionMatrix(camera.projectionMatrix.elements);
      effekseerContext.setCameraMatrix(camera.matrixWorldInverse.elements);
      effekseerContext.draw(); renderer.resetState();
    },
    dispose() {
      scene.remove(batch); batch.dispose?.();
      if (effekseerContext) {
        effekseerContext.stopAll();
        loaded.forEach(effect => effekseerContext.releaseEffect(effect));
        window.effekseer.releaseContext(effekseerContext);
        effekseerContext = null;
      }
      loaded.clear();
    },
  };
}