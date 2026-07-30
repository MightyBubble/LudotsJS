import React from 'react';
import InputDefinitionWorkspace from '@/components/input/contract/InputDefinitionWorkspace';
import { inputOrderSpec } from '@/components/input/contract/inputDefinitionSpecs';
export default function InputOrderEditor(){ return <InputDefinitionWorkspace config={inputOrderSpec} />; }