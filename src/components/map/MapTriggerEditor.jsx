import React from 'react';
import { Link } from 'react-router-dom';
import { Section } from '@/components/ludots/ui';
import { S } from '@/components/shell/ui';

export default function MapTriggerEditor({ triggerTypes = [], blueprints = [], onChange }) {
  const toggle = (name, on) => onChange(on ? [...new Set([...triggerTypes, name])] : triggerTypes.filter(t => t !== name));
  const orphans = triggerTypes.filter(name => !blueprints.some(b => b.trigger_type_name === name));
  return <Section title="Map Triggers">
    <p className={S.hint}><b className="text-gray-300">24</b> 勾选本地图引用的关卡蓝图，其 Trigger 类型名会写入 MapConfig.TriggerTypes。</p>
    {blueprints.length === 0
      ? <p className="text-[11px] text-gray-500">还没有关卡蓝图，先到 <Link to="/LevelBlueprintEditor" className="text-[#cbd3dc] underline">关卡蓝图</Link> 创建模板。</p>
      : <div className="space-y-1.5">{blueprints.map(bp => <label key={bp.id} className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="accent-[#D97706]" checked={triggerTypes.includes(bp.trigger_type_name)} onChange={e => toggle(bp.trigger_type_name, e.target.checked)} />
        <span className="text-[11px] text-gray-300">{bp.label || bp.blueprint_id}</span>
        <span className="text-[10px] text-gray-600">{bp.trigger_type_name}</span>
      </label>)}</div>}
    {orphans.length > 0 && <p className="text-[10px] text-amber-300/80">未匹配任何蓝图的 Trigger 类型：{orphans.join(', ')}</p>}
  </Section>;
}