import React from 'react';
import { useLocation } from 'react-router-dom';
import PresentationDomainEditor from '@/components/presentation/PresentationDomainEditor';
import { ConfigWorkspace } from '@/pages/PresentationConfigEditor';

const tabs = [
  { value: 'controller', label: '控制器', to: '/PresentationAnimationEditor?type=controller' },
  { value: 'profile', label: '动画配置', to: '/PresentationAnimationEditor?type=profile' },
  { value: 'clip', label: '动画片段', to: '/PresentationAnimationEditor?type=clip' },
];

export default function PresentationAnimationEditor() {
  const requested = new URLSearchParams(useLocation().search).get('type');
  const type = tabs.some(tab => tab.value === requested) ? requested : 'controller';
  return (
    <PresentationDomainEditor tabs={tabs} active={type}>
      <ConfigWorkspace key={type} type={type} />
    </PresentationDomainEditor>
  );
}