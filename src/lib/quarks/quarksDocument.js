export const RENDER_MODES = [
  [0, 'Billboard'], [1, 'Stretched Billboard'], [2, 'Mesh'], [3, 'Trail'], [4, 'Horizontal Billboard'], [5, 'Vertical Billboard'],
];

export const BEHAVIOR_TEMPLATES = {
  SizeOverLife: { type: 'SizeOverLife', size: { type: 'PiecewiseBezier', functions: [{ function: { p0: 1, p1: 1, p2: 0, p3: 0 }, start: 0 }] } },
  ColorOverLife: { type: 'ColorOverLife', color: { type: 'Gradient', color: { type: 'CLinearFunction', subType: 'Color', keys: [{ value: { r: 1, g: 1, b: 1 }, pos: 0 }, { value: { r: 1, g: 1, b: 1 }, pos: 1 }] }, alpha: { type: 'CLinearFunction', subType: 'Number', keys: [{ value: 1, pos: 0 }, { value: 0, pos: 1 }] } } },
  SpeedOverLife: { type: 'SpeedOverLife', speed: { type: 'PiecewiseBezier', functions: [{ function: { p0: 1, p1: 1, p2: 0, p3: 0 }, start: 0 }] } },
  RotationOverLife: { type: 'RotationOverLife', angularVelocity: { type: 'ConstantValue', value: 1 } },
  ForceOverLife: { type: 'ForceOverLife', x: { type: 'ConstantValue', value: 0 }, y: { type: 'ConstantValue', value: 1 }, z: { type: 'ConstantValue', value: 0 } },
  FrameOverLife: { type: 'FrameOverLife', frame: { type: 'PiecewiseBezier', functions: [{ function: { p0: 0, p1: 0, p2: 1, p3: 1 }, start: 0 }] } },
  Noise: { type: 'Noise', frequency: { type: 'ConstantValue', value: 1 }, power: { type: 'ConstantValue', value: 0.5 }, positionAmount: { type: 'ConstantValue', value: 1 }, rotationAmount: { type: 'ConstantValue', value: 0 } },
};

export const cloneDocument = value => structuredClone(value);
export function getEmitters(document) {
  const result = [];
  const walk = (node, path = []) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'ParticleEmitter' && node.ps) result.push({ uuid: node.uuid, name: node.name || `Emitter ${result.length + 1}`, ps: node.ps, path });
    (node.children || []).forEach((child, index) => walk(child, [...path, 'children', index]));
  };
  walk(document?.object);
  return result;
}
export function updateEmitter(document, uuid, updater) {
  const next = cloneDocument(document);
  const walk = node => {
    if (node?.uuid === uuid && node.ps) node.ps = updater(node.ps);
    (node?.children || []).forEach(walk);
  };
  walk(next.object); return next;
}
export function updateMaterial(document, uuid, patch) {
  const next = cloneDocument(document); const material = (next.materials || []).find(item => item.uuid === uuid);
  if (material) Object.assign(material, patch); return next;
}
export function validateQuarksDocument(document) {
  if (document?.metadata?.type !== 'Object' || !document.object) return '不是有效的 Three.js Object JSON';
  if (!getEmitters(document).length) return '文档中没有 ParticleEmitter';
  return '';
}