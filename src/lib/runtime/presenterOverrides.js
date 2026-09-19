export const EMPTY_INSTANCE_TRANSFORM = {
  localPosition: [0, 0, 0],
  localRotation: [0, 0, 0],
  localScale: [1, 1, 1],
};

const vector = (value, fallback) => Array.isArray(value) ? value : fallback;

export function readInstanceOverrides(instance = {}) {
  const transform = instance.overrides?.transform || {};
  return {
    params: instance.overrides?.params || [],
    transform: {
      localPosition: vector(transform.localPosition, EMPTY_INSTANCE_TRANSFORM.localPosition),
      localRotation: vector(transform.localRotation, EMPTY_INSTANCE_TRANSFORM.localRotation),
      localScale: vector(transform.localScale, EMPTY_INSTANCE_TRANSFORM.localScale),
    },
  };
}

export function writeInstanceTransform(instance, transform) {
  return { ...instance, overrides: { ...(instance.overrides || {}), transform } };
}

export function writeInstanceParams(instance, params) {
  return { ...instance, overrides: { ...(instance.overrides || {}), params } };
}
