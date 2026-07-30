import React from 'react';
import { Trash2 } from 'lucide-react';
import { NumberField, SelectField, TextField } from '@/components/ludots/ui';
import AbilityFieldDomain from './AbilityFieldDomain';
import EffectSelect from './EffectSelect';
import GameplayTagSelect from './GameplayTagSelect';

export const EXEC_ITEM_KINDS = ['EffectClip','TagClip','TagClipTarget','EffectSignal','EventSignal','GraphSignal','TagSignal','TagSignalTarget','InputGate','EventGate','TargetCollectionGate','End'];
const options = values => values.map(value => ({ value, label: value }));

export default function AbilityExecItemEditor({ item, index, callerParams = [], refs = {}, onChange, onRemove }) {
  const patch = next => onChange({ ...item, ...next });
  const kind = item.kind || 'End';
  const clip = kind.endsWith('Clip');
  const showTemplate = kind.startsWith('Effect') || item.template != null;
  const showTag = /Tag|Event/.test(kind) || item.tag != null;
  const showGraph = kind === 'GraphSignal' || item.graph != null;
  const showPayload = kind.endsWith('Gate') || item.payloadA != null;
  const paramIndex = item.callerParamsIdx;
  const paramCount = callerParams[paramIndex]?.entries?.length || 0;
  return <div className="space-y-3">
    <div className="flex items-center justify-between"><div><span className="text-xs font-semibold text-foreground">Exec Item #{index + 1}</span><span className="ml-2 text-[10px] text-muted-foreground">{kind}</span></div><button onClick={onRemove} className="text-muted-foreground hover:text-red-400" aria-label={`删除 Exec Item ${index + 1}`}><Trash2 className="h-4 w-4" /></button></div>
    <AbilityFieldDomain title="节点定义" meta="Definition" description="决定 Loader 使用哪一种原生 Exec Item。"><SelectField label="类型 kind" value={kind} options={options(EXEC_ITEM_KINDS)} onChange={value => patch({ kind: value })} /></AbilityFieldDomain>
    <AbilityFieldDomain title="时间域" meta="Timing" description="只负责时间轴位置、持续时间与时钟覆盖。"><NumberField label="时间点 tick" value={item.tick} onChange={tick => patch({ tick })} />{(clip || item.duration != null) && <NumberField label="持续 tick duration" value={item.duration} onChange={duration => patch({ duration })} />}<TextField label="覆盖时钟 clock" value={item.clock} onChange={clock => patch({ clock })} /></AbilityFieldDomain>
    {kind !== 'End' && <AbilityFieldDomain title="载荷域" meta="Payload" description="Clip / Signal 的业务载荷，不包含透传参数。">{showTemplate && <EffectSelect label="Effect 模板 template" value={item.template} effects={refs.effects || []} onChange={template => patch({ template })} />}{showTag && <GameplayTagSelect label="标签 / 事件 tag" value={item.tag} tags={refs.tags || []} onChange={tag => patch({ tag })} />}{showGraph && <TextField label="Graph 程序 graph" value={item.graph} onChange={graph => patch({ graph })} />}{showPayload && <NumberField label="载荷 payloadA" value={item.payloadA} onChange={payloadA => patch({ payloadA })} />}</AbilityFieldDomain>}
    {kind !== 'End' && <AbilityFieldDomain title="上下文域" meta="Dispatch" description="决定载荷映射到 Source、Target 或 TargetContext。"><SelectField label="分发目标 dispatchTarget" value={item.dispatchTarget} options={options(['Default','Source','Target','TargetContext'])} onChange={dispatchTarget => patch({ dispatchTarget })} /></AbilityFieldDomain>}
    {kind !== 'End' && <AbilityFieldDomain title="参数透传" meta="Caller Params" description={paramIndex == null ? '尚未引用参数组。' : `引用参数组 ${paramIndex} · ${paramCount} 个 Key / Value`}><SelectField label="参数组索引 callerParamsIdx" value={paramIndex == null ? undefined : String(paramIndex)} options={options(['0','1','2','3'])} onChange={value => patch({ callerParamsIdx: Number(value) })} /></AbilityFieldDomain>}
  </div>;
}