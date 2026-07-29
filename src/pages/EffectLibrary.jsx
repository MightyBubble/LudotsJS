import React from 'react';
import { Sparkles } from 'lucide-react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import { Section, TextField, SelectField, ListField, NumberField, BoolField } from '@/components/ludots/ui';
import ValueSourceEditor from '@/components/ludots/ValueSourceEditor';
import TargetResolverEditor from '@/components/ludots/TargetResolverEditor';
import RefListSelector from '@/components/ludots/RefListSelector';
import OperationsEditor from '@/components/ludots/OperationsEditor';
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
      effect_id: `effect_${Date.now()}`, name: '新效果', is_active: true, tags: [],
      lifetime: { kind: 'instant', expiration_requirements: [] },
      application: { stacking: 'none', overflow: 'reject', duration_refresh: 'never', period_reset: 'never' },
      target: { kind: 'self' }, requirements: [],
      phases: createDefaultPhases(), response_chain: createDefaultResponseChain(),
      blackboard: {},
    })
  );
  const refs = useCoreRefs();
  const lifetime = draft?.lifetime || {};
  const application = draft?.application || {};
  const durable = isDurableKind(lifetime.kind);
  const issues = draft ? validateEffect(draft, refs) : [];
  const errorCount = issues.filter(i => i.severity === 'error').length;

  const setLifetime = (p) => patch({ lifetime: { ...lifetime, ...p } });
  const setApplication = (p) => patch({ application: { ...application, ...p } });

  return (
    <RecordWorkspace
      title="效果 Effects" icon={Sparkles} entityName="Effect"
      records={records}
      toItem={(r) => ({ id: r.id, name: r.name, subtitle: `${r.lifetime?.kind || 'instant'} · ${(r.phases || []).filter(p => p.enabled).length} phases` })}
      selectedId={selectedId} onSelect={(r) => setSelectedId(r.id)}
      onCreate={create}
      onDelete={(r) => window.confirm(`确定删除「${r.name}」吗？`) && remove(r.id)}
      onSave={save} dirty={dirty}
      headerRight={draft && (
        <span className={`text-[11px] mr-2 ${errorCount ? 'text-red-400' : 'text-green-500'}`}>
          {errorCount ? `${errorCount} 个错误` : '校验通过'}
        </span>
      )}
    >
      {draft && (
        <div className="max-w-3xl">
          <Section title="基础 Basic">
            <TextField label="效果 ID (effect_id)" value={draft.effect_id} onChange={(v) => patch({ effect_id: v })} />
            <TextField label="名称" value={draft.name} onChange={(v) => patch({ name: v })} />
            <TextField label="描述" value={draft.description} onChange={(v) => patch({ description: v })} />
            <ListField label="效果标签" value={draft.tags} onChange={(v) => patch({ tags: v })} />
            <BoolField label="启用" value={draft.is_active !== false} onChange={(v) => patch({ is_active: v })} />
          </Section>

          <Section title="生命周期 Lifetime（EffectLifetimeKind）">
            <SelectField
              label="kind"
              value={lifetime.kind || 'instant'}
              options={LIFETIME_KINDS}
              onChange={(v) => setLifetime({ kind: v })}
              hint="after 与 infinite 都是 Durable Effect；条件/Tag 驱动移除与 kind 正交"
            />
            {lifetime.kind === 'after' && (
              <ValueSourceEditor label="持续时间 duration" value={lifetime.duration || {}} onChange={(v) => setLifetime({ duration: v })} attributes={refs.attributes} constants={refs.constants} dataGraphs={refs.dataGraphs} />
            )}
            {durable && (
              <ValueSourceEditor label="周期 period（可选）" value={lifetime.period || {}} onChange={(v) => setLifetime({ period: v })} attributes={refs.attributes} constants={refs.constants} dataGraphs={refs.dataGraphs} />
            )}
            <RefListSelector
              label="到期需求 expirationRequirements"
              value={lifetime.expiration_requirements || []}
              options={refs.requirements.map(r => ({ value: r.requirement_id, label: r.name }))}
              onChange={(v) => setLifetime({ expiration_requirements: v })}
            />
            <p className="text-[10px] text-gray-600">
              条件/Tag 驱动的移除通过 expirationRequirements 或 Trigger 发起 remove 请求，不作为 lifetime kind。
              {!durable && ' instant 不允许 period 与到期/周期阶段。'}
            </p>
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

          {(draft.operations || []).length > 0 && (
            <Section title="[旧版兼容] 平铺 Operations">
              <p className="text-[10px] text-yellow-500">该字段仅为兼容旧记录保留，新配置请使用上方 Phase 流程。</p>
              <OperationsEditor operations={draft.operations || []} onChange={(v) => patch({ operations: v })} refs={refs} />
            </Section>
          )}
        </div>
      )}
    </RecordWorkspace>
  );
}