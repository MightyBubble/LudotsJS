import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";
import AssetBrowserPanel from "@/components/assetBrowser/AssetBrowserPanel";
import ConstantRowsGrid from "@/components/constant/ConstantRowsGrid";
import { useConstantTables, makeConstantTable } from "@/lib/useConstants";

/** 常量表：DataTable 的 constant 类型，可存在多张表 */
export default function GlobalConstantEditorPage() {
  const queryClient = useQueryClient();
  const tables = useConstantTables();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);

  const selected = tables.find(t => t.id === selectedId) || null;

  useEffect(() => {
    setDraft(selected ? { ...selected } : null);
  }, [selectedId, selected?.updated_date]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dataTables'] });

  const createMutation = useMutation({
    mutationFn: () => base44.entities.DataTable.create(makeConstantTable()),
    onSuccess: (rec) => { invalidate(); setSelectedId(rec.id); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DataTable.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.DataTable.delete(id),
    onSuccess: () => { invalidate(); setSelectedId(null); },
  });

  const handleSave = () => {
    if (!draft) return;
    updateMutation.mutate({
      id: draft.id,
      data: {
        table_id: draft.table_id,
        name: draft.name,
        description: draft.description || "",
        table_type: 'constant',
        columns: draft.columns,
        rows: draft.rows || [],
      },
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#0D0F14] text-white">
      <div className="flex-1 flex overflow-hidden">
        <AssetBrowserPanel
          entityName="DataTable"
          records={tables}
          toItem={(t) => ({ id: t.id, name: t.name, subtitle: `${t.table_id} · ${(t.rows || []).length} 个常量` })}
          selectedId={selectedId}
          onSelect={(t) => setSelectedId(t.id)}
          onCreate={() => createMutation.mutate()}
          onDelete={(t) => { if (window.confirm('确定删除此常量表吗？')) deleteMutation.mutate(t.id); }}
        />

        <div className="flex-1 overflow-auto p-4">
          {draft ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  value={draft.table_id}
                  onChange={(e) => setDraft({ ...draft, table_id: e.target.value })}
                  placeholder="表ID"
                  className="h-8 w-48 bg-[#15171C] border-[#2A2E37] text-white"
                />
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="表名称"
                  className="h-8 w-48 bg-[#15171C] border-[#2A2E37] text-white"
                />
                <Input
                  value={draft.description || ''}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="描述"
                  className="h-8 flex-1 bg-[#15171C] border-[#2A2E37] text-white"
                />
                <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-8 px-3 bg-[#D97706] hover:bg-[#B45309] text-xs">
                  <Save className="w-3 h-3 mr-1" />保存
                </Button>
              </div>

              <ConstantRowsGrid rows={draft.rows || []} onChange={(rows) => setDraft({ ...draft, rows })} />
              <p className="text-[11px] text-gray-500">常量键在所有常量表中应保持唯一，引用处按键名取值。</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">从左侧选择或新建一张常量表</div>
          )}
        </div>
      </div>
    </div>
  );
}