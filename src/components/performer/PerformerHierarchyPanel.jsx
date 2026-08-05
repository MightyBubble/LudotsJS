import React, { useState } from 'react';
import { Boxes, ChevronRight, CircleAlert, GripVertical } from 'lucide-react';
import { Section } from '@/components/ludots/ui';

const childrenOf = (performer, instance) => instance?.children ?? performer?.children ?? [];

function TreeNode({ performer, instance, path, parentPath, index, byKey, selectedPath, onSelect, onMove, drop, setDrop, depth = 0, trail = [] }) {
  if (!performer) return null;
  const cycle = trail.includes(performer.performer_id);
  const node = { performer, instance, path, parentPath, index };
  const placement = drop?.path === path ? drop.placement : null;
  const choosePlacement = event => path === 'root' ? 'inside' : event.nativeEvent.offsetY < event.currentTarget.clientHeight * .25 ? 'before' : event.nativeEvent.offsetY > event.currentTarget.clientHeight * .75 ? 'after' : 'inside';
  return <div data-hierarchy-path={path}>
    <button type="button" draggable={path !== 'root'} aria-label={`选择实例 ${path}: ${performer.label || performer.performer_id}`}
      onClick={() => onSelect(node)} onDragStart={event => event.dataTransfer.setData('text/performer-path', path)} onDragEnd={() => setDrop(null)}
      onDragOver={event => { event.preventDefault(); setDrop({ path, placement: choosePlacement(event) }); }}
      onDrop={event => { event.preventDefault(); const source = event.dataTransfer.getData('text/performer-path'); if (source) onMove(source, path, choosePlacement(event)); setDrop(null); }}
      style={{ paddingLeft: `${12 + depth * 18}px` }}
      className={`relative w-full h-9 flex items-center gap-2 border-b text-left text-xs ${selectedPath === path ? 'bg-[#303845] text-white' : 'text-gray-300 hover:bg-[#242A32]'} ${placement === 'before' ? 'border-t-2 border-t-primary' : placement === 'after' ? 'border-b-2 border-b-primary' : placement === 'inside' ? 'ring-1 ring-inset ring-primary' : 'border-[#2A2E37]'}`}>
      {path !== 'root' && <GripVertical className="h-3.5 w-3.5 cursor-grab text-gray-500" />}
      {cycle ? <CircleAlert className="w-3.5 h-3.5 text-red-400" /> : depth ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" /> : <Boxes className="w-3.5 h-3.5 text-[#CBD3DC]" />}
      <span>{performer.label || performer.performer_id}</span><span className="font-mono text-[10px] text-gray-500">{instance ? `实例 ${index + 1}` : performer.performer_id}</span>
    </button>
    {!cycle && childrenOf(performer, instance).map((child, childIndex) => <TreeNode key={`${path}/${childIndex}`} performer={byKey.get(child.definition_id)} instance={child} path={`${path}/${childIndex}`} parentPath={path} index={childIndex} byKey={byKey} selectedPath={selectedPath} onSelect={onSelect} onMove={onMove} drop={drop} setDrop={setDrop} depth={depth + 1} trail={[...trail, performer.performer_id]} />)}
  </div>;
}

export default function PerformerHierarchyPanel({ root, records, selectedPath, onSelect, onMove }) {
  const [drop, setDrop] = useState(null);
  const byKey = new Map(records.map(item => [item.performer_id, item]));
  return <Section title="Prefab 层级"><div className="min-h-[480px] rounded border border-[#2A2E37] overflow-hidden"><TreeNode performer={root} path="root" byKey={byKey} selectedPath={selectedPath} onSelect={onSelect} onMove={onMove} drop={drop} setDrop={setDrop} /></div><p className="mt-2 text-[11px] text-gray-500">拖到节点中部可换父级，拖到上下边缘可排序；实例编辑不会切换定义页。</p></Section>;
}