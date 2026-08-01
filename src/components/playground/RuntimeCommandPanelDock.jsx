import React from 'react';
import { Gamepad2 } from 'lucide-react';
import RuntimeDock from './RuntimeDock';

export default function RuntimeCommandPanelDock({ result, onAbility, onClose }) {
  const columns = Math.max(1, result?.profile?.layout?.grid?.columns || 4);
  return <RuntimeDock title="Command Panel Preview" icon={Gamepad2} onClose={onClose} className="h-44 shrink-0">
    <div className="grid gap-1.5 p-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {(result?.buttons || []).map(button => <button key={button.slot_id} disabled={button.empty} onClick={() => button.ability && onAbility(button.ability)} className="min-h-14 rounded border border-border bg-muted p-2 text-left hover:border-ring hover:bg-accent disabled:opacity-35">
        <div className="truncate text-[11px] font-semibold">{button.ability?.presentation?.displayName || button.ability?.ability_id || 'Empty Slot'}</div>
        <div className="mt-1 flex justify-between gap-2 text-[9px] text-muted-foreground"><span className="truncate">{button.role_id || button.slot_id}</span><kbd>{button.action_id?.split('.').at(-1) || '—'}</kbd></div>
      </button>)}
    </div>
  </RuntimeDock>;
}