export const EMPTY_INSTANCE_TRANSFORM = {
  local_position: [0, 0, 0],
  local_rotation: [0, 0, 0],
  local_scale: [1, 1, 1],
};

const vector = (value, fallback) => Array.isArray(value) ? value : fallback;

export function readInstanceOverrides(instance = {}) {
  const transform = instance.overrides?.transform || {};
  return {
    params: instance.overrides?.params ?? instance.param_overrides ?? [],
    transform: {
      local_position: vector(transform.local_position, EMPTY_INSTANCE_TRANSFORM.local_position),
      local_rotation: vector(transform.local_rotation, EMPTY_INSTANCE_TRANSFORM.local_rotation),
      local_scale: vector(transform.local_scale, EMPTY_INSTANCE_TRANSFORM.local_scale),
    },
  };
}

export function writeInstanceTransform(instance, transform) {
  return { ...instance, overrides: { ...(instance.overrides || {}), transform } };
}

export function writeInstanceParams(instance, params) {
  return { ...instance, overrides: { ...(instance.overrides || {}), params } };
}