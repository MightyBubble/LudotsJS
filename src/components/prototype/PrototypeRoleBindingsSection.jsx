import React from 'react';
import { Section } from '@/components/ludots/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const inputCls = 'h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white';
const NONE = '__none__';

export default function PrototypeRoleBindingsSection({
  profileRef = '',
  roleBindings = [],
  profiles = [],
  abilityIds = [],
  onChange,
}) {
  const profile = profiles.find(p => p.profile_id === profileRef);
  const granted = abilityIds.filter(Boolean);

  const bindingFor = (roleId) => roleBindings.find(b => b.role_id === roleId)?.ability_id || '';

  const setBinding = (roleId, abilityId) => {
    const rest = roleBindings.filter(b => b.role_id !== roleId);
    onChange({ role_bindings: abilityId === NONE ? rest : [...rest, { role_id: roleId, ability_id: abilityId }] });
  };

  return (
    <Section title="技能语义绑定">
      <div>
        <label className="block text-xs text-gray-400 mb-1">语义组</label>
        <select
          value={profileRef || ''}
          onChange={(e) => onChange({ semantic_profile_ref: e.target.value, role_bindings: [] })}
          className="w-full h-7 bg-[#0D0F14] border border-[#2A2E37] text-xs text-white rounded px-2"
        >
          <option value="">留空表示该实体无位置语义</option>
          {profiles.map(p => <option key={p.id} value={p.profile_id}>{p.label ? `${p.label}（${p.profile_id}）` : p.profile_id}</option>)}
        </select>
        <p className="text-[10px] text-gray-500 mt-1">
          语义组在 Gameplay → Ability Semantics 中定义。建筑与英雄引用不同的语义组。
        </p>
      </div>

      {profile && (
        <div className="space-y-2 pt-1">
          {(profile.roles || []).map((role) => {
            const value = bindingFor(role.role_id);
            const dangling = value && !granted.includes(value);
            return (
              <div key={role.role_id} className="grid grid-cols-[140px_1fr] gap-2 items-center">
                <div className="min-w-0">
                  <div className="text-[11px] text-[#E2D8B3] truncate">{role.label || role.role_id}</div>
                  <div className="text-[10px] text-gray-600 font-mono truncate">{role.role_id}</div>
                </div>
                <div>
                  <Select value={value || NONE} onValueChange={(v) => setBinding(role.role_id, v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="未绑定" /></SelectTrigger>
                    <SelectContent className="bg-[#15171C] border-[#2A2E37]">
                      <SelectItem value={NONE}>未绑定</SelectItem>
                      {granted.map((abilityId) => <SelectItem key={abilityId} value={abilityId}>{abilityId}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {dangling && <p className="text-[10px] text-red-400 mt-1">该技能已不在授予列表中，绑定失效</p>}
                </div>
              </div>
            );
          })}
          {!(profile.roles || []).length && <p className="text-[10px] text-gray-500">该语义组还没有定义任何语义。</p>}
          <p className="text-[10px] text-gray-500">
            绑定的目标是技能本身，不是槽位索引；导出时按技能在授予列表中的位置换算成 slot index。
          </p>
        </div>
      )}

      {profileRef && !profile && (
        <p className="text-[10px] text-red-400">找不到语义组「{profileRef}」。</p>
      )}
    </Section>
  );
}