import * as THREE from 'three';

const SIZE = 40;

/** 地图编辑场景：按 Board 网格显示地面，点击放置实体，实体渲染完全由数据驱动。 */
export function createMapEditorScene(mount, { onPlace } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0f13);
  const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / Math.max(mount.clientHeight, 1), 0.1, 400);
  camera.position.set(0, 34, 30);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.8));
  const light = new THREE.DirectionalLight(0xffffff, 0.9);
  light.position.set(8, 20, 12);
  scene.add(light);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0x171b21 }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  let gridHelper = null;
  let grid = { width: 64, height: 64 };
  let placing = false;
  let selectedId = null;
  let disposed = false;
  const markers = new Map();

  const sizeZ = () => SIZE * (grid.height / Math.max(grid.width, 1));
  const cellSize = () => SIZE / Math.max(grid.width, 1);
  const worldX = cx => (cx + 0.5) * cellSize() - SIZE / 2;
  const worldZ = cy => (cy + 0.5) * cellSize() - sizeZ() / 2;

  const rebuildGround = () => {
    ground.geometry.dispose();
    ground.geometry = new THREE.PlaneGeometry(SIZE, sizeZ());
    if (gridHelper) scene.remove(gridHelper);
    gridHelper = new THREE.GridHelper(SIZE, Math.min(grid.width, 64), 0x4b5563, 0x242a32);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);
  };
  rebuildGround();

  const ghost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12),
    new THREE.MeshBasicMaterial({ color: 0xcbd3dc, transparent: true, opacity: 0.35 })
  );
  ghost.visible = false;
  scene.add(ghost);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  const pickCell = event => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(ground)[0]?.point;
    if (!hit) return null;
    const cx = Math.floor(((hit.x + SIZE / 2) / SIZE) * grid.width);
    const cy = Math.floor(((hit.z + sizeZ() / 2) / sizeZ()) * grid.height);
    if (cx < 0 || cy < 0 || cx >= grid.width || cy >= grid.height) return null;
    return { x: cx, y: cy };
  };

  const handleMove = event => {
    if (!placing) { ghost.visible = false; return; }
    const cell = pickCell(event);
    if (!cell) { ghost.visible = false; return; }
    ghost.visible = true;
    ghost.scale.setScalar(Math.max(cellSize(), 0.2));
    ghost.position.set(worldX(cell.x), cellSize() * 0.6, worldZ(cell.y));
  };

  const handleClick = event => {
    if (!placing) return;
    const cell = pickCell(event);
    if (cell) onPlace?.(cell);
  };

  renderer.domElement.addEventListener('pointermove', handleMove);
  renderer.domElement.addEventListener('click', handleClick);

  const disposeMarker = marker => {
    scene.remove(marker);
    marker.geometry.dispose();
    marker.material.dispose();
  };

  const frame = () => {
    if (disposed) return;
    requestAnimationFrame(frame);
    renderer.render(scene, camera);
  };
  frame();

  const resize = () => {
    const w = mount.clientWidth, h = Math.max(mount.clientHeight, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', resize);

  const paint = () => markers.forEach((marker, id) => {
    marker.material.color.set(id === selectedId ? 0xe6b45e : 0xb9c2cc);
  });

  return {
    setGrid(next) {
      grid = { width: Math.max(Number(next?.width) || 64, 1), height: Math.max(Number(next?.height) || 64, 1) };
      rebuildGround();
    },
    setEntities(list = []) {
      const seen = new Set();
      list.forEach((entity, index) => {
        const id = entity.instance_id || `entity-${index}`;
        seen.add(id);
        let marker = markers.get(id);
        if (!marker) {
          marker = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12),
            new THREE.MeshStandardMaterial({ color: 0xb9c2cc, emissive: 0x22262c, emissiveIntensity: 0.5 })
          );
          scene.add(marker);
          markers.set(id, marker);
        }
        marker.scale.setScalar(Math.max(cellSize(), 0.2));
        marker.position.set(worldX(Number(entity.position?.x) || 0), cellSize() * 0.6, worldZ(Number(entity.position?.y) || 0));
      });
      [...markers.keys()].filter(id => !seen.has(id)).forEach(id => {
        disposeMarker(markers.get(id));
        markers.delete(id);
      });
      paint();
    },
    setPlacing(next) {
      placing = next;
      if (!next) ghost.visible = false;
    },
    setSelected(next) {
      selectedId = next;
      paint();
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointermove', handleMove);
      renderer.domElement.removeEventListener('click', handleClick);
      markers.forEach(disposeMarker);
      markers.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
  };
}