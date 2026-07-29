import { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * 读取/写入某个实体的编辑器元数据（虚拟目录、收藏、排序）。
 * 元数据与业务实体解耦，存在 EditorMeta 里，按 entity_name + record_id 关联。
 */
export default function useEditorMeta(entityName) {
  const queryClient = useQueryClient();

  const { data: metas = [] } = useQuery({
    queryKey: ['editorMeta', entityName],
    queryFn: () => base44.entities.EditorMeta.filter({ entity_name: entityName }),
    initialData: [],
  });

  const metaByRecord = useMemo(() => {
    const map = {};
    metas.forEach(m => { map[m.record_id] = m; });
    return map;
  }, [metas]);

  const mutation = useMutation({
    mutationFn: async ({ recordId, patch }) => {
      const existing = metaByRecord[recordId];
      if (existing) return base44.entities.EditorMeta.update(existing.id, patch);
      return base44.entities.EditorMeta.create({ entity_name: entityName, record_id: recordId, ...patch });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['editorMeta', entityName] }),
  });

  const categories = useMemo(() => {
    const set = new Set();
    metas.forEach(m => { if (m.category_path) set.add(m.category_path); });
    return [...set].sort();
  }, [metas]);

  return {
    metaByRecord,
    categories,
    getCategory: (recordId) => metaByRecord[recordId]?.category_path || "",
    setCategory: (recordId, category_path) => mutation.mutate({ recordId, patch: { category_path } }),
    toggleFavorite: (recordId) => mutation.mutate({ recordId, patch: { is_favorite: !metaByRecord[recordId]?.is_favorite } }),
  };
}