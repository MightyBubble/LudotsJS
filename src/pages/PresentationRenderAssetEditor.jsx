import React from 'react';
import { useLocation } from 'react-router-dom';
import PresentationDomainEditor from '@/components/presentation/PresentationDomainEditor';
import { ConfigWorkspace } from '@/pages/PresentationConfigEditor';

const tabs = [
  { value: 'mesh', label: '网格资产', to: '/PresentationRenderAssetEditor?type=mesh' },
  { value: 'material', label: '材质资产', to: '/PresentationRenderAssetEditor?type=material' },
  { value: 'effect', label: '特效资产', to: '/PresentationRenderAssetEditor?type=effect' },
];

export default function PresentationRenderAssetEditor() {
  const requested = new URLSearchParams(useLocation().search).get('type');
  const type = tabs.some(tab => tab.value === requested) ? requested : 'mesh';
  return (
    <PresentationDomainEditor tabs={tabs} active={type}>
      <ConfigWorkspace key={type} type={type} />
    </PresentationDomainEditor>
  );
}