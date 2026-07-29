// 图的展示标签与出口类型选项（唯一来源）

export const USAGE_LABELS = {
  general: '通用',
  curve: '曲线',
  attribute_calculation: '属性计算',
  validation: '验证',
};

export const DATA_RETURN_TYPES = ['number', 'boolean', 'vector2', 'vector3', 'vector4', 'color'];

export const FUNCTION_RETURN_TYPES = ['void', 'number', 'boolean', 'string', 'array', 'object', 'entity', 'entities'];

export function graphTypeLabel(graph) {
  if (!graph) return '';
  switch (graph.entity_type) {
    case 'DataGraph':
      return `Data (${USAGE_LABELS[graph.usage] || USAGE_LABELS.general})`;
    case 'EntityQuery':
      return 'Entity Query';
    case 'StructureDefinition':
      return 'Structure Definition';
    default:
      return `Function Graph (${graph.return_type || 'void'})`;
  }
}

export function returnTypeOptions(graph) {
  if (!graph) return [];
  if (graph.entity_type === 'DataGraph') return DATA_RETURN_TYPES;
  if (graph.entity_type === 'FunctionGraph') return FUNCTION_RETURN_TYPES;
  return [];
}