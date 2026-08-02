import React from 'react';
import { SelectField } from '@/components/ludots/ui';

export default function ReferenceSelect({ label, value, options = [], onChange, hint }) {
  const unique = options.filter((o, i, all) => o.value && all.findIndex(x => x.value === o.value) === i);
  const items = unique.some(o => o.value === value) || !value
    ? unique
    : [{ value, label: `${value}（当前值）` }, ...unique];
  return <SelectField label={label} value={value || '__none__'} hint={hint}
    options={[{ value: '__none__', label: '未设置' }, ...items]}
    onChange={next => onChange(next === '__none__' ? '' : next)} />;
}