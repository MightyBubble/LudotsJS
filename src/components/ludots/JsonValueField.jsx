import React, { useEffect, useState } from 'react';

export default function JsonValueField({ label, value, onChange, helpIndex }) {
  const [text, setText] = useState(value === undefined ? '' : JSON.stringify(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => setText(value === undefined ? '' : JSON.stringify(value)), [value]);
  const commit = () => {
    if (!text.trim()) return onChange(undefined);
    try { onChange(JSON.parse(text)); setInvalid(false); }
    catch { setInvalid(true); }
  };
  return (
    <div>
      <label className="text-[11px] text-gray-400 mb-1 flex items-center gap-1.5">{helpIndex && <span className="inline-flex h-4 min-w-4 items-center justify-center rounded bg-[#303845] px-1 text-[9px] text-[#dce2e8]">{helpIndex}</span>}{label}</label>
      <input value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} className={`w-full h-8 rounded border bg-[#0D0F14] px-2 text-xs text-[#e5e5e5] ${invalid ? 'border-red-500' : 'border-[#2A2E37]'}`} />
      {invalid && <p className="text-[10px] text-red-400 mt-1">请输入有效 JSON 值</p>}
    </div>
  );
}