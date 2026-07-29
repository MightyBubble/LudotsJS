import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { S, IconButton } from '@/components/shell/ui';

/** 通用二维表视图：columns = [{ key, label, width, render(record) }] */
export default function RecordTable({ records = [], columns = [], selectedId, onSelect, onDelete }) {
  return (
    <div className="h-full overflow-auto">
      <table className="w-full min-w-[760px]">
        <thead className="sticky top-0 bg-[#15171C] border-b border-[#2A2E37]">
          <tr>
            {columns.map(c => (
              <th key={c.key} className={S.th} style={c.width ? { width: c.width } : undefined}>{c.label}</th>
            ))}
            <th className={`${S.th} w-20`}>操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr
              key={r.id}
              onClick={() => onSelect?.(r)}
              className={`cursor-pointer ${r.id === selectedId ? S.rowActive : S.row}`}
            >
              {columns.map(c => (
                <td key={c.key} className={S.td}>{c.render ? c.render(r) : (r[c.key] ?? '-')}</td>
              ))}
              <td className={S.td}>
                <div className="flex gap-1">
                  <IconButton icon={Pencil} title="编辑详情" onClick={(e) => { e.stopPropagation(); onSelect?.(r); }} />
                  {onDelete && (
                    <IconButton icon={Trash2} tone="danger" title="删除" onClick={(e) => { e.stopPropagation(); onDelete(r); }} />
                  )}
                </div>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr><td colSpan={columns.length + 1} className="p-6 text-center text-xs text-gray-600">暂无记录</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}