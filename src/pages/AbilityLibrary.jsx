import React from 'react';
import { Wand2 } from 'lucide-react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import { Section, TextField, SelectField, ListField, BoolField } from '@/components/ludots/ui';
import TargetResolverEditor from '@/components/ludots/TargetResolverEditor';
import RefListSelector from '@/components/ludots/RefListSelector';
import PhaseListenersEditor from '@/components/ludots/PhaseListenersEditor';
import { ABILITY_LISTENER_PHASES } from '@/components/ludots/phaseModel';
import { validateAbility } from '@/components/ludots/validation';

const OPT = (arr) => arr.map(v => ({ value: v, label: v }));

export default function AbilityLibraryPage() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'Ability', 'abilities',
    () => ({
      ability_id: `ability_${Date.now()}`, name: '新能力', is_active: true, activation_mode: 'active',
      ability_tags: [], activation_requirements: [], target: { kind: 'explicit_target' },
      cost_effect_ids: [], cooldown_effect_ids: [], activation_effect_ids: [], cancellation_effect_ids: [],
      listeners: [], blackboard: {}, input_binding: {},
    })
  );
  const refs = useCoreRefs();
  const effectOptions = refs.effects.map(e => ({ value: e.effect_id, label: e.name }));
  const issues = draft ? validateAbility(draft, refs) : [];

  return (
    <RecordWorkspace
      title="能力 Abilities" icon={Wand2} entityName="Ability"
      records={records}
      toItem={(r) => ({ id: r.id, name: r.name, subtitle: `${r.activation_mode || 'active'} · ${(r.activation_effect_ids || []).length} 效果` })}
      selectedId={selectedId} onSelect={(r) => setSelectedId(r.id)}
      onCreate={create}
      onDelete={(r) => window.confirm(`确定删除「${r.name}」吗？`) && remove(r.id)}
      onSave={save} dirty={dirty}
    >
      {draft && (
        <div className="max-w-2xl">
          <Section title="基础 Basic">
            <TextField label="能力 ID (ability_id)" value={draft.ability_id} onChange={(v) => patch({ ability_id: v })} />
            <TextField label="名称" value={draft.name} onChange={(v) => patch({ name: v })} />
            <TextField label="描述" value={draft.description} onChange={(v) => patch({ description: v })} />
            <SelectField label="图标资源" value={draft.icon_asset_id} options={refs.assets.map(a => ({ value: a.asset_id, label: a.name }))} onChange={(v) => patch({ icon_asset_id: v })} />
            <ListField label="能力标签 ability_tags" value={draft.ability_tags} onChange={(v) => patch({ ability_tags: v })} />
            <BoolField label="启用" value={draft.is_active !== false} onChange={(v) => patch({ is_active: v })} />
          </Section>

          <Section title="激活模式与输入">
            <SelectField label="激活模式 activation_mode" value={draft.activation_mode || 'active'} options={OPT(['active', 'passive', 'event_driven'])} onChange={(v) => patch({ activation_mode: v })} />
            <TextField label="输入绑定键 (input_binding.key)" value={draft.input_binding?.key} onChange={(v) => patch({ input_binding: { ...(draft.input_binding || {}), key: v } })} />
            <p className="text-[10px] text-gray-600">被动 / 事件驱动能力由 Trigger 激活，但仍走同一激活管线。</p>
          </Section>

          <Section title="需求与目标">
            <RefListSelector label="激活需求 activation_requirements" value={draft.activation_requirements || []} options={refs.requirements.map(r => ({ value: r.requirement_id, label: r.name }))} onChange={(v) => patch({ activation_requirements: v })} />
            <TargetResolverEditor value={draft.target || { kind: 'explicit_target' }} onChange={(v) => patch({ target: v })} entityQueries={refs.entityQueries} />
          </Section>

          <Section title="效果编排 Effects">
            <RefListSelector label="成本 cost_effect_ids" value={draft.cost_effect_ids || []} options={effectOptions} onChange={(v) => patch({ cost_effect_ids: v })} />
            <RefListSelector label="冷却 cooldown_effect_ids" value={draft.cooldown_effect_ids || []} options={effectOptions} onChange={(v) => patch({ cooldown_effect_ids: v })} />
            <RefListSelector label="激活 activation_effect_ids" value={draft.activation_effect_ids || []} options={effectOptions} onChange={(v) => patch({ activation_effect_ids: v })} />
            <RefListSelector label="取消 cancellation_effect_ids" value={draft.cancellation_effect_ids || []} options={effectOptions} onChange={(v) => patch({ cancellation_effect_ids: v })} />
            <p className="text-[10px] text-gray-600">激活顺序：构造上下文 → 校验 → 预检成本 → 成本 → 冷却 → 激活效果 → 发出 activated / completed 或 failed 事件。</p>
          </Section>

          <Section title="Phase Listeners（能力激活管线）">
            <PhaseListenersEditor listeners={draft.listeners || []} onChange={(v) => patch({ listeners: v })} phaseOptions={ABILITY_LISTENER_PHASES} refs={refs} />
          </Section>

          <Section title="黑板 Blackboard">
            <ListField
              label="变量名列表"
              value={Object.keys(draft.blackboard || {})}
              onChange={(keys) => patch({ blackboard: keys.reduce((acc, k) => ({ ...acc, [k]: (draft.blackboard || {})[k] || { type: 'number' } }), {}) })}
            />
          </Section>

          <Section title="校验 Validation">
            {issues.length === 0
              ? <p className="text-[11px] text-green-500">未发现问题</p>
              : issues.map((i, idx) => (
                <p key={idx} className={`text-[11px] ${i.severity === 'error' ? 'text-red-400' : 'text-yellow-500'}`}>
                  [{i.severity}] {i.field_path}：{i.message}　→ {i.fix}
                </p>
              ))}
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}