import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';

export default function VfxSampleImportBar() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const run = async () => {
    setBusy(true); setMessage('');
    const { data } = await base44.functions.invoke('importVfxSamples', {});
    setMessage(`已导入 ${data.effects} 个特效与 ${data.hostBindings} 个宿主绑定`);
    setBusy(false);
  };
  return <div className="shrink-0 flex items-center gap-3 border-b border-[#2A2E37] bg-[#15171C] px-3 py-2"><Button size="sm" className="h-8" disabled={busy} onClick={run}>{busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}导入官方特效示例</Button><span className="text-[11px] text-gray-500">Quarks × 3 · Effekseer × 3</span>{message && <span className="text-[11px] text-gray-300">{message}</span>}</div>;
}