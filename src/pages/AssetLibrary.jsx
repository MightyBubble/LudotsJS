import React from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RecordWorkspace from '@/components/ludots/RecordWorkspace';
import useRecordEditor from '@/components/ludots/useRecordEditor';
import useCoreRefs from '@/components/ludots/useCoreRefs';
import { Section } from '@/components/ludots/ui';
import AssetGenerationPanel from '@/components/asset/AssetGenerationPanel';
import ModelPreview from '@/components/asset/ModelPreview';
import QuarksEditor from '@/components/quarks/QuarksEditor';
import QuarksGeneratorPanel from '@/components/quarks/QuarksGeneratorPanel';
import { getSourceFileName } from '@/lib/assets/sourceFileName';

const TYPE_LABELS = { model: '模型', animation: '动画', audio: '音效', image: '图像' };
const CATEGORY_LABELS = {
  model: '模型', animation: '动画', audio: '音频', image: '图像', material: '材质',
  particle: '粒子', prefab: '预制体', data: '数据', script: '脚本', other: '其他',
};

function getAssetCategoryPath(asset) {
  const packageName = asset.metadata?.package_label || asset.metadata?.package_slug || '未分包';
  const category = asset.tags?.includes('texture') ? '纹理' : (CATEGORY_LABELS[asset.asset_type] || '其他');
  return `${packageName}/${category}`;
}

export default function AssetLibraryPage() {
  const filterType = new URLSearchParams(useLocation().search).get('type') || '';
  const { records, selectedId, setSelectedId, draft, patch, dirty, create, save, remove } = useRecordEditor(
    'Asset', 'assets',
    () => ({ asset_id: `asset_${Date.now()}`, name: `新${TYPE_LABELS[filterType] || '资源'}`, asset_type: filterType || 'image', source_type: 'url', version: 1, is_active: true, tags: [] }),
    data => data,
    2000
  );
  const visibleRecords = filterType ? records.filter(r => r.asset_type === filterType) : records;
  const quarksTemplate = records.find(record => record.asset_id === 'Vfx.Quarks.Sample.ParticleSystem');
  const { data: effects = [] } = useQuery({ queryKey: ['presentation-effects'], queryFn: () => base44.entities.PresentationEffectAsset.list() });
  const linkedEffect = effects.find(effect => effect.asset_id === draft?.asset_id);
  const { abilities } = useCoreRefs();

  const handleDelete = (rec) => {
    const refs = abilities.filter(a => a.icon_asset_id === rec.asset_id);
    if (refs.length > 0) {
      alert(`无法删除：仍被 ${refs.length} 个能力引用（${refs.map(r => r.name).join('、')}）`);
      return;
    }
    if (window.confirm(`确定删除「${getSourceFileName(rec)}」吗？`)) remove(rec.id);
  };

  return (
    <RecordWorkspace
      entityName="Asset"
      records={visibleRecords}
      columns={[
        { key: 'name', label: '文件名', render: getSourceFileName },
      ]}
      toItem={(r) => ({
        id: r.id,
        name: getSourceFileName(r),
        categoryPath: getAssetCategoryPath(r),
        categoryLocked: true,
      })}
      selectedId={selectedId} onSelect={(r) => setSelectedId(r.id)}
      onCreate={create} onDelete={handleDelete} onSave={save} dirty={dirty}
    >
      {draft && (
        <div className={draft.asset_type === 'particle' ? 'w-full' : 'max-w-2xl'}>
          <Section title={getSourceFileName(draft)}>
            {draft.asset_type === 'audio' && draft.uri && <audio controls src={draft.uri} className="w-full h-8" />}
            {draft.asset_type === 'model' && <ModelPreview uri={draft.uri} resourceMap={draft.metadata?.resource_map} />}
            {draft.asset_type === 'particle' && !draft.uri && <p className="text-xs text-gray-500">上传 Quarks JSON 后即可编辑与预览。</p>}
            {(draft.preview_uri || (draft.asset_type === 'image' && draft.uri)) && (
              <img src={draft.preview_uri || draft.uri} alt={getSourceFileName(draft)} className="max-h-48 rounded border border-[#2A2E37]" />
            )}
            {!draft.uri && draft.asset_type !== 'particle' && <p className="text-xs text-gray-500">尚未选择文件</p>}
          </Section>
          <AssetGenerationPanel draft={draft} patch={patch} />
          {draft.asset_type === 'particle' && <QuarksGeneratorPanel asset={draft} templateUri={quarksTemplate?.uri} patch={patch} />}
          {draft.asset_type === 'particle' && draft.uri && <QuarksEditor asset={draft} effect={linkedEffect} />}
        </div>
      )}
    </RecordWorkspace>
  );
}