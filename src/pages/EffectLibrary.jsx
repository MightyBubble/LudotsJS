import React from 'react';
import { Sparkles } from 'lucide-react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import { Section, TextField, SelectField, ListField, NumberField, BoolField } from '@/components/ludots/ui';
import GameplayTagSelect from '@/components/ludots/GameplayTagSelect';
import { EFFECT_PRESET_OPTIONS } from '@/components/ludots/effectPresetTypes';
import TargetResolverEditor from '@/components/ludots/TargetResolverEditor';
import RefListSelector from '@/components/ludots/RefListSelector';
import PhasePipelineEditor from '@/components/ludots/PhasePipelineEditor';
import TransactionTimeline from '@/components/ludots/TransactionTimeline';
import { validateEffect } from '@/components/ludots/validation';
import {
  LIFETIME_KINDS, isDurableKind, createDefaultPhases, createDefaultResponseChain,
} from '@/components/ludots/phaseModel';

const OPT = (arr) => arr.map(v => ({ value: v, label: v }));

export default function EffectLibraryPage() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'Effect', 'effects',
    () => ({
      effect_id: `effect_${Date.now()}`, tags: [], presetType: 'None',
      lifetime: 'Instant', participatesInResponse: false,
      application: { stacking: 'none', overflow: 'reject', duration_refresh: 'never', period_reset: 'never' },
      target: { kind: 'self' }, requirements: [],
      phases: createDefaultPhases(), response_chain: createDefaultResponseChain(),
      blackboard: {},
    })
  );
  const refs = useCoreRefs();
  const duration = draft?.duration || {};
  const expireCondition = draft?.expireCondition;
  const application = draft?.application || {};
  const durable = isDurableKind(draft?.lifetime);
  const issues = draft ? validateEffect(draft, refs) : [];

  const setDuration = (p) => patch({ duration: { ...duration, ...p } });
  const setExpireCondition = (p) => patch({ expireCondition: { ...expireCondition, ...p } });
  const setApplication = (p) => patch({ application: { ...application, ...p } });

  return (
    <RecordWorkspace
      entityName="Effect"
      records={records}
      columns={[
        { key: 'effect_id', label: 'id', width: 220, render: (r) => <span className="font-mono text-[#E2D8B3]">{r.effect_id}</span> },
        { key: 'presetType', label: 'presetType', width: 160 },
        { key: 'lifetime', label: 'lifetime', width: 110 },
        { key: 'participatesInResponse', label: '响应链', width: 80, render: (r) => (r.participatesInResponse ? '是' : '否') },
        { key: 'tags', label: 'tags', render: (r) => (r.tags || []).join(', ') || '-' },
        { key: 'phases', label: '启用阶段', width: 90, render: (r) => (r.phases || []).filter(p => p.enabled).length },
      ]}
      toItem={(r) => ({ id: r.id, name: r.effect_id, subtitle: `${r.lifetime || 'Instant'} · ${(r.phases || []).filter(p => p.enabled).length} phases` })}
      selectedId={selectedId} onSelect={(r) => setSelectedId(r.id)}
      onCreate={create}
      onDelete={(r) => window.confirm(`确定删除「${r.name}」吗？`) && remove(r.id)}
      onSave={save} dirty={dirty}
    >
      {draft && (
        <div className="max-w-3xl">
          <Section title="基础 Basic · EffectTemplateConfig">
            <TextField label="id" value={draft.effect_id} onChange={(v) => patch({ effect_id: v })} hint="C# JSON 的 id；平台内置 id 已占用，因此数据库中存为 effect_id" />
            <GameplayTagSelect label="tags[0]" value={draft.tags?.[0]} tags={refs.tags} onChange={(v) => patch({ tags: v ? [v] : [] })} />
            <SelectField label="presetType" value={draft.presetType || 'None'} options={EFFECT_PRESET_OPTIONS} onChange={(v) => patch({ presetType: v })} />
            <BoolField label="participatesInResponse" value={draft.participatesInResponse === true} onChange={(v) => patch({ participatesInResponse: v })} />
          </Section>

          <Section title="生命周期 Lifetime · EffectTemplateConfig">
            <SelectField label="lifetime" value={draft.lifetime || 'Instant'} options={LIFETIME_KINDS} onChange={(v) => patch({ lifetime: v })} />
            {draft.lifetime === 'After' && (
              <NumberField label="duration.durationTicks" value={duration.durationTicks} onChange={(v) => setDuration({ durationTicks: v })} />
            )}
            {durable && (
              <>
                <NumberField label="duration.periodTicks" value={duration.periodTicks} onChange={(v) => setDuration({ periodTicks: v })} />
                <TextField label="duration.clockId" value={duration.clockId} onChange={(v) => setDuration({ clockId: v })} />
              </>
            )}
            <BoolField label="配置 expireCondition" value={Boolean(expireCondition)} onChange={(v) => patch({ expireCondition: v ? { kind: 'TagPresent', tag: '', sense: 'Raw' } : null })} />
            {expireCondition && (
              <>
                <SelectField label="expireCondition.kind" value={expireCondition.kind} options={OPT(['TagPresent', 'TagAbsent'])} onChange={(v) => setExpireCondition({ kind: v })} />
                <GameplayTagSelect label="expireCondition.tag" value={expireCondition.tag} tags={refs.tags} onChange={(v) => setExpireCondition({ tag: v })} />
                <SelectField label="expireCondition.sense" value={expireCondition.sense} options={OPT(['Raw', 'Effective'])} onChange={(v) => setExpireCondition({ sense: v })} />
              </>
            )}
            <p className="text-[10px] text-gray-600">字段名、枚举值与 C# effects.json 保持一致；到期条件与 lifetime 正交。</p>
          </Section>

          <Section title="应用与叠加 Application / Stacking">
            <SelectField label="叠加 stacking" value={application.stacking || 'none'} options={OPT(['none', 'aggregate_by_source', 'aggregate_by_target', 'independent'])} onChange={(v) => setApplication({ stacking: v })} />
            <NumberField label="最大层数 max_stacks" value={application.max_stacks} onChange={(v) => setApplication({ max_stacks: v })} />
            <SelectField label="溢出 overflow" value={application.overflow || 'reject'} options={OPT(['reject', 'refresh_duration', 'replace_oldest', 'execute_overflow_effect'])} onChange={(v) => setApplication({ overflow: v })} />
            {application.overflow === 'execute_overflow_effect' && (
              <SelectField label="溢出效果" value={application.overflow_effect_id} options={refs.effects.filter(e => e.effect_id !== draft.effect_id).map(e => ({ value: e.effect_id, label: e.name }))} onChange={(v) => setApplication({ overflow_effect_id: v })} />
            )}
            {durable && (
              <>
                <SelectField label="时长刷新 duration_refresh" value={application.duration_refresh || 'never'} options={OPT(['never', 'on_reapply', 'on_stack_added'])} onChange={(v) => setApplication({ duration_refresh: v })} />
                <SelectField label="周期重置 period_reset" value={application.period_reset || 'never'} options={OPT(['never', 'on_reapply', 'on_stack_added'])} onChange={(v) => setApplication({ period_reset: v })} />
              </>
            )}
          </Section>

          <Section title="需求与目标 Requirements & Target">
            <RefListSelector label="需求 requirements" value={draft.requirements || []} options={refs.requirements.map(r => ({ value: r.requirement_id, label: r.name }))} onChange={(v) => patch({ requirements: v })} />
            <TargetResolverEditor value={draft.target || { kind: 'self' }} onChange={(v) => patch({ target: v })} entityQueries={refs.entityQueries} />
            <ListField label="授予标签 granted_tags" value={draft.granted_tags} onChange={(v) => patch({ granted_tags: v })} />
            <ListField label="阻挡标签 blocked_tags" value={draft.blocked_tags} onChange={(v) => patch({ blocked_tags: v })} />
            <ListField label="应用时移除标签 removed_tags_on_apply" value={draft.removed_tags_on_apply} onChange={(v) => patch({ removed_tags_on_apply: v })} />
          </Section>

          <Section title="Phase 流程 · Pre → Main → Post → Listeners">
            <PhasePipelineEditor
              effect={draft}
              onChangePhases={(v) => patch({ phases: v })}
              onChangeResponseChain={(v) => patch({ response_chain: v })}
              refs={refs}
            />
          </Section>

          <Section title="黑板 Blackboard">
            <ListField
              label="变量名列表"
              value={Object.keys(draft.blackboard || {})}
              onChange={(keys) => patch({ blackboard: keys.reduce((acc, k) => ({ ...acc, [k]: (draft.blackboard || {})[k] || { type: 'number' } }), {}) })}
            />
          </Section>

          <Section title="调试事务时间线 Transaction Timeline">
            <TransactionTimeline effect={draft} />
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