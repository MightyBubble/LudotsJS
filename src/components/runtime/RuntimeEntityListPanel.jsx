import React from 'react';
import { Section } from '@/components/ludots/ui';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

/** 有序实体列表：runtime 唯一的实体输入。上下顺序即 runtime 的解析顺序。 */
export default function RuntimeEntityListPanel({ prototypes = [], entities = [], onChange }) {
  const add = (prototype) => onChange([
    ...entities,
    { entity_id: `${prototype.prototype_id}#${entities.length + 1}`, prototype_id: prototype.prototype_id, ability_ids: prototype.ability_ids || [], role_bindings: prototype.role_bindings || [], container_slots: prototype.container_slots || [] },
  ]);

  return (
    <Section title="实体列表（有序）">
      {entities.length === 0 && <p className="text-[11px] text-gray-500">从下方原型添加实体，顺序即 runtime 解析顺序。</p>}
      {entities.map((e, i) => (
        <div key={e.entity_id} className="flex items-center justify-between bg-[#0D0F14] border border-[#2A2E37] rounded px-2 py-1.5">
          <div className="min-w-0">
            <div className="text-[11px] text-[#e5e5e5] truncate">{i + 1}. {e.entity_id}</div>
            <div className="text-[10px] text-gray-500">{(e.ability_ids || []).length} 技能 · {(e.role_bindings || []).length} 语义绑定</div>
          </div>
          <button onClick={() => onChange(entities.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-400 p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <div className="pt-1 border-t border-[#2A2E37] space-y-1">
        {prototypes.map(p => (
          <Button key={p.prototype_id} onClick={() => add(p)} variant="outline" className="w-full justify-start h-7 text-[11px]">
            <Plus className="w-3 h-3 mr-1" />{p.name || p.prototype_id}
          </Button>
        ))}
      </div>
    </Section>
  );
}