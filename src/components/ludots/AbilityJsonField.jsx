import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ludots/ui';

export default function AbilityJsonField({ label, value, onChange, hint }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState('');
  useEffect(() => { setText(JSON.stringify(value ?? {}, null, 2)); setError(''); }, [value]);
  const commit = () => {
    try { onChange(JSON.parse(text || '{}')); setError(''); }
    catch { setError('JSON 格式无效'); }
  };
  return <Field label={label} hint={error || hint}>
    <Textarea value={text} onChange={e => setText(e.target.value)} onBlur={commit} className="min-h-24 bg-[#0D0F14] border-[#2A2E37] font-mono text-xs" />
  </Field>;
}