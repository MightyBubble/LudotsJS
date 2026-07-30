import React, { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

export default function JsonArrayField({ label, value = [], onChange }) {
  const [text, setText] = useState(JSON.stringify(value, null, 2));
  const [error, setError] = useState('');
  useEffect(() => setText(JSON.stringify(value || [], null, 2)), [value]);
  const commit = () => {
    try {
      const next = JSON.parse(text || '[]');
      if (!Array.isArray(next)) throw new Error();
      onChange(next);
      setError('');
    } catch {
      setError('必须是 JSON 数组');
    }
  };
  return <div>
    <label className="mb-1 block text-[10px] text-gray-500">{label}</label>
    <Textarea value={text} onChange={e => setText(e.target.value)} onBlur={commit} className="min-h-20 bg-[#0D0F14] border-[#2A2E37] font-mono text-[10px]" />
    {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
  </div>;
}