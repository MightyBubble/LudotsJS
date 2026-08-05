import React from 'react';
import SimplePresentationDetails from './SimplePresentationDetails';
import AnimatorControllerDetails from './AnimatorControllerDetails';
import AnimationProfileDetails from './AnimationProfileDetails';
import UIItemPresentationDetails from './UIItemPresentationDetails';

export default function PresentationConfigDetails({ type, draft, patch, refs }) {
  if (type === 'controller') return <AnimatorControllerDetails draft={draft} patch={patch} refs={refs} />;
  if (type === 'profile') return <AnimationProfileDetails draft={draft} patch={patch} refs={refs} />;
  if (type === 'uiItem') return <UIItemPresentationDetails draft={draft} patch={patch} refs={refs} />;
  return <SimplePresentationDetails type={type} draft={draft} patch={patch} />;
}
