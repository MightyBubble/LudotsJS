import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Section, TextField } from '@/components/ludots/ui';
import FormRouteEditor from './FormRouteEditor';

export default function AbilityFormSetDetails({ draft, patch, abilities = [] }) {
  const routes = draft.routes || [];
  const setRoutes = (next) => patch({ routes: next });

  return (
    <div className="p-4">
      <Section title="基础信息">
        <TextField label="技能组 ID (form set id)" value={draft.form_set_id} onChange={(v) => patch({ form_set_id: v })}
          hint="对应 GAS/ability_form_sets.json 的 id；原型通过 ability_form_set_ref 引用它" />
        <TextField label="备注" value={draft.description} onChange={(v) => patch({ description: v })} />
      </Section>

      <Section title="条件路由 (routes)" right={
        <Button size="sm" variant="outline" onClick={() => setRoutes([...routes, { requiredAll: [], blockedAny: [], priority: 0, slotOverrides: [{ slotIndex: 0, abilityId: '' }] }])} className="h-7 text-xs">
          <Plus className="w-3 h-3 mr-1" />添加路由
        </Button>
      }>
        {routes.length === 0 && <p className="text-[11px] text-gray-500">至少需要一条路由，否则 C# 端加载会报错。</p>}
        {routes.map((route, i) => (
          <FormRouteEditor key={i} route={route} index={i} abilities={abilities}
            onChange={(next) => setRoutes(routes.map((r, k) => (k === i ? next : r)))}
            onRemove={() => setRoutes(routes.filter((_, k) => k !== i))} />
        ))}
      </Section>
    </div>
  );
}