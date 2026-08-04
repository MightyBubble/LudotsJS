import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/** 通用记录编辑：列表 + 草稿 + 保存 / 新建 / 删除 */
export default function useRecordEditor(entityName, queryKey, buildNew, prepareSave = data => data, listLimit = 500) {
  const entity = base44.entities[entityName];
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);

  const { data: records = [] } = useQuery({
    queryKey: [queryKey],
    queryFn: () => entity.list('-updated_date', listLimit),
    initialData: [],
  });

  useEffect(() => {
    if (!selectedId) { setDraft(null); return; }
    const rec = records.find(r => r.id === selectedId);
    if (rec && (!draft || draft.id !== selectedId)) { setDraft(rec); setDirty(false); }
  }, [selectedId, records, draft]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const createMutation = useMutation({
    mutationFn: () => entity.create(buildNew()),
    onSuccess: (rec) => { invalidate(); setSelectedId(rec.id); setDraft(rec); setDirty(false); },
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const { id, created_date, updated_date, created_by_id, created_by, ...data } = draft;
      return entity.update(id, prepareSave(data));
    },
    onSuccess: () => { invalidate(); setDirty(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => entity.delete(id),
    onSuccess: (_, id) => { invalidate(); if (id === selectedId) { setSelectedId(null); setDraft(null); } },
  });

  const patch = useCallback((p) => { setDraft(prev => ({ ...prev, ...p })); setDirty(true); }, []);

  return {
    records, selectedId, setSelectedId, draft, patch, dirty,
    create: () => createMutation.mutate(),
    save: () => saveMutation.mutate(),
    remove: (id) => deleteMutation.mutate(id),
  };
}