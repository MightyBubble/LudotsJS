import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import { Section } from '@/components/ludots/ui';
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
    <RecordWorkspace
      entityName="GlobalConstants"
      records={tables}
      toItem={(table) => ({ id: table.id, name: table.name, subtitle: `${table.table_id} · ${(table.rows || []).length} 个常量` })}
      columns={[
        { key: 'table_id', label: '常量表 ID', width: 220, render: (table) => <span className="font-mono text-[#E2D8B3]">{table.table_id}</span> },
        { key: 'name', label: '名称', width: 180 },
        { key: 'description', label: '描述' },
        { key: 'rows', label: '常量数量', width: 110, render: (table) => (table.rows || []).length },
      ]}
      selectedId={selectedId}
      onSelect={(table) => setSelectedId(table.id)}
      onCreate={() => createMutation.mutate()}
      onDelete={(table) => window.confirm('确定删除此常量表吗？') && deleteMutation.mutate(table.id)}
      onSave={handleSave}
      dirty={Boolean(draft)}
    >
      {draft && (
        <div className="max-w-5xl">
          <Section title="常量表信息">
            <div className="grid grid-cols-3 gap-3">
              <Input value={draft.table_id} onChange={(e) => setDraft({ ...draft, table_id: e.target.value })} placeholder="表 ID" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
              <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="表名称" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
              <Input value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="描述" className="h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white" />
            </div>
          </Section>
          <Section title="常量行">
            <ConstantRowsGrid rows={draft.rows || []} onChange={(rows) => setDraft({ ...draft, rows })} />
            <p className="text-[11px] text-gray-500">常量键在所有常量表中应保持唯一，引用处按键名取值。</p>
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}