// 位芯片共享组件 —— HTN / GOAP / 任何规划器编辑器通用的"前置条件 / 后效"可视化与编辑。
// 语义统一：蓝芯片 = 前置条件（对 worldstate 位，点击取反）；绿芯片 = 后效（带 Fluid HTN 效果类型）。
import { useState } from 'react';
import { UE } from './theme.js';

export const EFFECT_TYPES = { plan: '规划', plan_execute: '规划+执行', permanent: '永久' };

const selCls = 'h-7 text-[11px] rounded px-1.5 bg-[#0E0F12] border border-[rgba(255,255,255,0.08)] text-[#d6d6dc]';

// 节点内微缩芯片（只读，单行）：条件 bit / ¬bit；效果 →bit·类型首字
export function MiniChips({ items, prefix, color, max = 3 }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-nowrap gap-0.5 mt-1 overflow-hidden">
      {items.slice(0, max).map((c, i) => (
        <span key={i} className="px-1 rounded text-[8px] leading-3 whitespace-nowrap"
          style={c.val === false
            ? { background: '#3a2a2e', color: '#e08a8a', textDecoration: 'line-through' }
            : { background: color, color: '#dfe6f5' }}>
          {prefix || ''}{c.bit}{c.type ? `·${EFFECT_TYPES[c.type][0]}` : ''}
        </span>
      ))}
      {items.length > max && <span className="text-[8px] whitespace-nowrap" style={{ color: UE.faint }}>+{items.length - max}</span>}
    </div>
  );
}

// 面板用编辑器：芯片增删、点击取反；effect=true 时每芯片带效果类型选择
export function BitChipsEditor({ items, onChange, bits, effect = false, addLabel }) {
  const [pendingType, setPendingType] = useState('plan');
  return (
    <div className="flex flex-wrap gap-1 my-1 items-center">
      {(items || []).map((c, i) => (
        <span key={i} className="flex items-center px-1.5 py-0.5 rounded text-[10px]"
          style={c.val === false ? { background: '#3a2a2e', color: '#e08a8a' } : { background: 'rgba(255,255,255,0.10)', color: '#E5E5EA' }}>
          <button title="点击取反" onClick={() => onChange(items.map((x, xi) => xi === c ? { ...x, val: x.val === false ? true : false } : x))}
            style={c.val === false ? { textDecoration: 'line-through' } : {}}>
            {c.val === false ? '¬' : ''}{c.bit}
          </button>
          {effect && (
            <select value={c.type || 'plan'} onChange={(e) => onChange(items.map((x, xi) => xi === c ? { ...x, type: e.target.value } : x))}
              className="ml-1 text-[9px] rounded bg-[#0E0F12] border border-[rgba(255,255,255,0.08)]" style={{ color: UE.dim }}>
              {Object.entries(EFFECT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          )}
          <button className="ml-1" style={{ color: UE.faint }} onClick={() => onChange(items.filter((_, xi) => xi !== i))}>×</button>
        </span>
      ))}
      <select className={selCls} value="" onChange={(e) => {
        if (!e.target.value) return;
        onChange([...(items || []), effect ? { bit: e.target.value, type: pendingType } : { bit: e.target.value }]);
      }}>
        <option value="">{addLabel}</option>
        {bits.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      {effect && (
        <select className={selCls} value={pendingType} onChange={(e) => setPendingType(e.target.value)} title="新效果的类型">
          {Object.entries(EFFECT_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      )}
    </div>
  );
}

// 只读芯片组（回放/展示用）：带逐位满足态着色（okMap: bit → true/false）；bg/fg 可换色（效果=绿）
export function BitChipsView({ items, prefix, okMap = null, bg = 'rgba(255,255,255,0.10)', fg = '#E5E5EA' }) {
  if (!items?.length) return <span className="text-[9px]" style={{ color: UE.faint }}>（无）</span>;
  return (
    <div className="flex flex-wrap gap-0.5">
      {items.map((c, i) => {
        const bad = okMap && okMap[c.bit] === false;
        return (
          <span key={i} className="px-1 rounded text-[9px] leading-3.5"
            style={bad || c.val === false
              ? { background: '#3a2a2e', color: '#e08a8a', textDecoration: bad ? 'none' : 'line-through' }
              : { background: bg, color: fg }}>
            {prefix || ''}{c.val === false ? '¬' : ''}{c.bit}{bad ? ' ✗' : ''}
          </span>
        );
      })}
    </div>
  );
}
