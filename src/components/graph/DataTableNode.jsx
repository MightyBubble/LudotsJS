import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Node from './Node';
import { Table } from 'lucide-react';

export default function DataTableNode({ node, onUpdateData, ...otherProps }) {
  const { data: tables = [] } = useQuery({
    queryKey: ['dataTables'],
    queryFn: () => base44.entities.DataTable.list(),
    initialData: [],
  });

  const selectedTable = tables.find(t => t.table_id === node.data?.table_id);

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

        {node.data?.table_id && node.data?.column_name && (
          <div className="text-xs text-gray-500 mt-2">
            读取: {node.data.table_id}[行索引].{node.data.column_name}
          </div>
        )}
      </div>
    </Node>
  );
}