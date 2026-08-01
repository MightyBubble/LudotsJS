import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Section } from '@/components/ludots/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const inputCls = 'h-7 bg-[#0D0F14] border-[#2A2E37] text-xs text-white';
const NONE = '__none__';

/** 玩家可换位容器（物品栏 / 装备栏）：编辑初始占位，运行时由玩家拖动改写这份数据。 */
export default function PrototypeContainerSlotsSection({ containerSlots = [], abilityIds = [], onChange }) {
  const granted = abilityIds.filter(Boolean);
  const setSlots = (next) => onChange({ container_slots: next });
  const nextIndex = containerSlots.reduce((m, s) => Math.max(m, (s.slot_index ?? -1) + 1), 0);

  return (
    <Section title="容器槽位（玩家可换位）" right={
      <Button size="sm" variant="outline" className="h-6 text-[10px]"
        onClick={() => setSlots([...containerSlots, { slot_index: nextIndex, ability_id: '' }])}>
        <Plus className="w-3 h-3 mr-1" />添加槽位
      </Button>
    }>
      {containerSlots.length === 0 && (
        <p className="text-[10px] text-gray-600">该原型没有可换位容器。物品栏 / 装备栏在此声明初始占位，运行时玩家交换位置改的就是这张表，面板配置不动。</p>
      )}
      {containerSlots.map((slot, i) => (
        <div key={i} className="grid grid-cols-[64px_1fr_32px] gap-2 items-center">
          <span className="text-[11px] font-mono text-[#E2D8B3]">#{slot.slot_index ?? i}</span>
          <Select
            value={slot.ability_id || NONE}
            onValueChange={(v) => setSlots(containerSlots.map((s, idx) => (idx === i ? { ...s, ability_id: v === NONE ? '' : v } : s)))}
          >
            <SelectTrigger className={inputCls}><SelectValue placeholder="空槽位" /></SelectTrigger>
            <SelectContent className="bg-[#15171C] border-[#2A2E37]">
              <SelectItem value={NONE}>空槽位</SelectItem>
              {granted.map(id => <SelectItem key={id} value={id}>{id}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" className="h-7 text-red-400"
            onClick={() => setSlots(containerSlots.filter((_, idx) => idx !== i))}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      {containerSlots.length > 0 && (
        <p className="text-[10px] text-gray-500">面板侧用 fixed 模式的「容器槽位索引」读取本表；快捷键绑格子不绑技能。</p>
      )}
    </Section>
  );
}