import React from 'react';
import { NumberField, Section, SelectField } from '@/components/ludots/ui';
import { getGlobalTableOptions, LUDOTS_TABLE_IDS } from './globalTableRefs';

const options = values => values.map(value => ({ value, label: value }));
const TRIGGERS = ['PressedThisFrame','ReleasedThisFrame','Held','DoubleTap'];
const HELD = ['EveryFrame','StartEnd'];
const CAST_MODES = ['TargetFirst','SmartCast','AimCast','SmartCastWithIndicator','ContextScored','PressReleaseAimCast'];
const AUTO_TARGET = ['None','NearestInRange','NearestEnemyInRange'];

export default function AbilityInputEditor({ value = {}, refs = {}, onChange }) {
  const patch = next => onChange({ ...value, ...next });
  return <Section title="输入覆盖 Input">
    <SelectField label="触发 trigger" value={value.trigger} options={getGlobalTableOptions(refs.constants, LUDOTS_TABLE_IDS.inputTriggers, TRIGGERS)} onChange={trigger => patch({ trigger })} />
    <SelectField label="持续策略 heldPolicy" value={value.heldPolicy} options={getGlobalTableOptions(refs.constants, LUDOTS_TABLE_IDS.heldPolicies, HELD)} onChange={heldPolicy => patch({ heldPolicy })} />
    <SelectField label="施法模式 castModeOverride" value={value.castModeOverride} options={getGlobalTableOptions(refs.constants, LUDOTS_TABLE_IDS.castModes, CAST_MODES)} onChange={castModeOverride => patch({ castModeOverride })} />
    <SelectField label="自动目标 autoTargetPolicy" value={value.autoTargetPolicy} options={getGlobalTableOptions(refs.constants, LUDOTS_TABLE_IDS.autoTargetPolicies, AUTO_TARGET)} onChange={autoTargetPolicy => patch({ autoTargetPolicy })} />
    <NumberField label="自动目标范围 cm autoTargetRangeCm" value={value.autoTargetRangeCm} onChange={autoTargetRangeCm => patch({ autoTargetRangeCm })} />
  </Section>;
}