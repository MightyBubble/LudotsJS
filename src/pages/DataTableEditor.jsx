import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit3, Trash2, Table, X, Save } from "lucide-react";
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import { Section } from '@/components/ludots/ui';

export default function DataTableEditorPage() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [editingTable, setEditingTable] = useState(null);

  const queryClient = useQueryClient();

  const { data: allTables = [] } = useQuery({
    queryKey: ['dataTables'],
    queryFn: () => base44.entities.DataTable.list(),
    initialData: [],
  });

  // 常量表在「常量表」页面单独管理
  const tables = allTables.filter(t => t.table_type !== 'constant');

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.DataTable.create(data),
    onSuccess: (record) => {
      queryClient.invalidateQueries({ queryKey: ['dataTables'] });
      setSelectedTable(record);
      setEditingTable({ ...record });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DataTable.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dataTables'] });
      setEditingTable(null);
      if (selectedTable?.id === variables.id) {
        setSelectedTable({ ...selectedTable, ...variables.data });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DataTable.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataTables'] });
      setSelectedTable(null);
    },
  });

  const handleCreate = () => {
    const newTable = {
      table_id: "new_table",
      name: "新数据表",
      description: "",
      table_type: "data",
      columns: [{ name: "column1", type: "string" }],
      rows: [{ column1: "" }]
    };
    createMutation.mutate(newTable);
  };

  const handleEditHeader = (table) => {
    setEditingTable({ ...table });
  };

  const handleCellEdit = (tableId, rowIndex, colName, value) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const col = table.columns.find(c => c.name === colName);
    let parsedValue = value;
    
    if (col.type === "number") {
      parsedValue = parseFloat(value) || 0;
    } else if (col.type === "boolean") {
      parsedValue = value === "true" || value === true;
    }
    
    const newRows = [...table.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [colName]: parsedValue };
    
    updateMutation.mutate({ id: tableId, data: { ...table, rows: newRows } });
  };

  const handleAddRowToTable = (table) => {
    const newRow = {};
    table.columns.forEach(col => {
      newRow[col.name] = col.type === "number" ? 0 : col.type === "boolean" ? false : "";
    });
    updateMutation.mutate({ 
      id: table.id, 
      data: { ...table, rows: [...table.rows, newRow] } 
    });
  };

  const handleRemoveRowFromTable = (table, rowIndex) => {
    updateMutation.mutate({ 
      id: table.id, 
      data: { ...table, rows: table.rows.filter((_, i) => i !== rowIndex) } 
    });
  };

  const handleSave = () => {
    if (!editingTable) return;
    updateMutation.mutate({ id: editingTable.id, data: editingTable });
  };

  const handleAddColumn = () => {
    const newColName = `column${editingTable.columns.length + 1}`;
    setEditingTable({
      ...editingTable,
      columns: [...editingTable.columns, { name: newColName, type: "string" }],
      rows: editingTable.rows.map(row => ({ ...row, [newColName]: "" }))
    });
  };

  const handleRemoveColumn = (index) => {
    const colName = editingTable.columns[index].name;
    setEditingTable({
      ...editingTable,
      columns: editingTable.columns.filter((_, i) => i !== index),
      rows: editingTable.rows.map(row => {
        const { [colName]: removed, ...rest } = row;
        return rest;
      })
    });
  };

  const handleAddRow = () => {
    const newRow = {};
    editingTable.columns.forEach(col => {
      newRow[col.name] = col.type === "number" ? 0 : col.type === "boolean" ? false : "";
    });
    setEditingTable({
      ...editingTable,
      rows: [...editingTable.rows, newRow]
    });
  };

  const handleRemoveRow = (index) => {
    setEditingTable({
      ...editingTable,
      rows: editingTable.rows.filter((_, i) => i !== index)
    });
  };

  const handleCellChange = (rowIndex, colName, value) => {
    const col = editingTable.columns.find(c => c.name === colName);
    let parsedValue = value;
    
    if (col.type === "number") {
      parsedValue = parseFloat(value) || 0;
    } else if (col.type === "boolean") {
      parsedValue = value === "true" || value === true;
    }
    
    const newRows = [...editingTable.rows];
    newRows[rowIndex] = { ...newRows[rowIndex], [colName]: parsedValue };
    setEditingTable({ ...editingTable, rows: newRows });
  };

  return (
    <RecordWorkspace
      entityName="DataTable"
      records={tables}
      toItem={(table) => ({ id: table.id, name: table.name, subtitle: `${table.table_id} · ${(table.columns || []).length} 列 × ${(table.rows || []).length} 行` })}
      columns={[
        { key: 'table_id', label: '数据表 ID', width: 220, render: (table) => <span className="font-mono text-[#E2D8B3]">{table.table_id}</span> },
        { key: 'name', label: '名称', width: 180 },
        { key: 'description', label: '描述' },
        { key: 'columns', label: '列数', width: 80, render: (table) => (table.columns || []).length },
        { key: 'rows', label: '行数', width: 80, render: (table) => (table.rows || []).length },
      ]}
      selectedId={selectedTable?.id}
      onSelect={(table) => { setSelectedTable(table); setEditingTable({ ...table, columns: table.columns || [], rows: table.rows || [] }); }}
      onCreate={handleCreate}
      onDelete={(table) => window.confirm('确定删除此数据表吗？') && deleteMutation.mutate(table.id)}
      onSave={handleSave}
      dirty={Boolean(editingTable)}
    >
      {editingTable && (
        <div className="max-w-6xl">
          <Section title="数据表信息">
            <div className="grid grid-cols-3 gap-3">
              <Input value={editingTable.table_id} onChange={(e) => setEditingTable({ ...editingTable, table_id: e.target.value })} placeholder="表 ID" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
              <Input value={editingTable.name} onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })} placeholder="表名称" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
              <Input value={editingTable.description || ''} onChange={(e) => setEditingTable({ ...editingTable, description: e.target.value })} placeholder="描述" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
            </div>
          </Section>
          <Section title="列与数据">
            <div className="border border-[#2A2E37] rounded overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#15171C] sticky top-0"><tr><th className="text-left p-2 w-12">#</th>{editingTable.columns.map((column, columnIndex) => <th key={columnIndex} className="text-left p-2 min-w-[160px] border-l border-[#2A2E37]"><div className="flex gap-1"><Input value={column.name} onChange={(e) => { const oldName = column.name; const name = e.target.value; const columns = [...editingTable.columns]; columns[columnIndex] = { ...column, name }; const rows = editingTable.rows.map(row => { const { [oldName]: value, ...rest } = row; return { ...rest, [name]: value }; }); setEditingTable({ ...editingTable, columns, rows }); }} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" /><Select value={column.type} onValueChange={(type) => { const columns = [...editingTable.columns]; columns[columnIndex] = { ...column, type }; setEditingTable({ ...editingTable, columns }); }}><SelectTrigger className="h-7 w-24 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]"><SelectItem value="string">文本</SelectItem><SelectItem value="number">数字</SelectItem><SelectItem value="boolean">布尔</SelectItem></SelectContent></Select><Button size="sm" variant="ghost" onClick={() => handleRemoveColumn(columnIndex)} className="h-7 text-red-400"><X className="w-3 h-3" /></Button></div></th>)}<th className="p-2 w-24"><Button size="sm" onClick={handleAddColumn} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />列</Button></th></tr></thead>
                <tbody>{editingTable.rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-[#2A2E37]"><td className="p-2 text-gray-500">{rowIndex + 1}</td>{editingTable.columns.map((column, columnIndex) => <td key={columnIndex} className="p-2 border-l border-[#2A2E37]">{column.type === 'boolean' ? <Select value={String(row[column.name] ?? false)} onValueChange={(value) => handleCellChange(rowIndex, column.name, value)}><SelectTrigger className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-[#15171C] border-[#2A2E37]"><SelectItem value="true">true</SelectItem><SelectItem value="false">false</SelectItem></SelectContent></Select> : <Input type={column.type === 'number' ? 'number' : 'text'} value={row[column.name] ?? ''} onChange={(e) => handleCellChange(rowIndex, column.name, e.target.value)} className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />}</td>)}<td className="p-2"><Button size="sm" variant="ghost" onClick={() => handleRemoveRow(rowIndex)} className="h-7 text-red-400"><Trash2 className="w-3 h-3" /></Button></td></tr>)}</tbody>
              </table>
            </div>
            <Button size="sm" onClick={handleAddRow} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加行</Button>
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}