import { BatchedRenderer, QuarksLoader, QuarksUtil } from 'three.quarks';

const linkQuarksSubEmitters = (root) => {
  const emitters = new Map();
  root.traverse(child => { if (child.system) emitters.set(child.uuid, child); });
  root.traverse(child => {
    for (const behavior of child.system?.behaviors || []) {
      if (behavior.type !== 'EmitSubParticleSystem') continue;
      const reference = behavior.subParticleSystem;
      const emitter = typeof reference === 'string' ? emitters.get(reference) : reference?.system ? reference : emitters.get(reference?.uuid);
      behavior.subParticleSystem = emitter?.system ? emitter : undefined;
    }
  });
  return root;
};

export function createVfxRuntime(scene) {
  const batch = new BatchedRenderer(); scene.add(batch); let disposed = false;
  return {
    async play(asset, position = { x: 0, y: 0, z: 0 }) {
      if (disposed) throw new Error('特效预览已关闭');
      const loader = new QuarksLoader();
      const effect = asset.source_json ? await Promise.resolve(loader.parse(asset.source_json)) : await loader.loadAsync(asset.source_uris[0]);
      if (disposed) throw new Error('特效预览已关闭');
      const instance = linkQuarksSubEmitters(effect); scene.add(instance);
      QuarksUtil.addToBatchRenderer(instance, batch); QuarksUtil.setAutoDestroy(instance, true); QuarksUtil.play(instance);
      instance.position.set(position.x, position.y, position.z); return instance;
    },
    update(delta) { if (!disposed) batch.update(Math.min(delta, 0.1)); },
    draw() {},
    dispose() { if (disposed) return; disposed = true; scene.remove(batch); batch.dispose?.(); },
  };
}