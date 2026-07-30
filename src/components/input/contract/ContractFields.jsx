import React from 'react';
import ContractField from '@/components/input/contract/ContractField';

export default function ContractFields({ fields, value, onChange, refs }) {
  return <div className="grid gap-3 md:grid-cols-2">{fields.map(field =>
    <div key={field.key} className={field.wide ? 'md:col-span-2' : ''}>
      <ContractField field={field} value={value?.[field.key]} onChange={next => onChange({ ...(value || {}), [field.key]: next })} refs={refs} />
    </div>
  )}</div>;
}