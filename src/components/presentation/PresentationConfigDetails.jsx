import React from 'react';
import SimplePresentationDetails from './SimplePresentationDetails';
import AnimationProfileDetails from './AnimationProfileDetails';
import PrefabDetails from './PrefabDetails';

export default function PresentationConfigDetails({ type, draft, patch, refs }) {
  if (type === 'profile') return <AnimationProfileDetails draft={draft} patch={patch} refs={refs} />;
  if (type === 'prefab') return <PrefabDetails draft={draft} patch={patch} refs={refs} />;
  return <SimplePresentationDetails type={type} draft={draft} patch={patch} />;
}