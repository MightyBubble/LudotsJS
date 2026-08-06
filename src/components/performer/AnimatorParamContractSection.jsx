import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, CircleMinus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ludots/ui';
import {
  animatorControllerKey,
  collectPerformerParamSupplies,
  defaultValueForRow,
  getAnimatorParamRequirements,
  getParamSupplyStatus,
  isNoneParamKey,
} from './animatorParamContract';

function sameParamLane(a, b) {
  return a?.paramKey === b?.paramKey && a?.lane === b?.lane;
}

function hasParamDefault(paramDefaults, row) {
  return (paramDefaults || []).some(item => sameParamLane(item, row));
}

function addParamDefault(paramDefaults, row) {
  if (hasParamDefault(paramDefaults, row)) return paramDefaults || [];
  return [...(paramDefaults || []), defaultValueForRow(row)];
}

function statusBadge(status) {
  if (status.kind === 'ready') return <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Provided</Badge>;
  if (status.kind === 'writeOnly') return <Badge variant="outline" className="border-sky-500/30 text-sky-300">Animator writes</Badge>;
  if (status.kind === 'mismatch') return <Badge variant="destructive">Lane mismatch</Badge>;
  if (status.kind === 'missing') return <Badge variant="destructive">Missing</Badge>;
  if (status.kind === 'optionalMismatch') return <Badge variant="outline" className="border-amber-500/30 text-amber-300">Optional mismatch</Badge>;
  return <Badge variant="outline">Declared only</Badge>;
}

function statusIcon(status) {
  if (status.kind === 'ready') return <CheckCircle2 className="h-4 w-4 text-emerald-300" />;
  if (status.kind === 'writeOnly' || status.kind === 'optional') return <CircleMinus className="h-4 w-4 text-sky-300" />;
  return <AlertTriangle className="h-4 w-4 text-amber-300" />;
}

function usageText(row) {
  return row.usages.map(usage => usage.label).join(', ') || 'Controller parameter';
}

function sourceText(status) {
  if (!status.sources.length) return '';
  return status.sources
    .map(source => `${source.scope}: ${source.kind} (${source.lane})`)
    .join(', ');
}

function ContractRow({ row, status, canAddDefault, onAddDefault }) {
  const sources = sourceText(status);
  return (
    <div className="grid grid-cols-1 gap-3 border border-[#2A2E37] bg-[#0D0F14] p-3 lg:grid-cols-[minmax(180px,1fr)_90px_150px_minmax(220px,1.4fr)_auto] lg:items-center">
      <div className="flex min-w-0 items-center gap-2">
        {statusIcon(status)}
        <div className="min-w-0">
          <div className="truncate font-mono text-xs text-[#E2D8B3]">{row.paramKey}</div>
          <div className="truncate text-[10px] text-gray-500">{usageText(row)}</div>
        </div>
      </div>
      <div className="text-xs text-gray-300">{row.lane}</div>
      <div>{statusBadge(status)}</div>
      <div className="min-w-0 text-[11px] text-gray-500">
        {sources || (row.writeOnly ? 'Animator writes this key back to the Performer blackboard.' : 'No Performer value source is configured.')}
      </div>
      <div className="flex justify-end">
        {canAddDefault && (
          <Button size="sm" variant="outline" onClick={onAddDefault} className="h-7 border-[#424a55] bg-[#15171C] text-xs">
            <Plus className="h-3.5 w-3.5" />
            补齐默认值
          </Button>
        )}
      </div>
    </div>
  );
}

function analyzeAnimatorBehavior(behavior, index, controllerRows, performer, performerRows) {
  const animator = behavior?.animator || {};
  const controllerId = animatorControllerKey(animator);
  const controller = controllerRows.find(item => item.controller_id === controllerId);
  const requirements = controller
    ? getAnimatorParamRequirements(controller, animator)
    : [];
  const supplies = collectPerformerParamSupplies(performer, performerRows);
  const rows = requirements.map(row => ({
    row,
    status: getParamSupplyStatus(row, supplies),
  }));
  const blocking = rows.filter(item => item.row.required && ['missing', 'mismatch'].includes(item.status.kind)).length;

  return {
    index,
    slot: behavior?.slot || `animator_${index}`,
    controllerId,
    controller,
    rows,
    blocking,
  };
}

export default function AnimatorParamContractSection({ draft, refs = {}, patch }) {
  const paramDefaults = draft.paramDefaults || [];
  const animatorBehaviors = (draft.behaviors || []).filter(behavior => behavior?.kind === 'Animator');
  const controllerRows = refs.raw?.controllers || [];
  const performerRows = refs.raw?.performers || [];
  const analyses = useMemo(
    () => animatorBehaviors.map((behavior, index) => analyzeAnimatorBehavior(behavior, index, controllerRows, draft, performerRows)),
    [animatorBehaviors, controllerRows, draft, performerRows],
  );

  const addDefault = row => {
    patch({ paramDefaults: addParamDefault(paramDefaults, row) });
  };

  const addRequiredDefaults = () => {
    let next = paramDefaults;
    analyses.forEach(analysis => {
      analysis.rows.forEach(({ row, status }) => {
        if (row.required && !row.writeOnly && ['missing', 'mismatch'].includes(status.kind)) {
          next = addParamDefault(next, row);
        }
      });
    });
    if (next !== paramDefaults) patch({ paramDefaults: next });
  };

  const totalBlocking = analyses.reduce((sum, item) => sum + item.blocking, 0);
  const canAddRequiredDefaults = totalBlocking > 0;

  return (
    <Section
      title="Animator Param Contract"
      right={canAddRequiredDefaults && (
        <Button size="sm" onClick={addRequiredDefaults} className="h-7 bg-[#1E2128] hover:bg-[#2A2E37]">
          <Plus className="h-3.5 w-3.5" />
          补齐必需默认值
        </Button>
      )}
    >
      <p className="text-xs text-gray-500">
        Animator 只读取 Performer 黑板里同名参数。缺失的读取项，只应通过补 Performer 默认值，或手动配置一个已有供值来源来解决，不会自动新增 AttributeBinding。
      </p>

      {animatorBehaviors.length === 0 && (
        <div className="border border-dashed border-[#424a55] bg-[#0D0F14] p-4 text-center text-xs text-gray-500">
          No Animator behavior on this Performer.
        </div>
      )}

      {analyses.map(analysis => (
        <div key={`${analysis.slot}_${analysis.index}`} className="flex flex-col gap-2 border border-[#2A2E37] bg-[#15171C] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="font-mono text-xs text-[#E2D8B3]">{analysis.slot}</div>
              <div className="text-[11px] text-gray-500">
                {analysis.controllerId || 'No controller selected'}
              </div>
            </div>
            {analysis.blocking > 0
              ? <Badge variant="destructive">{analysis.blocking} missing</Badge>
              : <Badge variant="secondary" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Ready</Badge>}
          </div>

          {!analysis.controller && !isNoneParamKey(analysis.controllerId) && (
            <div className="border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Controller not found in AnimatorControllerDefinition.
            </div>
          )}

          {analysis.controller && analysis.rows.length === 0 && (
            <div className="border border-dashed border-[#424a55] bg-[#0D0F14] p-4 text-center text-xs text-gray-500">
              This controller has no readable Animator params.
            </div>
          )}

          {analysis.rows.map(({ row, status }) => {
            const canAddDefault = !row.writeOnly && status.kind !== 'ready' && !hasParamDefault(paramDefaults, row);
            return (
              <ContractRow
                key={`${analysis.index}_${row.paramKey}_${row.lane}`}
                row={row}
                status={status}
                canAddDefault={canAddDefault}
                onAddDefault={() => addDefault(row)}
              />
            );
          })}
        </div>
      ))}
    </Section>
  );
}

