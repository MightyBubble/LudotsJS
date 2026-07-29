import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon, Plus, Edit3, Trash2, Move, FileText } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function History() {
  const { data: history = [] } = useQuery({
    queryKey: ['tagHistory'],
    queryFn: () => base44.entities.TagHistory.list('-created_date'),
    initialData: [],
  });

  const actionIcons = {
    create: { icon: Plus, color: "text-green-400", bg: "bg-green-500/20" },
    update: { icon: Edit3, color: "text-blue-400", bg: "bg-blue-500/20" },
    delete: { icon: Trash2, color: "text-red-400", bg: "bg-red-500/20" },
    move: { icon: Move, color: "text-purple-400", bg: "bg-purple-500/20" },
    rename: { icon: FileText, color: "text-yellow-400", bg: "bg-yellow-500/20" },
  };

  const actionLabels = {
    create: "创建",
    update: "更新",
    delete: "删除",
    move: "移动",
    rename: "重命名",
  };

  return (
    <div className="h-full overflow-auto bg-[#0D0F14] text-[#e5e5e5] p-4">
      <div className="max-w-5xl mx-auto">
        {history.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-gray-500">
            <HistoryIcon className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">暂无历史记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((record) => {
              const actionConfig = actionIcons[record.action_type] || actionIcons.update;
              const ActionIcon = actionConfig.icon;
              return (
                <div key={record.id} className="rounded border border-[#2A2E37] bg-[#15171C] p-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${actionConfig.bg}`}><ActionIcon className={`w-4 h-4 ${actionConfig.color}`} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-gray-300 border-[#2A2E37]">{actionLabels[record.action_type]}</Badge>
                        <span className="text-xs text-gray-500">{record.created_date && format(new Date(record.created_date), "yyyy-MM-dd HH:mm:ss")}</span>
                      </div>
                      <div className="text-sm text-gray-200 font-mono">{record.tag_path}</div>
                      {record.description && <p className="text-xs text-gray-500 mt-1">{record.description}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}