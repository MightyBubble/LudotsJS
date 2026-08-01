import React from 'react';
import { Ban, Box, PanelBottom, PanelLeft, PanelRight, Play, RotateCcw, Trash2, Workflow } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DockButton = ({ active, icon: Icon, label, onClick }) => <Button size="sm" variant={active ? 'secondary' : 'ghost'} aria-pressed={active} onClick={onClick} className="h-7 gap-1 px-2 text-[10px]"><Icon className="h-3.5 w-3.5" />{label}</Button>;
const Picker = ({ label, value, onChange, children }) => <label className="flex items-center gap-1 text-[10px] text-muted-foreground"><span>{label}</span><select aria-label={label} value={value} onChange={e => onChange(e.target.value)} className="h-7 max-w-48 rounded border border-input bg-background px-2 text-[11px] text-foreground">{children}</select></label>;

export default function RuntimeDockToolbar({ prototypes, panels, abilities, prototypeId, panelId, abilityId, onPrototype, onPanel, onAbility, onCast, onReset, onPlace, onCancel, onClear, runtimeCount, docks, toggle }) {
  return <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-2 py-1.5">
    <Picker label="Prototype" value={prototypeId} onChange={onPrototype}>{prototypes.map(p => <option key={p.id} value={p.id}>{p.name || p.prototype_id}</option>)}</Picker>
    <Picker label="Panel" value={panelId} onChange={onPanel}>{panels.map(p => <option key={p.id} value={p.id}>{p.label || p.panel_id}</option>)}</Picker>
    <Picker label="Ability" value={abilityId} onChange={onAbility}>{abilities.map(a => <option key={a.id} value={a.id}>{a.presentation?.displayName || a.ability_id}</option>)}</Picker>
    <Button size="sm" onClick={onCast} disabled={!abilityId} className="h-7 gap-1 text-[10px]"><Play className="h-3.5 w-3.5" />施放</Button>
    <Button size="sm" variant="outline" onClick={onReset} className="h-7 gap-1 text-[10px]"><RotateCcw className="h-3.5 w-3.5" />重置</Button>
    <Button size="sm" variant="outline" onClick={onPlace} disabled={!prototypeId} className="h-7 gap-1 text-[10px]"><Box className="h-3.5 w-3.5" />放置</Button>
    <Button size="sm" variant="ghost" onClick={onCancel} className="h-7 px-2"><Ban className="h-3.5 w-3.5" /></Button>
    <Button size="sm" variant="ghost" onClick={onClear} className="h-7 gap-1 px-2 text-[10px]"><Trash2 className="h-3.5 w-3.5" />{runtimeCount}</Button>
    <div className="mx-1 h-5 w-px bg-border" />
    <DockButton active={docks.assets} icon={PanelLeft} label="资产" onClick={() => toggle('assets')} />
    <DockButton active={docks.inspector} icon={PanelRight} label="检查器" onClick={() => toggle('inspector')} />
    <DockButton active={docks.commandPanel} icon={Box} label="命令面板" onClick={() => toggle('commandPanel')} />
    <DockButton active={docks.trace} icon={Workflow} label="解析链" onClick={() => toggle('trace')} />
    <DockButton active={docks.console} icon={PanelBottom} label="控制台" onClick={() => toggle('console')} />
  </div>;
}