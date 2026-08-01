import React from 'react';
import { Section } from '@/components/ludots/ui';

/** 调试：fixed 栏位的出厂预设 / 覆盖表 / 当前生效三态对照，以及覆盖表原始数据形状。 */
export default function RuntimeSlotDebugPanel({ baseResult, result, slotOverrides = {} }) {
  if (!result || result.mode !== 'fixed') return null;
  const rows = (baseResult?.buttons || []).map(b => {
    const now = result.buttons.find(x => x.slot_id === b.slot_id) || {};
    return {
      slot_id: b.slot_id,
      configured_role: b.configured_role_id || b.role_id,
      override: slotOverrides[b.slot_id] || null,
      effective_role: now.role_id || null,
      effective_ability: now.ability_id || null,
    };
  });

  return (
    <Section title="调试 · 栏位数据形状">
      <div className="overflow-auto">
        <table className="w-full text-[10px] text-gray-300">
          <thead className="text-gray-500">
            <tr className="text-left">
              <th className="py-1 pr-2">slot_id</th>
              <th className="py-1 pr-2">配置 role_id</th>
              <th className="py-1 pr-2">覆盖 role_id</th>
              <th className="py-1 pr-2">生效 role_id</th>
              <th className="py-1">解析出的 ability_id</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.slot_id} className="border-t border-[#2A2E37]">
                <td className="py-1 pr-2 font-mono">{r.slot_id}</td>
                <td className="py-1 pr-2 font-mono text-gray-500">{r.configured_role || '—'}</td>
                <td className={`py-1 pr-2 font-mono ${r.override ? 'text-[#cbd3dc]' : 'text-gray-600'}`}>{r.override || '—'}</td>
                <td className={`py-1 pr-2 font-mono ${r.override ? 'text-[#E2D8B3]' : ''}`}>{r.effective_role || '—'}</td>
                <td className="py-1 font-mono text-gray-400">{r.effective_ability || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <div className="text-[10px] text-gray-500 mb-1">slotOverrides：slot_id → role_id（与配置同层，不进配置）</div>
        <pre className="bg-[#0D0F14] border border-[#2A2E37] rounded p-2 text-[10px] text-gray-300 overflow-auto">
{JSON.stringify(slotOverrides, null, 2)}
        </pre>
      </div>
    </Section>
  );
}