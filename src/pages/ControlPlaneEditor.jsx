import React from 'react';
import CommandControlWorkspace from '@/components/commandControl/CommandControlWorkspace';
import { controlPlaneSpec } from '@/components/commandControl/commandControlSpecs';

export default function ControlPlaneEditor() {
  return <CommandControlWorkspace config={controlPlaneSpec} />;
}