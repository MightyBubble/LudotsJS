import * as THREE from 'three';
import { acquireModelAsset } from '@/lib/playground/modelAssetCache';

export function createMissingAssetBillboard() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 96;
  const context = canvas.getContext('2d'); context.fillStyle = 'rgba(13,15,20,.92)'; context.fillRect(0, 0, 256, 96);
  context.strokeStyle = '#ef4444'; context.lineWidth = 5; context.strokeRect(3, 3, 250, 90);
  context.fillStyle = '#fecaca'; context.font = 'bold 30px sans-serif'; context.textAlign = 'center'; context.fillText('无 asset', 128, 59);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.set(2.4, 0.9, 1); sprite.position.y = 1.15; sprite.userData.visualKind = 'missing';
  return sprite;
}

const applyTransform = (object, binding = {}) => {
  const offset = binding.localOffset || [0, 0, 0];
  const rotation = binding.localRotation || [0, 0, 0, 1];
  const scale = binding.localScale || [1, 1, 1];
  object.position.fromArray(offset);
  object.quaternion.fromArray(rotation);
  object.scale.multiply(new THREE.Vector3(...scale));
};

const buildPerformerNode = async (node) => {
  const group = new THREE.Group();
  group.name = node.definitionId || 'performer';
  const assetBehaviors = (node.behaviors || []).filter(item => item.kind === 'AssetBinding' && item.resolvedAsset?.uri);
  for (const behavior of assetBehaviors) {
    const acquired = await acquireModelAsset(behavior.resolvedAsset);
    const object = acquired.object;
    const box = new THREE.Box3().setFromObject(object); const size = box.getSize(new THREE.Vector3());
    const fit = 1.8 / Math.max(size.x, size.y, size.z, 0.001);
    object.scale.setScalar(fit); object.position.y = -box.min.y * fit;
    applyTransform(object, behavior.assetBinding);
    object.userData.releaseModel = acquired.release;
    group.add(object);
  }
  for (const child of node.children || []) group.add(await buildPerformerNode(child));
  group.userData.visualKind = assetBehaviors.length || group.children.length ? 'model' : 'empty';
  return group;
};

export async function createEntityAppearanceVisual(appearance) {
  if (appearance?.kind !== 'performer') return createMissingAssetBillboard();
  try {
    const object = await buildPerformerNode(appearance.tree);
    if (!object.children.length) return createMissingAssetBillboard();
    return object;
  } catch { return createMissingAssetBillboard(); }
}

export function applyGhostAppearance(object) {
  object.traverse(child => {
    if (!child.material) return;
    child.material = Array.isArray(child.material) ? child.material.map(material => material.clone()) : child.material.clone();
    child.userData.ownsGhostMaterial = true;
    (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => {
      material.transparent = true;
      material.opacity = 0.4;
      material.depthWrite = false;
    });
  });
  return object;
}

export function disposeAppearanceVisual(object) {
  object.traverse(child => {
    if (!child.material || (!child.isSprite && !child.userData.ownsGhostMaterial)) return;
    (Array.isArray(child.material) ? child.material : [child.material]).forEach(material => { if (child.isSprite) material.map?.dispose(); material.dispose(); });
  });
  object.traverse(child => child.userData.releaseModel?.());
  object.parent?.remove(object);
}