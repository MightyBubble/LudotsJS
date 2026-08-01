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

export default function CommandPanelRuntimePage() {
  const { data: panels = [] } = useQuery({ queryKey: ['CommandPanelProfile'], queryFn: () => base44.entities.CommandPanelProfile.list() });
  const { data: abilities = [] } = useQuery({ queryKey: ['Ability'], queryFn: () => base44.entities.Ability.list() });
  const { data: prototypes = [] } = useQuery({ queryKey: ['EntityPrototype'], queryFn: () => base44.entities.EntityPrototype.list() });

  const log = useMemo(() => createRuntimeLog(), []);
  const abilityProvider = useMemo(() => createAbilityProvider(abilities), [abilities]);
  const [panelId, setPanelId] = useState('');
  const [entities, setEntities] = useState([]);

  const panelProfile = panels.find(p => p.panel_id === panelId);
  const result = useMemo(() => {
    if (!panelProfile) return null;
    return createCommandPanelRuntime({ panelProfile, abilityProvider, log }).setEntities(entities).resolve();
  }, [panelProfile, abilityProvider, entities, log]);

  const activate = (button) => createCommandPanelRuntime({ panelProfile, abilityProvider, log }).setEntities(entities).activate(button);

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
              onChange={setPanelId}
              options={panels.filter(p => p.panel_id).map(p => ({ value: p.panel_id, label: `${p.label || p.panel_id} · ${p.layout?.mode || 'dynamic'}` }))}
            />
            {result
              ? <RuntimePanelView result={result} onActivate={activate} />
              : <p className="text-[11px] text-gray-500">选择一个面板以启动运行时。</p>}
          </Section>
        </div>
        <div className="h-56 shrink-0 p-3 pt-0">
          <RuntimeConsole log={log} />
        </div>
      </div>
    </div>
  );
}