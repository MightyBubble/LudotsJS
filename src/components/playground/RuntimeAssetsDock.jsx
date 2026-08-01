import React from 'react';
import { Boxes } from 'lucide-react';
import RuntimeDock from './RuntimeDock';

const Group = ({ title, items, selected, onSelect, name }) => <div className="border-b border-border p-2"><h3 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">{title} · {items.length}</h3>{items.map(item => <button key={item.id} onClick={() => onSelect(item.id)} className={`block w-full truncate rounded px-2 py-1.5 text-left text-[11px] ${selected === item.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{name(item)}</button>)}</div>;

export default function RuntimeAssetsDock({ prototypes, abilities, panels, prototypeId, abilityId, panelId, onPrototype, onAbility, onPanel, onClose }) {
  return <RuntimeDock title="Project Assets" icon={Boxes} onClose={onClose} className="w-60 shrink-0">
    <Group title="Entity Prototypes" items={prototypes} selected={prototypeId} onSelect={onPrototype} name={p => p.name || p.prototype_id} />
    <Group title="Command Panels" items={panels} selected={panelId} onSelect={onPanel} name={p => p.label || p.panel_id} />
    <Group title="Abilities" items={abilities} selected={abilityId} onSelect={onAbility} name={a => a.presentation?.displayName || a.ability_id} />
  </RuntimeDock>;
}