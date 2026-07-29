import React from 'react';
import { Radio } from 'lucide-react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import { Section, TextField, SelectField, NumberField, BoolField } from '@/components/ludots/ui';
import RefListSelector from '@/components/ludots/RefListSelector';
import TriggerRequestsEditor from '@/components/ludots/TriggerRequestsEditor';

const OPT = (arr) => arr.map(v => ({ value: v, label: v }));
const COMPARATORS = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte'];

export default function TriggerLibraryPage() {
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'TriggerDefinition', 'triggerDefinitions',
    () => ({ trigger_id: `trigger_${Date.now()}`, name: '新触发器', trigger_type: 'event', scope: 'owner', requirements: [], config: {}, cooldown: 0, once_per_event: false, is_active: true })
  );
  const refs = useCoreRefs();
  const config = draft?.config || {};
  const setConfig = (p) => patch({ config: { ...config, ...p } });

  // 反向引用：哪些 Effect / Ability 的 Hook 使用了该 Trigger
  const usedBy = draft ? [
    ...refs.effects.filter(e => (e.phases || []).some(p => (p.listeners || []).some(l => l.trigger_id === draft.trigger_id))).map(e => `效果：${e.name}`),
    ...refs.abilities.filter(a => (a.listeners || []).some(l => l.trigger_id === draft.trigger_id)).map(a => `能力：${a.name}`),
  ] : [];

  return (
    <RecordWorkspace
      title="触发器 Triggers" icon={Radio} entityName="TriggerDefinition"
      records={records}
      toItem={(r) => ({ id: r.id, name: r.name, subtitle: `${r.trigger_type} · ${r.scope || 'owner'}` })}
      selectedId={selectedId} onSelect={(r) => setSelectedId(r.id)}
      onCreate={create}
      onDelete={(r) => window.confirm(`确定删除「${r.name}」吗？`) && remove(r.id)}
      onSave={save} dirty={dirty}
    >
      {draft && (
        <div className="max-w-2xl">
          <Section title="基础 Basic">
            <TextField label="触发器 ID (trigger_id)" value={draft.trigger_id} onChange={(v) => patch({ trigger_id: v })} />
            <TextField label="名称" value={draft.name} onChange={(v) => patch({ name: v })} />
            <TextField label="描述" value={draft.description} onChange={(v) => patch({ description: v })} />
            <SelectField label="类型 trigger_type" value={draft.trigger_type} options={OPT(['event', 'tag_count', 'attribute_threshold', 'interval'])} onChange={(v) => patch({ trigger_type: v, config: {} })} />
            <SelectField label="作用域 scope" value={draft.scope || 'owner'} options={OPT(['owner', 'source', 'target', 'global'])} onChange={(v) => patch({ scope: v })} />
            <BoolField label="启用" value={draft.is_active !== false} onChange={(v) => patch({ is_active: v })} />
          </Section>

          <Section title="命中条件 Config">
            {draft.trigger_type === 'event' && (
              <SelectField label="订阅事件 event_id" value={draft.event_id} options={refs.events.map(e => ({ value: e.event_id, label: e.name }))} onChange={(v) => patch({ event_id: v })} />
            )}
            {draft.trigger_type === 'tag_count' && (
              <>
                <SelectField label="标签" value={config.tag_path} options={refs.tags.map(t => ({ value: t.full_path, label: t.full_path }))} onChange={(v) => setConfig({ tag_path: v })} />
                <SelectField label="比较符" value={config.operator || 'gte'} options={OPT(COMPARATORS)} onChange={(v) => setConfig({ operator: v })} />
                <NumberField label="阈值" value={config.count} onChange={(v) => setConfig({ count: v })} />
              </>
            )}
            {draft.trigger_type === 'attribute_threshold' && (
              <>
                <SelectField label="属性" value={config.attribute_id} options={refs.attributes.map(a => ({ value: a.attribute_id, label: a.name }))} onChange={(v) => setConfig({ attribute_id: v })} />
                <TextField label="属性键" value={config.attribute_key} onChange={(v) => setConfig({ attribute_key: v })} />
                <SelectField label="比较符" value={config.operator || 'lte'} options={OPT(COMPARATORS)} onChange={(v) => setConfig({ operator: v })} />
                <NumberField label="阈值" value={config.threshold} onChange={(v) => setConfig({ threshold: v })} />
              </>
            )}
            {draft.trigger_type === 'interval' && (
              <NumberField label="间隔（秒）" value={config.interval} onChange={(v) => setConfig({ interval: v })} />
            )}
          </Section>

          <Section title="过滤与节流">
            <RefListSelector label="前置需求 requirements" value={draft.requirements || []} options={refs.requirements.map(r => ({ value: r.requirement_id, label: r.name }))} onChange={(v) => patch({ requirements: v })} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="节流 cooldown（秒）" value={draft.cooldown} onChange={(v) => patch({ cooldown: v })} />
              <NumberField label="最大命中次数 max_activations" value={draft.max_activations} onChange={(v) => patch({ max_activations: v })} />
            </div>
            <BoolField label="同一事件仅命中一次 once_per_event" value={!!draft.once_per_event} onChange={(v) => patch({ once_per_event: v })} />
            <p className="text-[10px] text-gray-600">Trigger 只负责过滤、比较、计数、节流与去重，不修改任何状态。</p>
          </Section>

          <Section title="发起请求 Requests">
            <TriggerRequestsEditor requests={draft.requests || []} onChange={(v) => patch({ requests: v })} refs={refs} />
          </Section>

          <Section title="被引用于">
            {usedBy.length === 0
              ? <p className="text-[11px] text-gray-600">暂无 Hook 引用</p>
              : usedBy.map((t, i) => <p key={i} className="text-[11px] text-gray-300">{t}</p>)}
            <p className="text-[10px] text-gray-600 mt-1">Trigger → Request → Phase pipeline → Listener → 新 Request 入队。</p>
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}