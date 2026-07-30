import * as THREE from 'three';

const colorFor = key => {
  let hash = 0;
  for (const char of key || 'entity') hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return new THREE.Color().setHSL((Math.abs(hash) % 360) / 360, .45, .58);
};

export function createEntityPlacementRuntime(scene, onEvent, onSpawn) {
  const group = new THREE.Group();
  scene.add(group);
  const ghostMaterial = new THREE.MeshStandardMaterial({ color: 0xb9c2cc, transparent: true, opacity: .45 });
  const ghost = new THREE.Mesh(new THREE.CylinderGeometry(.55, .7, 1.2, 12), ghostMaterial);
  ghost.position.y = .6; ghost.visible = false; scene.add(ghost);
  let prototype = null, nextRuntimeId = 1;
  const begin = next => { prototype = next; ghost.visible = false; onEvent(`CommandSource.UI → Intent.PlacePrototype · ${next.prototype_id}`); };
  const preview = point => { if (!prototype || !point) return; ghost.position.set(point.x, .6, point.z); ghost.visible = true; };
  const commit = point => {
    if (!prototype || !point) return null;
    const request = { kind: 'Template', templateId: prototype.prototype_id, worldPositionCm: { x: Math.round(point.x * 100), y: Math.round(point.z * 100) } };
    const runtimeId = nextRuntimeId++;
    const material = new THREE.MeshStandardMaterial({ color: colorFor(request.templateId), roughness: .7 });
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(.55, .7, 1.2, 12), material);
    mesh.position.set(point.x, .6, point.z); mesh.userData = { runtimeId, templateId: request.templateId }; group.add(mesh);
    onEvent(`SpawnReceipt #${runtimeId} · Template ${request.templateId} @ ${request.worldPositionCm.x}, ${request.worldPositionCm.y}`);
    onSpawn?.({ runtimeId, prototype, request });
    return request;
  };
  const cancel = () => { prototype = null; ghost.visible = false; onEvent('Intent.PlacePrototype 已取消'); };
  const clear = () => { group.children.splice(0).forEach(mesh => { mesh.geometry.dispose(); mesh.material.dispose(); group.remove(mesh); }); onEvent('Runtime entities 已清空'); };
  const dispose = () => { clear(); ghost.geometry.dispose(); ghostMaterial.dispose(); scene.remove(ghost, group); };
  return { begin, preview, commit, cancel, clear, dispose, get isActive() { return !!prototype; } };
}