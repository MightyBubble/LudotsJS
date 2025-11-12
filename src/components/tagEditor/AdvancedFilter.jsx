import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Filter } from "lucide-react";

export default function AdvancedFilter({ filters, onFilterChange, onClearFilters }) {
  const hasActiveFilters = filters.category !== 'all' || 
                          filters.depth !== 'all' || 
                          filters.isLocked !== 'all' ||
                          filters.minUsage > 0;

  return (
    <div className="p-4 bg-[#252526] border border-[#3d3d3d] rounded space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-300">高级筛选</h3>
        </div>
        {hasActiveFilters && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearFilters}
            className="h-6 px-2 text-xs text-gray-400 hover:text-gray-200"
          >
            <X className="w-3 h-3 mr-1" />
            清除
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {/* 分类筛选 */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">分类</label>
          <Select
            value={filters.category}
            onValueChange={(value) => onFilterChange({ ...filters, category: value })}
          >
            <SelectTrigger className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="ability">能力</SelectItem>
              <SelectItem value="state">状态</SelectItem>
              <SelectItem value="effect">效果</SelectItem>
              <SelectItem value="item">物品</SelectItem>
              <SelectItem value="event">事件</SelectItem>
              <SelectItem value="ui">界面</SelectItem>
              <SelectItem value="audio">音频</SelectItem>
              <SelectItem value="gameplay">玩法</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 层级筛选 */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">层级深度</label>
          <Select
            value={filters.depth}
            onValueChange={(value) => onFilterChange({ ...filters, depth: value })}
          >
            <SelectTrigger className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="0">0 (根级)</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4+">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 锁定状态 */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">锁定状态</label>
          <Select
            value={filters.isLocked}
            onValueChange={(value) => onFilterChange({ ...filters, isLocked: value })}
          >
            <SelectTrigger className="h-8 bg-[#1e1e1e] border-[#3d3d3d] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="true">已锁定</SelectItem>
              <SelectItem value="false">未锁定</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 使用次数筛选 */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">
            最小使用次数 ({filters.minUsage})
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={filters.minUsage}
            onChange={(e) => onFilterChange({ ...filters, minUsage: parseInt(e.target.value) })}
            className="w-full h-2 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: '#0e639c'
            }}
          />
        </div>
      </div>
    </div>
  );
}