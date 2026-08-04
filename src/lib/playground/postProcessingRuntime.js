import { BloomEffect, EffectComposer, EffectPass, RenderPass } from 'postprocessing';

export function createPostProcessingRuntime(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new BloomEffect({ intensity: 0.45, luminanceThreshold: 0.85 });
  const effectPass = new EffectPass(camera, bloom);
  composer.addPass(renderPass);
  composer.addPass(effectPass);
  let enabled = true;
  return {
    render(delta) { enabled ? composer.render(delta) : renderer.render(scene, camera); },
    resize(width, height) { composer.setSize(width, height); },
    configure(next = {}) {
      enabled = next.enabled !== false;
      if (Number.isFinite(next.bloomIntensity)) bloom.intensity = next.bloomIntensity;
    },
    dispose() { composer.dispose(); },
  };
}