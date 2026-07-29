import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const CONSTANT_COLUMNS = [
  { name: 'key', type: 'string' },
  { name: 'type', type: 'string' },
  { name: 'value', type: 'string' },
  { name: 'description', type: 'string' },
];

export const makeConstantTable = () => ({
  table_id: 'new_constants',
  name: '新常量表',
  description: '',
  table_type: 'constant',
  columns: CONSTANT_COLUMNS,
  rows: [],
});

/** 常量表（DataTable 中 table_type = constant 的记录） */
export function useConstantTables() {
  const { data: tables = [] } = useQuery({
    queryKey: ['dataTables'],
    queryFn: () => base44.entities.DataTable.list(),
    initialData: [],
  });
  return useMemo(() => tables.filter(t => t.table_type === 'constant'), [tables]);
}

/**
 * 全部常量表拍平成常量列表（键在全局唯一），
 * 形状与旧 GlobalConstant 记录保持一致，便于各处引用不变。
 */
export default function useConstants() {
  const constantTables = useConstantTables();
  return useMemo(
    () =>
      constantTables.flatMap(t =>
        (t.rows || []).map((r, idx) => ({
          id: `${t.id}:${idx}`,
          table_id: t.table_id,
          constant_key: r.key,
          value_type: r.type || 'number',
          constant_value: r.value ?? '',
          description: r.description || '',
        })),
      ),
    [constantTables],
  );
}