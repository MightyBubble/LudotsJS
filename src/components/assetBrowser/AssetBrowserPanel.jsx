import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import AssetTree from "./AssetTree";
import useEditorMeta from "./useEditorMeta";

/**
 * 统一的左侧资产浏览器：搜索 + 新建 + 虚拟目录文件树。
 * records: 业务记录数组；toItem(record) → { id, name, subtitle }
 */
export default function AssetBrowserPanel({
  entityName, records, toItem, selectedId, onSelect, onOpen, onCreate, onDelete, children, hideSearch = false,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const { metaByRecord, getCategory, setCategory, toggleFavorite } = useEditorMeta(entityName);

  const items = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records
      .map(r => {
        const base = toItem(r);
        return {
          ...base,
          record: r,
          categoryPath: base.categoryPath || getCategory(r.id),
          isFavorite: !!metaByRecord[r.id]?.is_favorite,
        };
      })
      .filter(i => !q || `${i.name} ${i.subtitle || ""}`.toLowerCase().includes(q));
  }, [records, searchQuery, metaByRecord, toItem, getCategory]);

  return (
    <div className="w-64 bg-[#15171C] border-r border-[#2A2E37] flex flex-col flex-shrink-0">
      {(!hideSearch || onCreate) && (
        <div className="p-2 border-b border-[#2A2E37] flex gap-2">
          {!hideSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
              <Input
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
              />
            </div>
          )}
          {onCreate && (
            <Button size="sm" onClick={onCreate} className="h-7 px-2.5 gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-black text-xs">
              <Plus className="w-3 h-3" />
              新建
            </Button>
          )}
        </div>
      )}

      {children}

      <div className="flex-1 overflow-y-auto p-1">
        <AssetTree
          items={items}
          selectedId={selectedId}
          onSelect={(item) => onSelect(item.record)}
          onOpen={onOpen ? (item) => onOpen(item.record) : undefined}
          onSetCategory={(item, path) => setCategory(item.record.id, path)}
          onToggleFavorite={(item) => toggleFavorite(item.record.id)}
          onDelete={onDelete ? (item) => onDelete(item.record) : undefined}
        />
      </div>
    </div>
  );
}