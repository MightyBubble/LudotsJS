import React from 'react';
import RuntimeConsole from './RuntimeConsole';
import EntityPlacementPalette from '@/components/playground/EntityPlacementPalette';
import { positionStyle } from './RuntimeAnchoredPanel';

export default function RuntimeUtilityPanel({ panel, templates, selectedId, onSelect, log }) {
  const consolePanel = panel.kind === 'console';
  return <section
    data-testid={`runtime-panel-${panel.instanceKey}`}
    className={`pointer-events-auto absolute max-w-[calc(100vw-2rem)] overflow-hidden rounded border border-[#424a55] bg-[#15171C]/95 shadow-xl ${consolePanel ? 'w-[28rem] h-48' : 'w-56 h-80'}`}
    style={positionStyle(panel.anchor)}
  >
    <header className="border-b border-[#424a55] px-3 py-2 text-[11px] font-semibold text-gray-200">{consolePanel ? 'Runtime Console' : 'Entity Placement Palette'}</header>
    <div className="h-[calc(100%-33px)] min-h-0">
      {consolePanel ? <RuntimeConsole log={log} embedded /> : <EntityPlacementPalette templates={templates} selectedId={selectedId} onSelect={onSelect} />}
    </div>
  </section>;
}