import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

const TYPES = ['number', 'string', 'boolean', 'object', 'array'];

/** 单张常量表的行编辑网格 */
export default function ConstantRowsGrid({ rows, onChange }) {
  const patchRow = (idx, patch) => onChange(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-3">
      <div className="border border-[#2A2E37] rounded overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-[#15171C]">
            <tr>
              <th className="text-left p-2 border-r border-[#2A2E37] w-56">常量键</th>
              <th className="text-left p-2 border-r border-[#2A2E37] w-28">类型</th>
              <th className="text-left p-2 border-r border-[#2A2E37]">值</th>
              <th className="text-left p-2 border-r border-[#2A2E37]">说明</th>
              <th className="text-left p-2 w-14"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t border-[#2A2E37] hover:bg-[#15171C]">
                <td className="p-2 border-r border-[#2A2E37]">
                  <Input
                    value={row.key ?? ''}
                    onChange={(e) => patchRow(idx, { key: e.target.value })}
                    className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white font-mono"
                  />
                </td>
                <td className="p-2 border-r border-[#2A2E37]">
                  <Select value={row.type || 'number'} onValueChange={(v) => patchRow(idx, { type: v })}>
                    <SelectTrigger className="h-6 bg-[#0D0F14] border-[#2A2E37] text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      {TYPES.map(t => (
                        <SelectItem key={t} value={t} className="text-white text-xs">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2 border-r border-[#2A2E37]">
                  <Input
                    value={row.value ?? ''}
                    onChange={(e) => patchRow(idx, { value: e.target.value })}
                    className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white font-mono"
                  />
                </td>
                <td className="p-2 border-r border-[#2A2E37]">
                  <Input
                    value={row.description ?? ''}
                    onChange={(e) => patchRow(idx, { description: e.target.value })}
                    className="h-6 bg-[#0D0F14] border-[#2A2E37] text-xs text-white"
                  />
                </td>
                <td className="p-2">
                  <button
                    onClick={() => onChange(rows.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-4 text-center text-gray-500">此表暂无常量</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Button
        onClick={() => onChange([...rows, { key: 'new_constant', type: 'number', value: '0', description: '' }])}
        className="bg-[#262626] hover:bg-[#4d4d4d]"
      >
        <Plus className="w-4 h-4 mr-1" />
        添加常量
      </Button>
    </div>
  );
}