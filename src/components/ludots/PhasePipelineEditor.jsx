import React from 'react';
import { ArrowDown } from 'lucide-react';
import PhaseEditor from './PhaseEditor';
import ResponseChainEditor from './ResponseChainEditor';
import { PHASE_IDS, INSTANT_FORBIDDEN_PHASES, isDurableKind, normalizePhases, createDefaultResponseChain } from './phaseModel';

/**
 * 8 Phase 流程视图：
 * OnPropose → ResponseChain → OnCalculate → OnResolve → OnHit → OnApply → OnPeriod → OnExpire → OnRemove
 */
export default function PhasePipelineEditor({ effect, onChangePhases, onChangeResponseChain, refs }) {
  const phases = normalizePhases(effect.phases);
  const durable = isDurableKind(effect.lifetime);

  const updatePhase = (phaseId, next) => onChangePhases(phases.map(p => p.phase_id === phaseId ? next : p));

  return (
    <div className="space-y-1.5">
      <div className="text-[10px] text-gray-500 leading-relaxed">
        固定阶段顺序不可改动。自然到期：OnExpire → OnRemove；取消 / 强制移除：跳过 OnExpire、仍执行 OnRemove；
        Instant 在 OnApply 完成后同帧销毁，After / Infinite 创建持久实例。
      </div>
      {PHASE_IDS.map((id, idx) => {
        const phase = phases[idx];
        const forbidden = !durable && INSTANT_FORBIDDEN_PHASES.includes(id);
        return (
          <div key={id} className="contents">
            <PhaseEditor
              phase={phase}
              onChange={(next) => updatePhase(id, next)}
              refs={refs}
              forbidden={forbidden}
              forbiddenReason="Instant 效果没有周期与到期阶段；改为 After / Infinite 后可用。"
            />
            {id === 'on_propose' && (
              <>
                <div className="flex justify-center"><ArrowDown className="w-3 h-3 text-gray-600" /></div>
                <ResponseChainEditor
                  value={effect.response_chain || createDefaultResponseChain()}
                  onChange={onChangeResponseChain}
                  refs={refs}
                  selfEffectId={effect.effect_id}
                />
              </>
            )}
            {idx < PHASE_IDS.length - 1 && (
              <div className="flex justify-center"><ArrowDown className="w-3 h-3 text-gray-600" /></div>
            )}
          </div>
        );
      })}
    </div>
  );
}