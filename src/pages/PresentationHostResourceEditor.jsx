import React from 'react';
import { useLocation } from 'react-router-dom';
import PresentationDomainEditor from '@/components/presentation/PresentationDomainEditor';
import HostAssetBindingEditor from '@/pages/HostAssetBindingEditor';
import AssetLibrary from '@/pages/AssetLibrary';

const tabs = [
  { value: 'bindings', label: '宿主绑定', to: '/PresentationHostResourceEditor?view=bindings' },
  { value: 'library', label: '源资源库', to: '/PresentationHostResourceEditor?view=library' },
];

export default function PresentationHostResourceEditor() {
  const requested = new URLSearchParams(useLocation().search).get('view');
  const view = requested === 'library' ? 'library' : 'bindings';
  return (
    <PresentationDomainEditor tabs={tabs} active={view}>
      {view === 'library' ? <AssetLibrary /> : <HostAssetBindingEditor />}
    </PresentationDomainEditor>
  );
}