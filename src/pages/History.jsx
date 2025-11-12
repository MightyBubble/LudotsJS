import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { History as HistoryIcon, Plus, Edit3, Trash2, Move, FileText } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <HistoryIcon className="w-8 h-8 text-purple-400" />
            操作历史
          </h1>
          <p className="text-gray-400">查看所有标签的操作记录</p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
              <HistoryIcon className="w-12 h-12 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">暂无历史记录</h3>
            <p className="text-gray-400">标签的操作记录会在这里显示</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((record, index) => {
              const actionConfig = actionIcons[record.action_type] || actionIcons.update;
              const ActionIcon = actionConfig.icon;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-effect rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${actionConfig.bg}`}>
                      <ActionIcon className={`w-5 h-5 ${actionConfig.color}`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-white border-white/20">
                          {actionLabels[record.action_type]}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          {record.created_date && format(new Date(record.created_date), "yyyy-MM-dd HH:mm:ss")}
                        </span>
                      </div>

                      <h3 className="font-semibold text-white mb-1">{record.tag_path}</h3>
                      
                      {record.description && (
                        <p className="text-sm text-gray-400">{record.description}</p>
                      )}

                      {record.created_by && (
                        <p className="text-xs text-gray-500 mt-2">操作者: {record.created_by}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}