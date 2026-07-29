import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SelectField } from './ui';
import {
  PHASE_IDS, PHASE_META, isDurableKind, normalizePhases,
  TRANSACTION_STAGES, ROLLBACK_STAGES, DESTROY_STATES,
} from './phaseModel';

const PATHS = [
  { value: 'natural_expire', label: '自然到期（OnExpire → OnRemove）' },
  { value: 'forced_remove', label: '取消 / 强制移除（跳过 OnExpire）' },
  { value: 'entity_destroy', label: '实体销毁清理（只 OnRemove）' },
  { value: 'failure', label: '事务失败回滚' },
];

/**
 * 调试事务时间线（模拟表达，非生产运行时）：
 * Begin → snapshot → phases → stage side effects → validate → prepare →
 * playback structural → write state → commit external → finalize destroys → End
 */
export default function TransactionTimeline({ effect }) {
  const [path, setPath] = useState('natural_expire');
  const [ran, setRan] = useState(false);
  const durable = isDurableKind(effect?.lifetime);

  const events = useMemo(() => {
    if (!effect) return [];
    const phases = normalizePhases(effect.phases);
    const rc = effect.response_chain || {};
    const list = [];
    const push = (stage, detail, level = 'info') => list.push({ stage, detail, level });

    push('begin', `Begin Transaction · correlationId=corr_${effect.effect_id} · causationId=root`);
    push('snapshot', 'Snapshot world / state + checkpoints');

    const activePhases = PHASE_IDS.filter(id => {
      const p = phases.find(x => x.phase_id === id);
      if (!p?.enabled) return false;
      if (!durable && (id === 'on_period' || id === 'on_expire')) return false;
      if (id === 'on_period' && path !== 'natural_expire') return false;
      if (id === 'on_expire' && path !== 'natural_expire') return false;
      return true;
    });

    activePhases.forEach(id => {
      const p = phases.find(x => x.phase_id === id);
      push('execute_phases', `${PHASE_META[id].label} · Pre(${(p.pre_action_graph_ids || []).length}) → Main(${p.main?.mode || 'none'}) → Post(${(p.post_action_graph_ids || []).length})`);
      if (id === 'on_propose' && rc.enabled) {
        push('execute_phases', `ResponseChain 窗口 · entries=${(rc.entries || []).length} · maxDepth=${rc.max_depth} · maxResponses=${rc.max_responses} · budget=${rc.root_budget}`);
        (rc.entries || []).forEach(e => push('execute_phases', `  ResponseChain: ${e.name} → ${e.action}`));
      }
      (p.listeners || []).forEach(l => push('stage_side_effects', `Listener「${l.name}」(${l.scope}) 入队 ${(l.responses || []).map(r => r.response_type).join(', ') || '无响应'}`));
      if ((p.main?.mode || 'none') !== 'none') push('stage_side_effects', `${PHASE_META[id].label} 的副作用进入 CommandBuffer（对当前遍历不可见）`);
      if (id === 'on_apply') {
        push('stage_side_effects', durable ? '创建持久 ActiveEffect 实例（after / infinite）' : 'Instant：Apply 完成后同帧销毁实例');
      }
    });

    if (path === 'forced_remove') push('execute_phases', 'Cancel / ForcedRemove：跳过 OnExpire，仍执行 OnRemove', 'warn');
    if (path === 'entity_destroy') {
      DESTROY_STATES.forEach(s => push('stage_side_effects', `Entity Lifecycle: ${s}`));
      push('stage_side_effects', 'Cleanup: ActiveEffect / Tag contribution / Listener / Relation / Ability execution / Blackboard 引用');
      push('stage_side_effects', '销毁清理持久 Effect 执行 OnRemove，不执行 OnExpire', 'warn');
    }

    push('validate', 'Validate staged commands（引用有效性、递归预算、销毁幂等）');

    if (path === 'failure') {
      push('validate', '校验失败：staged command 无效', 'error');
      ROLLBACK_STAGES.forEach(s => push(s.key, s.label, 'error'));
      push('end', 'End Transaction · 状态已恢复，实体保持 Alive', 'error');
      return list;
    }

    push('prepare', 'Prepare');
    push('playback_structural', 'Playback structural commands（Add/Remove Component、Spawn）');
    push('write_state', 'Write state（Tag / Attribute / Blackboard）');
    push('commit_external', 'Commit external queues / events（Effect Request、Ability Request、Event）');
    push('finalize_destroys', path === 'entity_destroy' ? 'Finalize Destroy：实体句柄失效，旧 handle/generation 不可再用' : 'Finalize Destroys（本次无待销毁实体）');
    push('end', 'End Transaction · Commit 完成');
    return list;
  }, [effect, path, durable]);

  const stageLabel = (key) =>
    TRANSACTION_STAGES.find(s => s.key === key)?.label || ROLLBACK_STAGES.find(s => s.key === key)?.label || key;

  return (
    <div className="space-y-2">
      <SelectField label="模拟路径" value={path} options={PATHS} onChange={(v) => { setPath(v); setRan(false); }} />
      <Button onClick={() => setRan(true)} size="sm" className="h-7 bg-[#D97706] hover:bg-[#B45309] text-black text-xs">
        <Play className="w-3 h-3 mr-1" />运行时间线
      </Button>

      {ran && (
        <div className="border border-[#2A2E37] rounded bg-[#0D0F14] divide-y divide-[#2A2E37]">
          {events.map((e, i) => (
            <div key={i} className="flex gap-2 px-2 py-1">
              <span className="text-[10px] text-gray-600 w-6 text-right font-mono">{i + 1}</span>
              <span className="text-[10px] text-[#D97706] w-44 shrink-0 font-mono truncate">{stageLabel(e.stage)}</span>
              <span className={`text-[11px] flex-1 ${e.level === 'error' ? 'text-red-400' : e.level === 'warn' ? 'text-yellow-500' : 'text-gray-300'}`}>
                {e.detail}
              </span>
            </div>
          ))}
          <div className="px-2 py-1.5 flex items-center gap-2">
            {path === 'failure'
              ? <><AlertTriangle className="w-3.5 h-3.5 text-red-400" /><span className="text-[11px] text-red-400">Rollback 完成：外部写入 → 状态写入 → 结构命令 → 快照</span></>
              : <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /><span className="text-[11px] text-green-500">事务提交完成</span></>}
          </div>
        </div>
      )}
    </div>
  );
}