import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { validateQuarksDocument } from '@/lib/quarks/quarksDocument';
export default function QuarksRawPanel({ document, onChange, onError }) {
  const [text, setText] = useState(''); useEffect(() => setText(JSON.stringify(document, null, 2)), [document]);
  const apply = () => { try { const parsed = JSON.parse(text); const invalid = validateQuarksDocument(parsed); if (invalid) return onError(invalid); onChange(parsed); onError(''); } catch { onError('原始 JSON 格式无效'); } };
  return <div className="space-y-2"><Textarea aria-label="Quarks 原始 JSON" value={text} onChange={e => setText(e.target.value)} className="min-h-[420px] border-[#424A55] bg-[#0D0F14] font-mono text-[10px]"/><div className="flex justify-end"><Button size="sm" onClick={apply}>应用 JSON</Button></div></div>;
}