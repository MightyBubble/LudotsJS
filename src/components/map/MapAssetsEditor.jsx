import React from 'react';
import { Section, BoolField, ListField, NumberField, TextField } from '@/components/ludots/ui';
import JsonValueField from '@/components/ludots/JsonValueField';

export default function MapAssetsEditor({ value, patch }) {
  const heightmap = value.visual_heightmap || { asset: '', board_name: 'default', default_layer_index: 0 };
  const setHeightmap = next => patch({ visual_heightmap: { ...heightmap, ...next } });
  return <>
    <Section title="依赖与元数据"><ListField label="Tags" value={value.tags} onChange={tags => patch({ tags })} /><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><JsonValueField label="Dependencies (JSON Object)" value={value.dependencies} onChange={dependencies => patch({ dependencies: dependencies || {} })} /><JsonValueField label="Metadata (JSON Object)" value={value.metadata} onChange={metadata => patch({ metadata: metadata || {} })} /></div></Section>
    <Section title="地图空间资产">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3"><TextField label="Visual Heightmap Asset" value={value.visual_heightmap_asset} onChange={visual_heightmap_asset => patch({ visual_heightmap_asset })} /><TextField label="Structure Collision Asset" value={value.structure_collision_asset} onChange={structure_collision_asset => patch({ structure_collision_asset })} /></div>
      <div className="flex gap-5"><BoolField label="Structure-aware Grounding" value={value.structure_aware_grounding} onChange={structure_aware_grounding => patch({ structure_aware_grounding })} /><BoolField label="Structure-aware Navigation" value={value.structure_aware_navigation} onChange={structure_aware_navigation => patch({ structure_aware_navigation })} /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><TextField label="Heightmap Binding Asset" value={heightmap.asset} onChange={asset => setHeightmap({ asset })} /><TextField label="Board Name" value={heightmap.board_name} onChange={board_name => setHeightmap({ board_name })} /><NumberField label="Default Layer Index" value={heightmap.default_layer_index} onChange={default_layer_index => setHeightmap({ default_layer_index })} /></div>
    </Section>
  </>;
}