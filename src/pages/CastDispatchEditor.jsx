import React from 'react';
import InputDefinitionWorkspace from '@/components/input/contract/InputDefinitionWorkspace';
import { castDispatchSpec } from '@/components/input/contract/inputDefinitionSpecs';
export default function CastDispatchEditor(){ return <InputDefinitionWorkspace config={castDispatchSpec} />; }