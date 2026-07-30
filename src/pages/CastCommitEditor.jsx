import React from 'react';
import InputDefinitionWorkspace from '@/components/input/contract/InputDefinitionWorkspace';
import { castCommitSpec } from '@/components/input/contract/inputDefinitionSpecs';
export default function CastCommitEditor(){ return <InputDefinitionWorkspace config={castCommitSpec} />; }