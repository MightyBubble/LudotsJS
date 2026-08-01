import React from 'react';
import { Section } from '@/components/ludots/ui';

/** 实时状态：当前实体列表解析出的技能与其原始标签集。 */
export default function RuntimeStatePanel({ entities = [], abilityProvider }) {
  return (
    <Section title="实时状态 · 技能与标签">
      {entities.length === 0 && <p className="text-[11px] text-gray-500">尚无实体。</p>}
      {entities.map(e => (
        <div key={e.entity_id} className="space-y-1">
          <div className="text-[11px] text-[#E2D8B3]">{e.entity_id}</div>
          {(e.ability_ids || []).map(id => {
            const ability = abilityProvider.get(id);
            return (
              <div key={id} className="bg-[#0D0F14] border border-[#2A2E37] rounded px-2 py-1">
                <div className="text-[10px] text-gray-300">{ability?.displayName || id}</div>
                <div className="text-[10px] text-gray-500 break-all">
                  {ability ? (ability.catalogTags.join(' · ') || '无 catalogTags') : '⚠ 未在 Ability 库中找到'}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </Section>
  );
}