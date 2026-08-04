import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Section, SelectField } from '@/components/ludots/ui';

const PACKS = [
  ['kenney-interface', 'Kenney · Interface Sounds'], ['kenney-rpg', 'Kenney · RPG Audio'], ['kenney-impact', 'Kenney · Impact Sounds'],
  ['oga-core', 'OpenGameArt · 100 CC0 SFX'], ['oga-rpg', 'OpenGameArt · 80 CC0 RPG SFX'], ['oga-scifi', 'OpenGameArt · 50 CC0 Sci-Fi SFX'],
].map(([value, label]) => ({ value, label }));

export default function AudioLibraryImportPanel() {
  const [pack, setPack] = useState(PACKS[0].value);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const run = async () => {
    setBusy(true); setMessage('');
    const { data } = await base44.functions.invoke('importCc0Audio', { pack, limit: 100 });
    setMessage(`已导入 ${data.created} 个，剩余 ${data.remainingAfter} 个`); setBusy(false);
  };
  return <Section title="CC0 音效库"><div className="flex items-end gap-3"><div className="min-w-64"><SelectField label="素材包" value={pack} options={PACKS} onChange={setPack} /></div><Button size="sm" className="h-8" disabled={busy} onClick={run}>{busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}导入音效</Button></div>{message && <p className="text-[11px] text-gray-400">{message}</p>}</Section>;
}