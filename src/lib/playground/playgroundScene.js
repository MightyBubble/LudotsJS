import * as THREE from 'three';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const HALF_X = 10, HALF_Z = 7;

// 干净的 playground 场景：地面 + 模板放置 + 播放/暂停时钟。
export function createPlaygroundScene(mount, { onPlace, onTick } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0f13);
  const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 200);
  camera.position.set(0, 15, 13);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(4, 12, 6);
  scene.add(light);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2),
    new THREE.MeshLambertMaterial({ color: 0x171b21 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  scene.add(new THREE.GridHelper(HALF_X * 2, HALF_X * 2, 0x4b5563, 0x242a32));

  const ghostMaterial = new THREE.MeshBasicMaterial({ color: 0xcbd3dc, transparent: true, opacity: 0.35 });
  const ghost = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 0.8, 5, 12), ghostMaterial);
  ghost.visible = false;
  scene.add(ghost);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const entities = [];
  let template = null, binding = null, view = null, paused = false, disposed = false, elapsed = 0;
  const applyView = () => entities.forEach((entity) => {
    if (!view?.id) entity.mesh.visible = true;
    else entity.mesh.visible = view.mode === 'Players'
      ? entity.owner_player_id === view.id
      : entity.team_id === view.id;
  });

  const pick = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(ground)[0]?.point;
    if (!hit) return null;
    return new THREE.Vector3(clamp(hit.x, -HALF_X, HALF_X), 0, clamp(hit.z, -HALF_Z, HALF_Z));
  };

  const handleMove = (event) => {
    if (!template) { ghost.visible = false; return; }
    const point = pick(event);
    if (!point) { ghost.visible = false; return; }
    ghost.visible = true;
    ghost.position.set(point.x, 0.85, point.z);
  };

  const handleClick = (event) => {
    if (!template) return;
    const point = pick(event);
    if (!point) return;
    const mesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.45, 0.8, 5, 12),
      new THREE.MeshStandardMaterial({ color: 0xb9c2cc, emissive: 0x22262c, emissiveIntensity: 0.5 })
    );
    mesh.position.set(point.x, 0.85, point.z);
    scene.add(mesh);
    const entity = {
      id: `${template.prototype_id || 'entity'}-${entities.length + 1}`,
      prototype_id: template.prototype_id,
      name: template.name,
      owner_player_id: binding?.owner_player_id || null,
      team_id: binding?.team_id || null,
      position: { x: Number(point.x.toFixed(2)), z: Number(point.z.toFixed(2)) },
      mesh,
    };
    entities.push(entity);
    applyView();
    onPlace?.({ id: entity.id, prototype_id: entity.prototype_id, name: entity.name, owner_player_id: entity.owner_player_id, team_id: entity.team_id, position: entity.position });
  };

  renderer.domElement.addEventListener('pointermove', handleMove);
  renderer.domElement.addEventListener('click', handleClick);

  const clock = new THREE.Clock();
  const frame = () => {
    if (disposed) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused) {
      elapsed += dt;
      onTick?.(elapsed);
    }
    renderer.render(scene, camera);
  };
  frame();

  const resize = () => {
    const w = mount.clientWidth, h = mount.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', resize);

  return {
    setTemplate(next) {
      template = next;
      ghost.visible = false;
    },
    setPaused(next) {
      paused = next;
    },
    setBinding(next) {
      binding = next;
    },
    setView(next) {
      view = next;
      applyView();
    },
    clear() {
      entities.forEach((e) => {
        scene.remove(e.mesh);
        e.mesh.geometry.dispose();
        e.mesh.material.dispose();
      });
      entities.length = 0;
      elapsed = 0;
      onTick?.(0);
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointermove', handleMove);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
  };
}