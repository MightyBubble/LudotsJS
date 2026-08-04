import React from 'react';
import { useLocation } from 'react-router-dom';
import PresentationDomainEditor from '@/components/presentation/PresentationDomainEditor';
import HostAssetBindingEditor from '@/pages/HostAssetBindingEditor';
import AssetLibrary from '@/pages/AssetLibrary';

const resourceTypes = [
  ['image', '图像'], ['model', '模型'], ['animation', '动画'], ['audio', '音效'],
  ['material', '材质'], ['particle', '粒子'], ['prefab', '预制体'], ['data', '数据'],
  ['script', '脚本'], ['other', '其他'],
];

const typeTabs = resourceTypes.map(([value, label]) => ({
  value, label, to: `/PresentationHostResourceEditor?view=library&type=${value}`,
}));

export default function PresentationHostResourceEditor() {
  const params = new URLSearchParams(useLocation().search);
  if (params.get('view') !== 'library') return <HostAssetBindingEditor />;
  const requestedType = params.get('type');
  const type = resourceTypes.some(([value]) => value === requestedType) ? requestedType : 'image';
  return (
    <PresentationDomainEditor tabs={typeTabs} active={type}>
      <AssetLibrary />
    </PresentationDomainEditor>
  );
}