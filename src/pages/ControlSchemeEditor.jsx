import React from 'react';
import InputDefinitionWorkspace from '@/components/input/contract/InputDefinitionWorkspace';
import { controlSchemeSpec } from '@/components/input/contract/inputDefinitionSpecs';
export default function ControlSchemeEditor(){ return <InputDefinitionWorkspace config={controlSchemeSpec} />; }