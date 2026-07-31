import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';

const inputCls = 'h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white';

export default function SemanticRoleListEditor({ roles = [], onChange }) {
  const update = (index, patch) => {
    const list = [...roles];
    list[index] = { ...list[index], ...patch };
    onChange(list);
  };

  const move = (index, delta) => {
    const next = index + delta;
    if (next < 0 || next >= roles.length) return;
    const list = [...roles];
    [list[index], list[next]] = [list[next], list[index]];
    onChange(list);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-[10px] text-gray-500">
        <span>role_id</span>
        <span>显示名</span>
        <span />
      </div>
      {roles.map((role, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
          <Input value={role.role_id || ''} placeholder="Skill.Ultimate"
            onChange={(e) => update(index, { role_id: e.target.value })} className={`${inputCls} font-mono`} />
          <Input value={role.label || ''} placeholder="大招"
            onChange={(e) => update(index, { label: e.target.value })} className={inputCls} />
          <div className="flex">
            <Button size="sm" variant="ghost" onClick={() => move(index, -1)} className="h-7 w-7 p-0 text-gray-400"><ChevronUp className="w-3 h-3" /></Button>
            <Button size="sm" variant="ghost" onClick={() => move(index, 1)} className="h-7 w-7 p-0 text-gray-400"><ChevronDown className="w-3 h-3" /></Button>
            <Button size="sm" variant="ghost" onClick={() => onChange(roles.filter((_, i) => i !== index))} className="h-7 w-7 p-0 text-red-400"><Trash2 className="w-3 h-3" /></Button>
          </div>
        </div>
      ))}
      {!roles.length && <p className="text-[10px] text-gray-500">暂无语义。无位置语义的玩法（如技能书式）可以保持为空。</p>}
      <Button size="sm" onClick={() => onChange([...roles, { role_id: '', label: '' }])} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]"><Plus className="w-3 h-3" />添加语义</Button>
    </div>
  );
}