import React from "react";
import { Tag, Layers, TrendingUp, Lock } from "lucide-react";

export default function TagStatsCards({ tags, className = "" }) {
  const totalTags = tags.length;
  const maxDepth = Math.max(...tags.map(t => t.depth || 0), 0);
  const lockedTags = tags.filter(t => t.is_locked).length;
  const totalUsage = tags.reduce((sum, t) => sum + (t.usage_count || 0), 0);

  const stats = [
    {
      label: "总标签数",
      value: totalTags,
      icon: Tag,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      label: "最大深度",
      value: maxDepth,
      icon: Layers,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      label: "总使用次数",
      value: totalUsage,
      icon: TrendingUp,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      label: "锁定标签",
      value: lockedTags,
      icon: Lock,
      gradient: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className={`grid grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, index) => (
        <div
          key={index}
          className="glass-effect rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">{stat.label}</span>
            <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} bg-opacity-20`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}