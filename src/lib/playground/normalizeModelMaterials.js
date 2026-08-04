export function normalizeModelMaterials(scene) {
  scene?.traverse((child) => {
    const materials = Array.isArray(child.material) ? child.material : child.material ? [child.material] : [];
    materials.forEach((material) => {
      if (material.isMeshStandardMaterial && material.metalness >= 0.99 && !material.map && !material.metalnessMap) {
        material.metalness = 0;
        material.needsUpdate = true;
      }
    });
  });
  return scene;
}