export const TIMELINE_KINDS = [
  'EffectClip','TagClip','TagClipTarget','EffectSignal','EventSignal','GraphSignal',
  'TagSignal','TagSignalTarget','InputGate','EventGate','TargetCollectionGate','End',
];

export const KIND_STYLE = {
  EffectClip: 'border-cyan-500/70 bg-cyan-950/80 text-cyan-100',
  TagClip: 'border-violet-500/70 bg-violet-950/80 text-violet-100',
  TagClipTarget: 'border-violet-400/70 bg-violet-950/80 text-violet-100',
  EffectSignal: 'border-sky-500/70 bg-sky-950/80 text-sky-100',
  EventSignal: 'border-amber-500/70 bg-amber-950/80 text-amber-100',
  GraphSignal: 'border-emerald-500/70 bg-emerald-950/80 text-emerald-100',
  TagSignal: 'border-fuchsia-500/70 bg-fuchsia-950/80 text-fuchsia-100',
  TagSignalTarget: 'border-fuchsia-400/70 bg-fuchsia-950/80 text-fuchsia-100',
  InputGate: 'border-orange-500/70 bg-orange-950/80 text-orange-100',
  EventGate: 'border-yellow-500/70 bg-yellow-950/80 text-yellow-100',
  TargetCollectionGate: 'border-lime-500/70 bg-lime-950/80 text-lime-100',
  End: 'border-red-500/70 bg-red-950/80 text-red-100',
};

export const itemEnd = item => Math.max(0, item.tick || 0) + Math.max(0, item.duration || 0);
export const timelineEnd = items => Math.max(60, ...items.map(itemEnd), 0) + 10;
export const itemSummary = item => item.template || item.graph || item.tag || item.kind;

export function createTimelineItem(kind, items) {
  const nonEnd = items.filter(item => item.kind !== 'End');
  const tick = Math.max(0, ...nonEnd.map(itemEnd));
  const item = { kind, tick };
  if (kind.endsWith('Clip')) item.duration = 10;
  if (kind === 'InputGate') item.payloadA = 0;
  return item;
}