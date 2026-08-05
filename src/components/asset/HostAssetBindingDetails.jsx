import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Section, TextField, SelectField } from '@/components/ludots/ui';
import ModelPreview from './ModelPreview';
import ReferenceSelect from '@/components/presentation/ReferenceSelect';
import usePresentationRefs from '@/components/presentation/usePresentationRefs';
import { getSourceFileName } from '@/lib/assets/sourceFileName';

const KINDS = ['Mesh', 'SkinnedMesh', 'Decal', 'Sound', 'Material', 'Spline', 'Vfx'];

const sourceTypes = { Mesh: ['model'], SkinnedMesh: ['model'], Decal: ['image'], Sound: ['audio'], Material: ['material', 'image'], Spline: ['data'], Vfx: ['particle'] };

export default function HostAssetBindingDetails({ draft, patch }) {
  const { data: assets = [] } = useQuery({ queryKey: ['assets'], queryFn: () => base44.entities.Asset.list() });
  const linked = assets.find(a => a.asset_id === draft.editor_asset_id);
  const refs = usePresentationRefs();
  const allowedSources = assets.filter(asset => (sourceTypes[draft.asset_kind] || []).includes(asset.asset_type));
  const logicalOptions = draft.asset_kind === 'Material' ? refs.materials : draft.asset_kind === 'Vfx' ? refs.vfxAssets : refs.meshes;
  const selectSource = editor_asset_id => {
    const asset = assets.find(item => item.asset_id === editor_asset_id);
    patch({ editor_asset_id, source_uris: asset?.uri ? [asset.uri] : [] });
  };

  return <div className="space-y-4 max-w-3xl">
    <Section title="宿主资源绑定">
      <p className="text-xs text-gray-500">host_assets.json：把逻辑资产 id 映射到具体渲染/音频后端的宿主资源文件。</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <TextField label="Binding ID" value={draft.binding_id} onChange={binding_id => patch({ binding_id })} />
        <SelectField label="Asset Kind" value={draft.asset_kind} options={KINDS.map(value => ({ value, label: value }))} onChange={asset_kind => patch({ asset_kind })} />
        <ReferenceSelect label="Asset ID" hint="按 Asset Kind 过滤逻辑资产" value={draft.asset_id} options={logicalOptions} onChange={asset_id => patch({ asset_id })} />
        <SelectField label="Backend ID" value={draft.backend_id} options={['browser', 'raylib', 'ue5'].map(value => ({ value, label: value }))} onChange={backend_id => patch({ backend_id })} />
      </div>
      <ReferenceSelect label="Source Asset" hint="自动写入 URI，不显示不兼容资源" value={draft.editor_asset_id} options={allowedSources.map(asset => ({ value: asset.asset_id, label: getSourceFileName(asset) }))} onChange={selectSource} />
      <div className="break-all border border-[#2A2E37] bg-[#0D0F14] px-3 py-2 font-mono text-[11px] text-gray-400">{draft.source_uris?.[0] || '选择源资源后自动生成 URI'}</div>
    </Section>

    <Section title="编辑器预览资源（不导出）">
      <ReferenceSelect label="关联 Asset" value={draft.editor_asset_id}
        options={assets.map(a => ({ value: a.asset_id, label: getSourceFileName(a) }))}
        onChange={editor_asset_id => patch({ editor_asset_id })} />
      {linked?.asset_type === 'audio' && linked.uri && <audio controls src={linked.uri} className="w-full h-8" />}
      {linked?.asset_type === 'model' && <ModelPreview uri={linked.uri} />}
      {linked?.asset_type === 'image' && linked.uri && <img src={linked.uri} alt={linked.name} className="max-h-48 rounded border border-[#2A2E37]" />}
    </Section>
  </div>;
}