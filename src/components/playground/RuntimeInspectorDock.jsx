import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import RuntimeDock from './RuntimeDock';

const Row = ({ label, value }) => <div className="grid grid-cols-[88px_1fr] gap-2 border-b border-border/60 px-2 py-1.5 text-[10px]"><span className="text-muted-foreground">{label}</span><span className="break-all font-mono text-foreground">{value || '—'}</span></div>;
export default function RuntimeInspectorDock({ prototype, panel, result, onClose }) {
  return <RuntimeDock title="Runtime Inspector" icon={SlidersHorizontal} onClose={onClose} className="w-72 shrink-0 max-md:hidden">
    <div className="bg-muted px-2 py-1 text-[10px] font-semibold">Prototype</div>
    <Row label="ID" value={prototype?.prototype_id} /><Row label="Semantic" value={prototype?.semantic_profile_ref} /><Row label="Abilities" value={prototype?.ability_ids?.length} /><Row label="Bindings" value={prototype?.role_bindings?.length} />
    <div className="bg-muted px-2 py-1 text-[10px] font-semibold">Panel Profile</div>
    <Row label="ID" value={panel?.panel_id} /><Row label="Source" value={panel?.source?.collection_key} /><Row label="Layout" value={panel?.layout?.mode} /><Row label="Grid" value={`${panel?.layout?.grid?.columns || 0} × ${panel?.layout?.grid?.visible_rows || 0}`} />
    <div className="bg-muted px-2 py-1 text-[10px] font-semibold">Diagnostics</div>
    {Object.entries(result?.diagnostics || {}).map(([key, value]) => <Row key={key} label={key} value={value} />)}
  </RuntimeDock>;
}