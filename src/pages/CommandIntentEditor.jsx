import React from 'react';
import InputDefinitionWorkspace from '@/components/input/contract/InputDefinitionWorkspace';
import { commandIntentSpec } from '@/components/input/contract/inputDefinitionSpecs';
export default function CommandIntentEditor(){ return <InputDefinitionWorkspace config={commandIntentSpec} />; }