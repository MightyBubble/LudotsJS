import * as THREE from 'three';
import { boardCellGrid } from '@/lib/map/spatialScale';
import { applyGhostAppearance, createEntityAppearanceVisual, disposeAppearanceVisual } from '@/lib/playground/entityAppearanceVisuals';
import { createPostProcessingRuntime } from '@/lib/playground/postProcessingRuntime';
import { createVfxRuntime } from '@/lib/playground/vfxRuntime';

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
let HALF_X = 10, HALF_Z = 7;

// 干净的 playground 场景：地面 + 模板放置 + 播放/暂停时钟。
export function createPlaygroundScene(mount, { onPlace, onTick, onCancelPlacement } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0f13);
  const camera = new THREE.PerspectiveCamera(48, mount.clientWidth / mount.clientHeight, 0.1, 200);
  camera.position.set(0, 15, 13);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth, mount.clientHeight);
  mount.appendChild(renderer.domElement);
  const postProcessing = createPostProcessingRuntime(renderer, scene, camera);
  const vfx = createVfxRuntime(scene, renderer, camera);

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
  let gridHelper = new THREE.GridHelper(HALF_X * 2, HALF_X * 2, 0x4b5563, 0x242a32);
  scene.add(gridHelper);

  const ghost = new THREE.Group();
  ghost.visible = false;
  scene.add(ghost);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const entities = [];
  const mapMeshes = [];
  const selectionVisuals = [];
  let template = null, binding = null, view = null, paused = false, disposed = false, elapsed = 0, mapRevision = 0, ghostRevision = 0;
  let ghostPoint = null;
  let appearanceResolver = () => ({ kind: 'missing', label: '无 asset' });
  const applyView = () => entities.forEach((entity) => {
    if (!view?.id) entity.mesh.visible = true;
    else entity.mesh.visible = view.mode === 'Players'
      ? entity.owner_player_id === view.id
      : entity.team_id === view.id;
  });
  const disposeMaterial = (material) => Array.isArray(material) ? material.forEach((item) => item.dispose()) : material.dispose();
  const updateVisualStats = () => {
    const visuals = [...mapMeshes, ...entities.map(item => item.mesh)];
    mount.dataset.modelCount = String(visuals.filter(item => item.userData.visualKind === 'model').length);
    mount.dataset.missingAssetCount = String(visuals.filter(item => item.userData.visualKind === 'missing').length);
  };
  const disposeMesh = (mesh) => disposeAppearanceVisual(mesh);
  const refreshGhost = async () => {
    const revision = ++ghostRevision;
    ghost.visible = false;
    ghost.children.slice().forEach(disposeAppearanceVisual);
    mount.dataset.ghostVisualKind = 'none';
    if (!template?.prototype_id) return;
    const visual = applyGhostAppearance(await createEntityAppearanceVisual(appearanceResolver(template.prototype_id)));
    if (disposed || revision !== ghostRevision) { disposeAppearanceVisual(visual); return; }
    ghost.add(visual);
    mount.dataset.ghostVisualKind = visual.userData.visualKind || 'missing';
    ghost.visible = Boolean(ghostPoint);
  };
  const loadMap = (map) => {
    const grid = boardCellGrid(map?.boards?.[0] || {});
    HALF_X = 10;
    HALF_Z = clamp(HALF_X * (grid.height / Math.max(grid.width, 1)), 3, 20);
    ground.geometry.dispose();
    ground.geometry = new THREE.PlaneGeometry(HALF_X * 2, HALF_Z * 2);
    scene.remove(gridHelper);
    gridHelper.geometry.dispose();
    disposeMaterial(gridHelper.material);
    gridHelper = new THREE.GridHelper(HALF_X * 2, Math.min(grid.width, 64), 0x4b5563, 0x242a32);
    gridHelper.scale.z = HALF_Z / HALF_X;
    scene.add(gridHelper);
    mapMeshes.splice(0).forEach(disposeMesh);
    const revision = ++mapRevision;
    (map?.entities || []).forEach(async (entity) => {
      const visual = await createEntityAppearanceVisual(appearanceResolver(entity.template));
      if (disposed || revision !== mapRevision) { disposeAppearanceVisual(visual); return; }
      const x = ((Number(entity.position?.x) + 0.5) / grid.width) * HALF_X * 2 - HALF_X;
      const z = ((Number(entity.position?.y) + 0.5) / grid.height) * HALF_Z * 2 - HALF_Z;
      visual.position.x = x; visual.position.z = z;
      visual.userData.entity = { id: entity.instance_id, entity_id: entity.instance_id, prototype_id: entity.template, position: entity.position, ...(entity.overrides || {}) };
      scene.add(visual); mapMeshes.push(visual); updateVisualStats();
    });
    updateVisualStats();
  };

  const pickScreenPoint = (point) => {
    pointer.set((point.x / renderer.domElement.clientWidth) * 2 - 1, -(point.y / renderer.domElement.clientHeight) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(ground)[0]?.point;
    return hit ? new THREE.Vector3(clamp(hit.x, -HALF_X, HALF_X), 0, clamp(hit.z, -HALF_Z, HALF_Z)) : null;
  };
  const pick = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    return pickScreenPoint({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };
  const clearWorldSelection = () => selectionVisuals.splice(0).forEach(disposeMesh);
  const worldPolygon = (points, shape) => {
    const picked = points.map(pickScreenPoint).filter(Boolean);
    if (shape !== 'box' || picked.length < 2) return picked;
    const first = picked[0], last = picked[picked.length - 1];
    return [new THREE.Vector3(first.x, 0, first.z), new THREE.Vector3(last.x, 0, first.z), new THREE.Vector3(last.x, 0, last.z), new THREE.Vector3(first.x, 0, last.z)];
  };
  const updateWorldSelection = (points, shape, style = {}) => {
    clearWorldSelection();
    const polygon = worldPolygon(points, shape);
    if (polygon.length < 2) return;
    const fill = new THREE.Shape(polygon.map(point => new THREE.Vector2(point.x, point.z)));
    const fillColor = style.fill_color?.slice(0, 7) || '#38BDF8';
    const alpha = style.fill_color?.length === 9 ? parseInt(style.fill_color.slice(7), 16) / 255 : 0.2;
    const fillMesh = new THREE.Mesh(new THREE.ShapeGeometry(fill), new THREE.MeshBasicMaterial({ color: fillColor, transparent: true, opacity: alpha, side: THREE.DoubleSide, depthWrite: false }));
    fillMesh.rotation.x = Math.PI / 2; fillMesh.position.y = 0.025;
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(polygon.map(point => new THREE.Vector3(point.x, 0.04, point.z)));
    const line = new THREE.LineLoop(lineGeometry, new THREE.LineBasicMaterial({ color: style.stroke_color || '#7DD3FC', linewidth: style.line_width || 2 }));
    scene.add(fillMesh, line); selectionVisuals.push(fillMesh, line);
  };

  const handleMove = (event) => {
    if (!template) { ghostPoint = null; ghost.visible = false; return; }
    const point = pick(event);
    if (!point) { ghostPoint = null; ghost.visible = false; return; }
    ghostPoint = point;
    ghost.visible = ghost.children.length > 0;
    ghost.position.set(point.x, 0, point.z);
  };

  const handleClick = async (event) => {
    if (!template) return;
    const point = pick(event);
    if (!point) return;
    const selectedTemplate = template;
    const mesh = await createEntityAppearanceVisual(appearanceResolver(selectedTemplate.prototype_id));
    if (disposed) { disposeAppearanceVisual(mesh); return; }
    mesh.position.x = point.x; mesh.position.z = point.z;
    scene.add(mesh);
    const entity = {
      id: `${selectedTemplate.prototype_id || 'entity'}-${entities.length + 1}`,
      prototype_id: selectedTemplate.prototype_id,
      name: selectedTemplate.name,
      owner_player_id: binding?.owner_player_id || null,
      team_id: binding?.team_id || null,
      position: { x: Number(point.x.toFixed(2)), z: Number(point.z.toFixed(2)) },
      mesh,
    };
    entities.push(entity);
    applyView(); updateVisualStats();
    onPlace?.({ id: entity.id, prototype_id: entity.prototype_id, name: entity.name, owner_player_id: entity.owner_player_id, team_id: entity.team_id, position: entity.position });
  };
  const handleContextMenu = (event) => {
    if (!template) return;
    event.preventDefault();
    ghost.visible = false;
    onCancelPlacement?.();
  };

  renderer.domElement.addEventListener('pointermove', handleMove);
  renderer.domElement.addEventListener('click', handleClick);
  renderer.domElement.addEventListener('contextmenu', handleContextMenu);

  const clock = new THREE.Clock();
  const frame = () => {
    if (disposed) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!paused) {
      elapsed += dt;
      onTick?.(elapsed);
    }
    vfx.update(dt);
    postProcessing.render(dt);
    vfx.draw();
  };
  frame();

  const resize = () => {
    const w = mount.clientWidth, h = mount.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    postProcessing.resize(w, h);
  };
  window.addEventListener('resize', resize);

  return {
    setAppearanceResolver(next) {
      appearanceResolver = next || (() => ({ kind: 'missing', label: '无 asset' }));
      refreshGhost();
    },
    setMap(next) {
      loadMap(next);
    },
    setTemplate(next) {
      template = next;
      ghostPoint = null;
      refreshGhost();
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
    selectByScreenShape(points, shape = 'box') {
      if (!points?.length) return [];
      const contains = shape === 'box'
        ? point => { const a = points[0], b = points[points.length - 1]; return point.x >= Math.min(a.x, b.x) && point.x <= Math.max(a.x, b.x) && point.y >= Math.min(a.y, b.y) && point.y <= Math.max(a.y, b.y); }
        : point => points.reduce((inside, current, index) => { const previous = points[(index + points.length - 1) % points.length]; const crosses = ((current.y > point.y) !== (previous.y > point.y)) && point.x < (previous.x - current.x) * (point.y - current.y) / (previous.y - current.y || 1) + current.x; return crosses ? !inside : inside; }, false);
      return mapMeshes.filter(mesh => mesh.visible !== false && contains((() => { const projected = mesh.position.clone().project(camera); return { x: (projected.x + 1) * renderer.domElement.clientWidth / 2, y: (1 - projected.y) * renderer.domElement.clientHeight / 2 }; })())).map(mesh => mesh.userData.entity);
    },
    selectByWorldShape(points, shape = 'box') {
      const polygon = worldPolygon(points, shape);
      if (polygon.length < 2) return [];
      const contains = point => polygon.reduce((inside, current, index) => { const previous = polygon[(index + polygon.length - 1) % polygon.length]; const crosses = ((current.z > point.z) !== (previous.z > point.z)) && point.x < (previous.x - current.x) * (point.z - current.z) / (previous.z - current.z || 1) + current.x; return crosses ? !inside : inside; }, false);
      return mapMeshes.filter(mesh => mesh.visible !== false && contains(mesh.position)).map(mesh => mesh.userData.entity);
    },
    updateWorldSelection,
    clearWorldSelection,
    playEffect(effectAsset, position) { return vfx.play(effectAsset, position); },
    setPostProcessing(config) { postProcessing.configure(config); },
    clear() {
      entities.splice(0).forEach(entity => disposeAppearanceVisual(entity.mesh));
      elapsed = 0; updateVisualStats(); onTick?.(0);
    },
    dispose() {
      disposed = true;
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointermove', handleMove);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      mapMeshes.splice(0).forEach(disposeMesh);
      ghost.children.slice().forEach(disposeAppearanceVisual);
      clearWorldSelection();
      vfx.dispose();
      postProcessing.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    },
  };
}