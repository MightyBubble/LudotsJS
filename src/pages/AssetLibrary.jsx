import React from 'react';
import { useLocation } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import { Section, TextField, SelectField, ListField, NumberField, BoolField } from '@/components/ludots/ui';
import AssetGenerationPanel from '@/components/asset/AssetGenerationPanel';
import ModelPreview from '@/components/asset/ModelPreview';

const ASSET_TYPES = ['image', 'audio', 'model', 'animation', 'material', 'particle', 'prefab', 'data', 'script', 'other'];
const SOURCE_TYPES = ['uploaded', 'url', 'builtin', 'generated'];

const TYPE_LABELS = { model: '模型', animation: '动画', audio: '音效', image: '图像' };

export default function AssetLibraryPage() {
  const filterType = new URLSearchParams(useLocation().search).get('type') || '';
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'Asset', 'assets',
    () => ({ asset_id: `asset_${Date.now()}`, name: `新${TYPE_LABELS[filterType] || '资源'}`, asset_type: filterType || 'image', source_type: 'url', version: 1, is_active: true, tags: [] })
  );
  const visibleRecords = filterType ? records.filter(r => r.asset_type === filterType) : records;
  const { abilities } = useCoreRefs();

  const usedBy = draft ? abilities.filter(a => a.icon_asset_id === draft.asset_id) : [];

  const handleDelete = (rec) => {
    const refs = abilities.filter(a => a.icon_asset_id === rec.asset_id);
    if (refs.length > 0) {
      alert(`无法删除：仍被 ${refs.length} 个能力引用（${refs.map(r => r.name).join('、')}）`);
      return;
    }
    if (window.confirm(`确定删除「${rec.name}」吗？`)) remove(rec.id);
  };

  return (
    <RecordWorkspace
      entityName="Asset"
      records={visibleRecords}
      columns={[
        { key: 'asset_id', label: '资源ID', width: 200, render: (r) => <span className="font-mono text-[#E2D8B3]">{r.asset_id}</span> },
        { key: 'name', label: '名称', width: 160 },
        { key: 'asset_type', label: '类型', width: 100 },
        { key: 'source_type', label: '来源', width: 100 },
        { key: 'uri', label: '地址', render: (r) => <span className="truncate block max-w-[280px]">{r.uri || '-'}</span> },
        { key: 'version', label: '版本', width: 70 },
        { key: 'is_active', label: '启用', width: 70, render: (r) => (r.is_active !== false ? '是' : '否') },
      ]}
      toItem={(r) => ({ id: r.id, name: r.name, subtitle: `${r.asset_type} · ${r.source_type}${r.is_active === false ? ' · 停用' : ''}` })}
      selectedId={selectedId} onSelect={(r) => setSelectedId(r.id)}
      onCreate={create} onDelete={handleDelete} onSave={save} dirty={dirty}
    >
      {draft && (
        <div className="max-w-2xl">
          <Section title="基础信息">
            <TextField label="资源 ID (asset_id)" value={draft.asset_id} onChange={(v) => patch({ asset_id: v })} />
            <TextField label="名称" value={draft.name} onChange={(v) => patch({ name: v })} />
            <TextField label="描述" value={draft.description} onChange={(v) => patch({ description: v })} />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="资源类型" value={draft.asset_type} options={ASSET_TYPES.map(t => ({ value: t, label: t }))} onChange={(v) => patch({ asset_type: v })} />
              <SelectField label="来源类型" value={draft.source_type} options={SOURCE_TYPES.map(t => ({ value: t, label: t }))} onChange={(v) => patch({ source_type: v })} />
            </div>
            <ListField label="标签" value={draft.tags} onChange={(v) => patch({ tags: v })} />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="版本" value={draft.version} onChange={(v) => patch({ version: v })} />
              <div className="pt-5"><BoolField label="启用" value={draft.is_active !== false} onChange={(v) => patch({ is_active: v })} /></div>
            </div>
          </Section>

          <AssetGenerationPanel draft={draft} patch={patch} />

          <Section title="地址与预览">
            <TextField label="资源地址 (uri)" value={draft.uri} onChange={(v) => patch({ uri: v })} />
            <TextField label="预览地址 (preview_uri)" value={draft.preview_uri} onChange={(v) => patch({ preview_uri: v })} />
            {draft.asset_type === 'audio' && draft.uri && <audio controls src={draft.uri} className="w-full h-8" />}
            {draft.asset_type === 'model' && <ModelPreview uri={draft.uri} />}
            {(draft.preview_uri || (draft.asset_type === 'image' && draft.uri)) && (
              <img src={draft.preview_uri || draft.uri} alt={draft.name} className="max-h-48 rounded border border-[#2A2E37]" />
            )}
          </Section>

          <Section title="引用关系">
            {usedBy.length === 0
              ? <p className="text-[11px] text-gray-600">暂无引用</p>
              : usedBy.map(a => <p key={a.id} className="text-[11px] text-gray-300">能力：{a.name}</p>)}
          </Section>
        </div>
      )}
    </RecordWorkspace>
  );
}