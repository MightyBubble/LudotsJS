import React from 'react';
import { Section, ListField } from '@/components/ludots/ui';

export default function MapTriggerEditor({ triggerTypes, onChange }) {
  return <Section title="Map Triggers">
    <ListField helpIndex={26} label="Trigger Types" value={triggerTypes} onChange={onChange} hint="填写 C# Trigger 类型名。MapConfig 只声明地图作用域类型；EventKey、Priority、Conditions 与 Actions 由对应 Trigger 类型定义。" />
  </Section>;
}