export const getEffectPath = (value, path) => path.split('.').reduce((current, key) => current?.[key], value);

export function setEffectPath(value, path, next) {
  const keys = path.split('.');
  const root = { ...(value || {}) };
  let current = root;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) current[key] = next;
    else current = current[key] = { ...(current[key] || {}) };
  });
  return root;
}