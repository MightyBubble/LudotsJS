import React from 'react';
import ReferenceSelect from './ReferenceSelect';

const fields = [
  ['title_token_ref', '标题 Token'],
  ['subtitle_token_ref', '副标题 Token'],
  ['body_token_ref', '正文 Token'],
  ['tooltip_token_ref', '提示 Token'],
];

export default function ItemTextTokenFields({ value = {}, tokens, onChange }) {
  return <div className="grid gap-3 sm:grid-cols-2">
    {fields.map(([key, label]) => <ReferenceSelect key={key} label={label} value={value[key]} options={tokens} onChange={next => onChange({ ...value, [key]: next })} />)}
  </div>;
}