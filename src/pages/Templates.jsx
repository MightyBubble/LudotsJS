import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, BookTemplate, Trash2, Star } from "lucide-react";

export default function Templates() {
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['tagTemplates'],
    queryFn: () => base44.entities.TagTemplate.list(),
    initialData: [],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tagTemplates'] });

  const createTemplate = useMutation({
    mutationFn: () => base44.entities.TagTemplate.create({
      template_name: `新模板 ${templates.length + 1}`,
      description: '',
      usage_count: 0,
      is_favorite: false,
    }),
    onSuccess: invalidate,
  });
  const deleteTemplate = useMutation({
    mutationFn: (id) => base44.entities.TagTemplate.delete(id),
    onSuccess: invalidate,
  });
  const toggleFavorite = useMutation({
    mutationFn: ({ id, isFavorite }) => base44.entities.TagTemplate.update(id, { is_favorite: !isFavorite }),
    onSuccess: invalidate,
  });

  return (
    <div className="h-full overflow-auto bg-[#0D0F14] text-white">
      <div className="h-10 bg-[#15171C] border-b border-[#2A2E37] flex items-center px-4 gap-3">
        <BookTemplate className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-300">标签模板</span>
        <span className="text-xs text-gray-500">快速创建常用的标签结构</span>
        <div className="flex-1" />
        <Button onClick={() => createTemplate.mutate()} disabled={createTemplate.isPending}
          className="h-7 text-xs bg-[#D97706] hover:bg-[#B45309]">
          <Plus className="w-3 h-3 mr-1" />新建模板
        </Button>
      </div>

      <div className="p-4">
        {templates.length === 0 ? (
          <p className="text-xs text-gray-500">暂无模板，点击右上角「新建模板」创建。</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {templates.map((t) => (
              <div key={t.id} className="bg-[#15171C] border border-[#2A2E37] rounded p-3 hover:border-[#D97706]">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-[#E2D8B3] truncate">{t.template_name}</p>
                  <button onClick={() => toggleFavorite.mutate({ id: t.id, isFavorite: t.is_favorite })}>
                    <Star className={`w-3.5 h-3.5 ${t.is_favorite ? 'fill-[#D97706] text-[#D97706]' : 'text-gray-500'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 mb-3">{t.description || '暂无描述'}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">使用 {t.usage_count || 0} 次</span>
                  <button onClick={() => deleteTemplate.mutate(t.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}