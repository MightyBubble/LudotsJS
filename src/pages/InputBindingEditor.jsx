import React from 'react';
import CommandControlWorkspace from '@/components/commandControl/CommandControlWorkspace';
import { inputBindingSpec } from '@/components/commandControl/commandControlSpecs';

export default function InputBindingEditor() {
  return <CommandControlWorkspace config={inputBindingSpec} />;
}