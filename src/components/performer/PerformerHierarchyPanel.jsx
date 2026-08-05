import React from 'react';
import { Boxes, ChevronRight, CircleAlert } from 'lucide-react';
import { Section } from '@/components/ludots/ui';

function TreeNode({ performer, instance, path, parentPath, index, byKey, selectedPath, onSelect, depth = 0, trail = [] }) {
  if (!performer) return null;
  const cycle = trail.includes(performer.performer_id);
  const node = { performer, instance, path, parentPath, index };
  return <div>
    <button type="button" aria-label={`选择实例 ${path}: ${performer.label || performer.performer_id}`} onClick={() => onSelect(node)} style={{ paddingLeft: `${12 + depth * 18}px` }}
      className={`w-full h-9 flex items-center gap-2 border-b border-[#2A2E37] text-left text-xs ${selectedPath === path ? 'bg-[#303845] text-white' : 'text-gray-300 hover:bg-[#242A32]'}`}>
      {cycle ? <CircleAlert className="w-3.5 h-3.5 text-red-400" /> : depth ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" /> : <Boxes className="w-3.5 h-3.5 text-[#CBD3DC]" />}
      <span>{performer.label || performer.performer_id}</span>
      <span className="font-mono text-[10px] text-gray-500">{instance ? `实例 ${index + 1}` : performer.performer_id}</span>
    </button>
    {!cycle && (performer.children || []).map((child, childIndex) => {
      const childPath = `${path}/${childIndex}`;
      return <TreeNode key={childPath} performer={byKey.get(child.definition_id)} instance={child} path={childPath} parentPath={path} index={childIndex} byKey={byKey} selectedPath={selectedPath} onSelect={onSelect} depth={depth + 1} trail={[...trail, performer.performer_id]} />;
    })}
  </div>;
}

export default function PerformerHierarchyPanel({ root, records, selectedPath, onSelect }) {
  const byKey = new Map(records.map(item => [item.performer_id, item]));
  return <Section title="Prefab 层级"><div className="min-h-[480px] rounded border border-[#2A2E37] overflow-hidden"><TreeNode performer={root} path="root" byKey={byKey} selectedPath={selectedPath} onSelect={onSelect} /></div><p className="mt-2 text-[11px] text-gray-500">子节点是当前父级内的实例；选择它不会切换到子 Performer 定义。</p></Section>;
}