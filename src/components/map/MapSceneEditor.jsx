import React, { useState } from 'react';
import EntityTemplateList from '@/components/playground/EntityTemplateList';
import MapEditorViewport from './MapEditorViewport';
import MapEntityInspector from './MapEntityInspector';

export default function MapSceneEditor({ entities = [], boards = [], prototypes = [], onChange }) {
  const [templateId, setTemplateId] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const board = boards[0] || {};
  const template = prototypes.find(p => p.id === templateId);
  const grid = { width: board.width_in_macro_tiles || 64, height: board.height_in_macro_tiles || 64 };

  const place = cell => {
    if (!template) return;
    const base = template.prototype_id || 'entity';
    let instance_id = `${base}_1`;
    for (let i = 1; entities.some(e => e.instance_id === instance_id); i += 1) instance_id = `${base}_${i + 1}`;
    onChange([...entities, { instance_id, template: base, position: cell, overrides: {}, performer_param_overrides: [] }]);
    setSelectedId(instance_id);
  };
  const patch = (id, next) => {
    onChange(entities.map(e => e.instance_id === id ? { ...e, ...next } : e));
    if (next.instance_id) setSelectedId(next.instance_id);
  };
  const remove = id => {
    onChange(entities.filter(e => e.instance_id !== id));
    setSelectedId(null);
  };

  return <div className="flex flex-col min-h-0 h-[560px] rounded border border-[#2A2E37] bg-[#0D0F14] overflow-hidden">
    <div className="px-3 py-2 border-b border-[#2A2E37] flex items-center justify-between">
      <span className="text-xs font-semibold text-[#E2D8B3]">地图场景 · {board.name || 'default'} · {grid.width}×{grid.height}</span>
      <span className="text-[10px] text-gray-500">{template ? `放置中：${template.name || template.prototype_id}` : '选择实体模板后点击场景放置'}</span>
    </div>
    <div className="flex-1 min-h-0 flex">
      <EntityTemplateList templates={prototypes} selectedId={templateId} onSelect={setTemplateId} />
      <MapEditorViewport grid={grid} entities={entities} placing={Boolean(template)} selectedId={selectedId} onPlace={place} />
      <MapEntityInspector entities={entities} selectedId={selectedId} onSelect={setSelectedId} onPatch={patch} onRemove={remove} />
    </div>
  </div>;
}