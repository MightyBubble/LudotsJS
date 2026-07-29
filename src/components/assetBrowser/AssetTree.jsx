import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Star, FolderInput, Trash2 } from "lucide-react";

function buildTree(items) {
  const root = { folders: {}, items: [] };
  items.forEach(item => {
    const parts = (item.categoryPath || "").split("/").map(s => s.trim()).filter(Boolean);
    let node = root;
    parts.forEach(part => {
      node.folders[part] = node.folders[part] || { folders: {}, items: [] };
      node = node.folders[part];
    });
    node.items.push(item);
  });
  return root;
}

function TreeLevel({ node, path, depth, selectedId, onSelect, onOpen, onSetCategory, onToggleFavorite, onDelete, collapsed, toggleFolder }) {
  const folderNames = Object.keys(node.folders).sort();
  return (
    <div>
      {folderNames.map(name => {
        const fullPath = path ? `${path}/${name}` : name;
        const isOpen = !collapsed[fullPath];
        return (
          <div key={fullPath}>
            <button
              onClick={() => toggleFolder(fullPath)}
              className="w-full flex items-center gap-1 px-2 py-1 text-xs text-[#E2D8B3] hover:bg-[#2A2E37] rounded"
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              {isOpen ? <ChevronDown className="w-3 h-3 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 flex-shrink-0" />}
              {isOpen ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" /> : <Folder className="w-3.5 h-3.5 flex-shrink-0" />}
              <span className="truncate">{name}</span>
            </button>
            {isOpen && (
              <TreeLevel
                node={node.folders[name]} path={fullPath} depth={depth + 1}
                selectedId={selectedId} onSelect={onSelect} onOpen={onOpen} onSetCategory={onSetCategory}
                onToggleFavorite={onToggleFavorite} onDelete={onDelete}
                collapsed={collapsed} toggleFolder={toggleFolder}
              />
            )}
          </div>
        );
      })}

      {node.items.map(item => (
        <div
          key={item.id}
          onClick={() => onSelect(item)}
          onDoubleClick={() => onOpen && onOpen(item)}
          title={onOpen ? "双击打开" : undefined}
          className={`group flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs ${selectedId === item.id ? "bg-[#D97706] text-black" : "text-gray-300 hover:bg-[#2A2E37]"}`}
          style={{ paddingLeft: 12 + depth * 12 }}
        >
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{item.name}</div>
            {item.subtitle && <div className={`truncate text-[10px] ${selectedId === item.id ? "opacity-70" : "text-gray-500"}`}>{item.subtitle}</div>}
          </div>
          {item.isFavorite && <Star className="w-3 h-3 flex-shrink-0 text-[#D97706]" />}
          <button
            title="收藏"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
            className="opacity-0 group-hover:opacity-100 hover:text-[#D97706] flex-shrink-0"
          >
            <Star className="w-3 h-3" />
          </button>
          <button
            title="移动到虚拟目录"
            onClick={(e) => {
              e.stopPropagation();
              const next = window.prompt("虚拟目录（用 / 分隔，留空为根目录）", item.categoryPath || "");
              if (next !== null) onSetCategory(item, next.trim());
            }}
            className="opacity-0 group-hover:opacity-100 hover:text-white flex-shrink-0"
          >
            <FolderInput className="w-3 h-3" />
          </button>
          {onDelete && (
            <button
              title="删除"
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400 flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AssetTree({ items, selectedId, onSelect, onOpen, onSetCategory, onToggleFavorite, onDelete }) {
  const [collapsed, setCollapsed] = useState({});
  const tree = useMemo(() => buildTree(items), [items]);
  const toggleFolder = (path) => setCollapsed(prev => ({ ...prev, [path]: !prev[path] }));

  if (items.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-xs">暂无内容</div>;
  }

  return (
    <TreeLevel
      node={tree} path="" depth={0}
      selectedId={selectedId} onSelect={onSelect} onOpen={onOpen} onSetCategory={onSetCategory}
      onToggleFavorite={onToggleFavorite} onDelete={onDelete}
      collapsed={collapsed} toggleFolder={toggleFolder}
    />
  );
}