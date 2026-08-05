import { resolvePerformerChildren, usesInstanceChildren } from './performerComposition';

const indexMap = records => new Map(records.map(item => [item.performer_id, item]));

export function findHierarchyNode(root, records, path) {
  if (!root) return null;
  if (path === 'root') return { performer: root, instance: null, path: 'root', parentPath: null, index: -1, source: 'definition' };
  const byId = indexMap(records);
  const parts = path.split('/').slice(1).map(Number);
  let performer = root, instance = null, currentPath = 'root', source = 'definition';
  for (const index of parts) {
    source = instance ? (usesInstanceChildren(instance) ? 'nested_override' : 'nested_template') : 'definition';
    const templateOwnerId = source === 'nested_template' ? performer.performer_id : null;
    const templatePath = source === 'nested_template' ? `root/${index}` : null;
    const child = resolvePerformerChildren(performer, instance)[index];
    if (!child) return null;
    const parentPath = currentPath;
    currentPath += `/${index}`;
    performer = byId.get(child.definition_id);
    instance = child;
    if (!performer) return null;
    if (currentPath === path) return { performer, instance, path, parentPath, index, source, templateOwnerId, templatePath };
  }
  return null;
}

export function updateHierarchyInstance(root, records, path, nextInstance) {
  const byId = indexMap(records);
  const parts = path.split('/').slice(1).map(Number);
  const update = (definition, instance, depth) => {
    const children = [...resolvePerformerChildren(definition, instance)];
    const index = parts[depth];
    if (!children[index]) return children;
    if (depth === parts.length - 1) children[index] = nextInstance;
    else {
      const child = children[index];
      const childDefinition = byId.get(child.definition_id);
      children[index] = { ...child, children_mode: 'override', children: update(childDefinition, child, depth + 1) };
    }
    return children;
  };
  return update(root, null, 0);
}

export function breakHierarchyInstance(root, records, path) {
  const byId = indexMap(records);
  const node = findHierarchyNode(root, records, path);
  if (!node?.instance) return null;
  const materialize = (definition, instance, trail = new Set()) => resolvePerformerChildren(definition, instance).map(child => {
    const childDefinition = byId.get(child.definition_id);
    if (!childDefinition || trail.has(child.definition_id)) return { ...child, children_mode: 'override', children: [] };
    return { ...child, children_mode: 'override', children: materialize(childDefinition, child, new Set(trail).add(child.definition_id)) };
  });
  const broken = { ...node.instance, children_mode: 'override', children: materialize(node.performer, node.instance, new Set([node.performer.performer_id])) };
  return updateHierarchyInstance(root, records, path, broken);
}

export function moveHierarchyNode(root, records, sourcePath, targetPath, placement) {
  if (sourcePath === 'root' || targetPath.startsWith(`${sourcePath}/`)) return null;
  const byId = indexMap(records);
  const expand = (definition, instance, path, trail = new Set()) => resolvePerformerChildren(definition, instance).map((child, index) => {
    const key = `${path}/${index}`;
    const childDefinition = byId.get(child.definition_id);
    const cycle = trail.has(child.definition_id);
    return { ...child, __key: key, children: cycle ? [] : expand(childDefinition, child, key, new Set(trail).add(child.definition_id)) };
  });
  const tree = { __key: 'root', children: expand(root, null, 'root', new Set([root.performer_id])) };
  const locate = (node, key) => node.__key === key ? node : node.children?.map(child => locate(child, key)).find(Boolean);
  const parentOf = (node, key) => node.children?.some(child => child.__key === key) ? node : node.children?.map(child => parentOf(child, key)).find(Boolean);
  const sourceParent = parentOf(tree, sourcePath);
  const sourceIndex = sourceParent?.children.findIndex(child => child.__key === sourcePath) ?? -1;
  if (sourceIndex < 0) return null;
  const [moved] = sourceParent.children.splice(sourceIndex, 1);
  const target = locate(tree, targetPath);
  if (!target) return null;
  if (placement === 'inside') target.children.push(moved);
  else {
    const targetParent = parentOf(tree, targetPath);
    if (!targetParent) return null;
    const targetIndex = targetParent.children.findIndex(child => child.__key === targetPath);
    targetParent.children.splice(targetIndex + (placement === 'after' ? 1 : 0), 0, moved);
  }
  let movedPath = null;
  const clean = (node, path) => {
    if (node.__key === moved.__key) movedPath = path;
    const { __key, ...value } = node;
    return { ...value, children_mode: 'override', children: (node.children || []).map((child, index) => clean(child, `${path}/${index}`)) };
  };
  return { children: tree.children.map((child, index) => clean(child, `root/${index}`)), movedPath };
}