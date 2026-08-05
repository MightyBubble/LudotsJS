import React from 'react';
import { Boxes, ChevronRight, CircleAlert } from 'lucide-react';
import { Section } from '@/components/ludots/ui';

function TreeNode({ performer, byKey, selectedId, onSelect, depth = 0, trail = [] }) {
  if (!performer) return null;
  const cycle = trail.includes(performer.performer_id);
  return <div>
    <button type="button" onClick={() => onSelect(performer)} style={{ paddingLeft: `${12 + depth * 18}px` }}
      className={`w-full h-9 flex items-center gap-2 border-b border-[#2A2E37] text-left text-xs ${selectedId === performer.id ? 'bg-[#303845] text-white' : 'text-gray-300 hover:bg-[#242A32]'}`}>
      {cycle ? <CircleAlert className="w-3.5 h-3.5 text-red-400" /> : depth ? <ChevronRight className="w-3.5 h-3.5 text-gray-500" /> : <Boxes className="w-3.5 h-3.5 text-[#CBD3DC]" />}
      <span>{performer.label || performer.performer_id}</span>
      <span className="font-mono text-[10px] text-gray-500">{performer.performer_id}</span>
    </button>
    {!cycle && (performer.children || []).map((child, index) => <TreeNode key={`${child.definition_id}-${index}`} performer={byKey.get(child.definition_id)} byKey={byKey} selectedId={selectedId} onSelect={onSelect} depth={depth + 1} trail={[...trail, performer.performer_id]} />)}
  </div>;
}

export default function PerformerHierarchyPanel({ root, records, selectedId, onSelect }) {
  const byKey = new Map(records.map(item => [item.performer_id, item]));
  return <Section title="Prefab 层级"><div className="min-h-[480px] rounded border border-[#2A2E37] overflow-hidden"><TreeNode performer={root} byKey={byKey} selectedId={selectedId} onSelect={onSelect} /></div><p className="mt-2 text-[11px] text-gray-500">选择子孙节点，右侧预览保持完整 Prefab 并切换变换目标。</p></Section>;
}