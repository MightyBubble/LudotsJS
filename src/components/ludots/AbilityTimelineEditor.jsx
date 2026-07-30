import React, { useEffect, useState } from 'react';
import AbilityExecItemEditor from './AbilityExecItemEditor';
import AbilityTimelineItem from './AbilityTimelineItem';
import AbilityTimelineRuler from './AbilityTimelineRuler';
import AbilityTimelineToolbar from './AbilityTimelineToolbar';
import { createTimelineItem, itemEnd, timelineEnd } from './abilityTimelineModel';

export default function AbilityTimelineEditor({ items = [], onChange }) {
  const [selected, setSelected] = useState(items.length ? 0 : null);
  const [zoom, setZoom] = useState(8);
  useEffect(() => { if (selected != null && selected >= items.length) setSelected(items.length ? items.length - 1 : null); }, [items.length, selected]);
  const ticks = timelineEnd(items);
  const update = (index, item) => onChange(items.map((current, i) => i === index ? item : current));
  const add = kind => {
    const item = createTimelineItem(kind, items);
    const endTick = itemEnd(item);
    const next = items.map(current => current.kind === 'End' && current.tick < endTick ? { ...current, tick: endTick } : current);
    const insertAt = Math.max(0, next.findIndex(current => current.kind === 'End'));
    const output = next.some(current => current.kind === 'End') && kind !== 'End' ? [...next.slice(0, insertAt), item, ...next.slice(insertAt)] : [...next, item];
    onChange(output); setSelected(output.indexOf(item));
  };
  const remove = index => { onChange(items.filter((_, i) => i !== index)); setSelected(null); };
  return <div className="overflow-hidden rounded border border-[#2A2E37] bg-[#0D0F14]">
    <AbilityTimelineToolbar count={items.length} zoom={zoom} onZoom={setZoom} onAdd={add} />
    <div className="max-h-[28rem] overflow-auto">
      <div style={{ minWidth: 128 + ticks * zoom }}><AbilityTimelineRuler ticks={ticks} pixelsPerTick={zoom} />
        {items.map((item, index) => <AbilityTimelineItem key={index} item={item} index={index} selected={selected === index} pixelsPerTick={zoom} ticks={ticks} onSelect={() => setSelected(index)} onChange={next => update(index, next)} />)}
      </div>
    </div>
    {selected != null && items[selected] && <div className="border-t border-[#2A2E37] p-3"><AbilityExecItemEditor item={items[selected]} index={selected} onChange={next => update(selected, next)} onRemove={() => remove(selected)} /></div>}
    {!items.length && <p className="p-6 text-center text-xs text-muted-foreground">添加第一个 Exec Item 开始编排</p>}
  </div>;
}