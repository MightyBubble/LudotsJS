import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section, SelectField } from '@/components/ludots/ui';
import { createRuntimeLog } from '@/lib/runtime/runtimeLog';
import { createAbilityProvider } from '@/lib/runtime/abilityProvider';
import { createCommandPanelRuntime } from '@/lib/runtime/commandPanelRuntime';
import RuntimeEntityListPanel from '@/components/runtime/RuntimeEntityListPanel';
import RuntimeStatePanel from '@/components/runtime/RuntimeStatePanel';
import RuntimePanelView from '@/components/runtime/RuntimePanelView';
import RuntimeConsole from '@/components/runtime/RuntimeConsole';
import RuntimeSlotDebugPanel from '@/components/runtime/RuntimeSlotDebugPanel';

export default function CommandPanelRuntimePage() {
  const { data: panels = [] } = useQuery({ queryKey: ['CommandPanelProfile'], queryFn: () => base44.entities.CommandPanelProfile.list() });
  const { data: abilities = [] } = useQuery({ queryKey: ['Ability'], queryFn: () => base44.entities.Ability.list() });
  const { data: prototypes = [] } = useQuery({ queryKey: ['EntityPrototype'], queryFn: () => base44.entities.EntityPrototype.list() });

  const log = useMemo(() => createRuntimeLog(), []);
  const abilityProvider = useMemo(() => createAbilityProvider(abilities), [abilities]);
  const [panelId, setPanelId] = useState('');
  const [entities, setEntities] = useState([]);
  // 玩家侧覆盖表：slot_id -> ability_id，初始为空，命中即覆盖出厂预设
  const [slotOverrides, setSlotOverrides] = useState({});

  const panelProfile = panels.find(p => p.panel_id === panelId);
  const result = useMemo(() => {
    if (!panelProfile) return null;
    return createCommandPanelRuntime({ panelProfile, abilityProvider, log, slotOverrides }).setEntities(entities).resolve();
  }, [panelProfile, abilityProvider, entities, log, slotOverrides]);

  // 无覆盖的基线解析，用于调试面板做前后对照
  const baseResult = useMemo(() => {
    if (!panelProfile) return null;
    return createCommandPanelRuntime({ panelProfile, abilityProvider, log: createRuntimeLog(), slotOverrides: {} }).setEntities(entities).resolve();
  }, [panelProfile, abilityProvider, entities]);

  const activate = (button) => createCommandPanelRuntime({ panelProfile, abilityProvider, log, slotOverrides }).setEntities(entities).activate(button);

  const swapSlots = (fromSlot, toSlot) => {
    const abilityOf = (slotId) => (result?.buttons.find(b => b.slot_id === slotId) || {}).ability_id;
    const a = abilityOf(fromSlot);
    const b = abilityOf(toSlot);
    if (!a || !b) return;
    setSlotOverrides(prev => ({ ...prev, [fromSlot]: b, [toSlot]: a }));
    log.info('panel', `交换栏位 ${fromSlot} ↔ ${toSlot}`, { [fromSlot]: b, [toSlot]: a });
  };

  // 换内容：单向把某个技能塞进栏位（同一张覆盖表）
  const assignSlot = (slotId, abilityId) => {
    setSlotOverrides(prev => ({ ...prev, [slotId]: abilityId }));
    log.info('panel', `替换栏位内容 ${slotId} ← ${abilityId}`);
  };

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-72 shrink-0 border-r border-[#2A2E37] overflow-auto p-3">
        <RuntimeEntityListPanel prototypes={prototypes} entities={entities} onChange={setEntities} />
        <RuntimeStatePanel entities={entities} abilityProvider={abilityProvider} />
      </div>
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-auto p-3">
          <Section title="面板运行时">
            <SelectField
              label="Command Panel"
              value={panelId}
              onChange={(v) => { setPanelId(v); setSlotOverrides({}); }}
              options={panels.filter(p => p.panel_id).map(p => ({ value: p.panel_id, label: `${p.label || p.panel_id} · ${p.layout?.mode || 'dynamic'}` }))}
            />
            {result
              ? <RuntimePanelView
                  result={result}
                  onActivate={activate}
                  onSwapSlots={swapSlots}
                  onAssignSlot={assignSlot}
                  onResetSlots={() => { setSlotOverrides({}); log.info('panel', '覆盖表已清空，回到出厂预设'); }}
                  hasOverrides={Object.keys(slotOverrides).length > 0}
                />
              : <p className="text-[11px] text-gray-500">选择一个面板以启动运行时。</p>}
          </Section>
          <RuntimeSlotDebugPanel baseResult={baseResult} result={result} slotOverrides={slotOverrides} />
        </div>
        <div className="h-56 shrink-0 p-3 pt-0">
          <RuntimeConsole log={log} />
        </div>
      </div>
    </div>
  );
}