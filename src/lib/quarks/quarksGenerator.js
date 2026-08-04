const interval = (a, b) => ({ type: 'IntervalValue', a, b });
const constant = value => ({ type: 'ConstantValue', value });
const color = (r = 1, g = 1, b = 1, a = 1) => ({ type: 'ConstantColor', color: { r, g, b, a } });
const fade = (start = 1) => ({ type: 'ColorOverLife', color: { type: 'Gradient', color: { type: 'CLinearFunction', subType: 'Color', keys: [{ value: { r: 1, g: 1, b: 1 }, pos: 0 }, { value: { r: 0.12, g: 0.12, b: 0.12 }, pos: 1 }] }, alpha: { type: 'CLinearFunction', subType: 'Number', keys: [{ value: start, pos: 0 }, { value: 0, pos: 1 }] } } });
const grow = (from, to) => ({ type: 'SizeOverLife', size: { type: 'PiecewiseBezier', functions: [{ function: { p0: from, p1: to * 0.75, p2: to, p3: to }, start: 0 }] } });
const ROLES = [
  { name: '瞬时白闪', tile: 0, life: [0.08, 0.14], speed: [0, 0], size: [12, 16], count: 2, radius: 0.01, grow: [0.2, 1.1] },
  { name: '冲击波环', tile: 1, life: [0.45, 0.7], speed: [0, 0], size: [9, 14], count: 2, radius: 0.01, grow: [0.25, 1.35] },
  { name: '蘑菇云主体', tile: 2, life: [2.8, 4.2], speed: [1.5, 4], size: [2.5, 5.5], count: 30, radius: 2.2, grow: [0.35, 1.2] },
  { name: '放射速度线', tile: 3, life: [0.18, 0.38], speed: [22, 42], size: [0.16, 0.38], count: 48, radius: 1.4, grow: [1, 0.15] },
  { name: '上升云柱', tile: 2, life: [2.5, 3.8], speed: [5, 9], size: [1.8, 3.6], count: 18, radius: 0.8, grow: [0.4, 1.3] },
  { name: '黑白碎屑', tile: 3, life: [0.8, 1.6], speed: [8, 20], size: [0.08, 0.28], count: 36, radius: 1.8, grow: [1, 0.2] },
];
export function buildGeneratedQuarks(template, textureUrl, spec = {}) {
  const next = structuredClone(template); let index = 0;
  (next.images || []).forEach(image => { image.url = textureUrl; });
  (next.materials || []).forEach(material => { material.transparent = true; material.depthWrite = false; material.defines = { ...(material.defines || {}), USE_COLOR_AS_ALPHA: '' }; });
  const walk = node => {
    if (node?.type === 'ParticleEmitter' && node.ps) {
      const role = ROLES[index % ROLES.length]; const ps = node.ps; node.name = role.name;
      ps.version = '2.0'; ps.autoDestroy = false; ps.looping = false; ps.prewarm = false; ps.duration = Math.max(0.1, Number(spec.duration || 4.2));
      ps.startLife = interval(...role.life); ps.startSpeed = interval(...role.speed); ps.startSize = interval(...role.size); ps.startColor = color();
      ps.emissionOverTime = constant(0); ps.emissionOverDistance = constant(0); ps.emissionBursts = [{ time: index < 2 ? 0.01 : 0.06 + index * 0.035, count: Math.round(role.count * Number(spec.intensity || 1)), cycleCount: 1, probability: 1 }];
      ps.shape = { type: 'sphere', radius: role.radius, arc: Math.PI * 2, thickness: index < 2 ? 0 : 1 }; ps.renderMode = index === 3 ? 1 : 0; ps.worldSpace = true;
      ps.startTileIndex = constant(role.tile); ps.uTileCount = 2; ps.vTileCount = 2; ps.behaviors = [grow(...role.grow), fade(index === 2 || index === 4 ? 0.78 : 1)]; index += 1;
    }
    (node?.children || []).forEach(walk);
  };
  walk(next.object); next.userData = { ...(next.userData || {}), generator: 'Ludots Quarks AI', prompt: spec.name || '' }; return next;
}