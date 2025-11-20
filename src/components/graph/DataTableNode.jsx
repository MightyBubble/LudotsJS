import React, { useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Node from './Node';
import { Table } from 'lucide-react';

export default function DataTableNode({ node, onUpdateData, onUpdateNode, ...otherProps }) {
  const { data: tables = [] } = useQuery({
    queryKey: ['dataTables'],
    queryFn: () => base44.entities.DataTable.list(),
    initialData: [],
  });

  const selectedTable = tables.find(t => t.table_id === node.data?.table_id);
  const readMode = node.data?.read_mode || 'cell';

  // 动态更新端口
  useEffect(() => {
    if (!selectedTable) return;

    let inputs = [];
    let outputs = [];

    switch (readMode) {
      case 'cell':
        inputs = [{ id: 'row_index', label: '行索引', type: 'number' }];
        const col = selectedTable.columns.find(c => c.name === node.data?.column_name);
        outputs = [{ id: 'value', label: '值', type: col?.type || 'any' }];
        break;
      case 'row':
        inputs = [{ id: 'row_index', label: '行索引', type: 'number' }];
        outputs = [{ id: 'row', label: '行对象', type: 'object' }];
        break;
      case 'column':
        inputs = [];
        const colType = selectedTable.columns.find(c => c.name === node.data?.column_name)?.type;
        outputs = [{ id: 'values', label: `${colType}数组`, type: 'array' }];
        break;
      case 'all_rows':
        inputs = [];
        outputs = [{ id: 'rows', label: '所有行', type: 'array' }];
        break;
    }

    onUpdateNode(node.id, { 
      ...node, 
      inputs, 
      outputs 
    });
  }, [readMode, selectedTable, node.data?.column_name]);

  const modeDescriptions = {
    cell: '读取指定行的指定列的值',
    row: '读取指定行的所有列数据',
    column: '读取指定列的所有行数据',
    all_rows: '读取所有行的所有列数据'
  };

  return (
    <Node node={node} {...otherProps}>
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Table className="w-3 h-3 text-gray-400" />
          <span className="text-xs font-semibold text-gray-300">读取数据表</span>
        </div>
        
        <div>
          <label className="text-xs text-gray-400 block mb-1">数据表</label>
          <Select
            value={node.data?.table_id || ""}
            onValueChange={(v) => {
              const table = tables.find(t => t.table_id === v);
              onUpdateData(node.id, { 
                table_id: v,
                read_mode: readMode,
                column_name: table?.columns[0]?.name || ""
              });
            }}
          >
            <SelectTrigger className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs">
              <SelectValue placeholder="选择表" />
            </SelectTrigger>
            <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
              {tables.map(t => (
                <SelectItem key={t.id} value={t.table_id} className="text-white text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTable && (
          <>
            <div>
              <label className="text-xs text-gray-400 block mb-1">读取模式</label>
              <Select
                value={readMode}
                onValueChange={(v) => onUpdateData(node.id, { ...node.data, read_mode: v })}
              >
                <SelectTrigger className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                  <SelectItem value="cell" className="text-white text-xs">单元格</SelectItem>
                  <SelectItem value="row" className="text-white text-xs">整行</SelectItem>
                  <SelectItem value="column" className="text-white text-xs">整列</SelectItem>
                  <SelectItem value="all_rows" className="text-white text-xs">所有行</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(readMode === 'cell' || readMode === 'column') && (
              <div>
                <label className="text-xs text-gray-400 block mb-1">列</label>
                <Select
                  value={node.data?.column_name || ""}
                  onValueChange={(v) => onUpdateData(node.id, { ...node.data, column_name: v })}
                >
                  <SelectTrigger className="h-6 bg-[#2d2d2d] border-[#3d3d3d] text-white text-xs">
                    <SelectValue placeholder="选择列" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2d2d2d] border-[#3d3d3d]">
                    {selectedTable.columns.map(c => (
                      <SelectItem key={c.name} value={c.name} className="text-white text-xs">
                        {c.name} ({c.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="text-xs text-gray-500 mt-2 p-2 bg-[#1e1e1e] rounded">
              {modeDescriptions[readMode]}
            </div>
          </>
        )}
      </div>
    </Node>
  );
}