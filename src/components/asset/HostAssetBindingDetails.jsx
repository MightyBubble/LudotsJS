import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section, TextField, SelectField, ListField } from '@/components/ludots/ui';
import ModelPreview from './ModelPreview';

const KINDS = ['Mesh', 'SkinnedMesh', 'Decal', 'Sound', 'Material', 'Spline'];

export default function HostAssetBindingDetails({ draft, patch }) {
  const { data: assets = [] } = useQuery({ queryKey: ['assets'], queryFn: () => base44.entities.Asset.list() });
  const linked = assets.find(a => a.asset_id === draft.editor_asset_id);

  return <div className="space-y-4 max-w-3xl">
    <Section title="宿主资源绑定">
      <p className="text-xs text-gray-500">host_assets.json：把逻辑资产 id 映射到具体渲染/音频后端的宿主资源文件。</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Binding ID" value={draft.binding_id} onChange={binding_id => patch({ binding_id })} />
        <SelectField label="Asset Kind" value={draft.asset_kind} options={KINDS.map(value => ({ value, label: value }))} onChange={asset_kind => patch({ asset_kind })} />
        <TextField label="Asset ID" hint="mesh_assets / animation_clips 等表中的逻辑 id" value={draft.asset_id} onChange={asset_id => patch({ asset_id })} />
        <TextField label="Backend ID" hint="raylib / browser" value={draft.backend_id} onChange={backend_id => patch({ backend_id })} />
      </div>
      <ListField label="Source URIs" value={draft.source_uris} onChange={source_uris => patch({ source_uris })} />
    </Section>

    <Section title="编辑器预览资源（不导出）">
      <SelectField label="关联 Asset" value={draft.editor_asset_id || ''}
        options={[{ value: '', label: '（未关联）' }, ...assets.map(a => ({ value: a.asset_id, label: `${a.name} · ${a.asset_type}` }))]}
        onChange={editor_asset_id => patch({ editor_asset_id })} />
      {linked?.asset_type === 'audio' && linked.uri && <audio controls src={linked.uri} className="w-full h-8" />}
      {linked?.asset_type === 'model' && <ModelPreview uri={linked.uri} />}
      {linked?.asset_type === 'image' && linked.uri && <img src={linked.uri} alt={linked.name} className="max-h-48 rounded border border-[#2A2E37]" />}
    </Section>
  </div>;
}