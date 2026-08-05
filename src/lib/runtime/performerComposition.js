export function usesInstanceChildren(instance) {
  if (!instance) return false;
  if (instance.children_mode) return instance.children_mode === 'override';
  return Array.isArray(instance.children) && instance.children.length > 0;
}

export function resolvePerformerChildren(definition, instance) {
  return usesInstanceChildren(instance) ? (instance.children || []) : (definition?.children || []);
}