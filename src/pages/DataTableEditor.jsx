import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit3, Trash2, Table, X, Save } from "lucide-react";
import AssetBrowserPanel from "@/components/assetBrowser/AssetBrowserPanel";

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataTables'] });
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
    <div className="h-full flex flex-col bg-[#0D0F14] text-white">
      <div className="flex-1 flex overflow-hidden">
        <AssetBrowserPanel
          entityName="DataTable"
          records={tables}
          toItem={(t) => ({ id: t.id, name: t.name, subtitle: `${t.table_id} · ${t.columns.length}列×${t.rows.length}行` })}
          selectedId={selectedTable?.id}
          onSelect={(t) => { setSelectedTable(t); setEditingTable(null); }}
          onCreate={handleCreate}
          onDelete={(t) => { if (window.confirm('确定删除此数据表吗？')) deleteMutation.mutate(t.id); }}
        />

        <div className="flex-1 overflow-auto p-4">
          {editingTable ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={editingTable.table_id}
                  onChange={(e) => setEditingTable({ ...editingTable, table_id: e.target.value })}
                  placeholder="表ID"
                  className="h-8 bg-[#15171C] border-[#2A2E37] text-white"
                />
                <Input
                  value={editingTable.name}
                  onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                  placeholder="表名称"
                  className="h-8 bg-[#15171C] border-[#2A2E37] text-white"
                />
                <Button onClick={handleSave} className="bg-[#D97706] hover:bg-[#B45309]">
                  <Save className="w-4 h-4 mr-1" />
                  保存
                </Button>
                <Button onClick={() => setEditingTable(null)} variant="outline" className="border-[#2A2E37]">
                  取消
                </Button>
              </div>

              <div className="border border-[#2A2E37] rounded overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#15171C] sticky top-0">
                    <tr>
                      <th className="text-left p-2 w-12 border-r border-[#2A2E37]">#</th>
                      {editingTable.columns.map((col, idx) => (
                        <th key={idx} className="text-left p-2 border-r border-[#2A2E37] min-w-[150px]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Input
                                value={col.name}
                                onChange={(e) => {
                                  const oldName = col.name;
                                  const newName = e.target.value;
                                  const newCols = [...editingTable.columns];
                                  newCols[idx] = { ...col, name: newName };
                                  const newRows = editingTable.rows.map(row => {
                                    const { [oldName]: val, ...rest } = row;
                                    return { ...rest, [newName]: val };
                                  });
                                  setEditingTable({ ...editingTable, columns: newCols, rows: newRows });
                                }}
                                className="h-5 bg-[#0D0F14] border-[#2A2E37] text-white flex-1"
                              />
                              <button
                                onClick={() => handleRemoveColumn(idx)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <Select
                              value={col.type}
                              onValueChange={(v) => {
                                const newCols = [...editingTable.columns];
                                newCols[idx] = { ...col, type: v };
                                setEditingTable({ ...editingTable, columns: newCols });
                              }}
                            >
                              <SelectTrigger className="h-5 bg-[#0D0F14] border-[#2A2E37] text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                <SelectItem value="string" className="text-white">文本</SelectItem>
                                <SelectItem value="number" className="text-white">数字</SelectItem>
                                <SelectItem value="boolean" className="text-white">布尔</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </th>
                      ))}
                      <th className="text-left p-2 w-20">
                        <Button size="sm" onClick={handleAddColumn} className="h-5 px-2 bg-[#1E2128] hover:bg-[#2A2E37]">
                          <Plus className="w-3 h-3" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {editingTable.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-t border-[#2A2E37] hover:bg-[#15171C]">
                        <td className="p-2 border-r border-[#2A2E37] text-gray-400">{rowIdx}</td>
                        {editingTable.columns.map((col, colIdx) => (
                          <td key={colIdx} className="p-2 border-r border-[#2A2E37]">
                            {col.type === "boolean" ? (
                              <Select
                                value={String(row[col.name])}
                                onValueChange={(v) => handleCellChange(rowIdx, col.name, v)}
                              >
                                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                  <SelectItem value="true" className="text-white">true</SelectItem>
                                  <SelectItem value="false" className="text-white">false</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={col.type === "number" ? "number" : "text"}
                                value={row[col.name] ?? ""}
                                onChange={(e) => handleCellChange(rowIdx, col.name, e.target.value)}
                                className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white"
                              />
                            )}
                          </td>
                        ))}
                        <td className="p-2">
                          <button
                            onClick={() => handleRemoveRow(rowIdx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button onClick={handleAddRow} className="bg-[#1E2128] hover:bg-[#2A2E37]">
                <Plus className="w-4 h-4 mr-1" />
                添加行
              </Button>
            </div>
          ) : selectedTable ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTable.name}</h2>
                  <p className="text-sm text-gray-400">{selectedTable.table_id}</p>
                  {selectedTable.description && (
                    <p className="text-sm text-gray-500 mt-1">{selectedTable.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleEditHeader(selectedTable)} className="bg-[#D97706] hover:bg-[#B45309]">
                    <Edit3 className="w-4 h-4 mr-1" />
                    编辑表头
                  </Button>
                  <Button
                    onClick={() => handleAddRowToTable(selectedTable)}
                    className="bg-[#1E2128] hover:bg-[#2A2E37]"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    添加行
                  </Button>
                  <Button
                    onClick={() => {
                      if (window.confirm('确定删除此数据表吗？')) {
                        deleteMutation.mutate(selectedTable.id);
                      }
                    }}
                    className="bg-red-900/50 hover:bg-red-900"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    删除
                  </Button>
                </div>
              </div>

              <div className="border border-[#2A2E37] rounded overflow-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#15171C]">
                    <tr>
                      <th className="text-left p-2 border-r border-[#2A2E37] w-12">#</th>
                      {selectedTable.columns.map((col, idx) => (
                        <th key={idx} className="text-left p-2 border-r border-[#2A2E37] min-w-[150px]">
                          {col.name} <span className="text-gray-500">({col.type})</span>
                        </th>
                      ))}
                      <th className="text-left p-2 w-20">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTable.rows.map((row, rowIdx) => (
                      <tr key={rowIdx} className="border-t border-[#2A2E37] hover:bg-[#15171C]">
                        <td className="p-2 border-r border-[#2A2E37] text-gray-400">{rowIdx}</td>
                        {selectedTable.columns.map((col, colIdx) => (
                          <td key={colIdx} className="p-2 border-r border-[#2A2E37]">
                            {col.type === "boolean" ? (
                              <Select
                                value={String(row[col.name])}
                                onValueChange={(v) => handleCellEdit(selectedTable.id, rowIdx, col.name, v)}
                              >
                                <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                                  <SelectItem value="true" className="text-white">true</SelectItem>
                                  <SelectItem value="false" className="text-white">false</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={col.type === "number" ? "number" : "text"}
                                value={row[col.name] ?? ""}
                                onChange={(e) => handleCellEdit(selectedTable.id, rowIdx, col.name, e.target.value)}
                                className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white"
                              />
                            )}
                          </td>
                        ))}
                        <td className="p-2">
                          <button
                            onClick={() => {
                              if (window.confirm('确定删除此行吗？')) {
                                handleRemoveRowFromTable(selectedTable, rowIdx);
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              选择或创建一个数据表
            </div>
          )}
        </div>
      </div>
    </div>
  );
}