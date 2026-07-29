import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Ban } from 'lucide-react';
import { BoolField } from './ui';
import RefListSelector from './RefListSelector';
import MainOperationEditor from './MainOperationEditor';
import PhaseListenersEditor from './PhaseListenersEditor';
import { PHASE_META } from './phaseModel';

/** 单个 Phase：Pre ActionGraph → Main Operation → Post ActionGraph → Phase Listeners */
export default function PhaseEditor({ phase, onChange, refs = {}, forbidden, forbiddenReason }) {
  const [open, setOpen] = useState(false);
  const meta = PHASE_META[phase.phase_id];
  const graphOptions = (refs.actionGraphs || []).map(g => ({ value: g.action_id, label: g.name }));
  const set = (patch) => onChange({ ...phase, ...patch });

  const summary = [
    (phase.pre_action_graph_ids || []).length ? `Pre ${phase.pre_action_graph_ids.length}` : null,
    phase.main?.mode && phase.main.mode !== 'none' ? `Main ${phase.main.mode}` : null,
    (phase.post_action_graph_ids || []).length ? `Post ${phase.post_action_graph_ids.length}` : null,
    (phase.listeners || []).length ? `Listeners ${phase.listeners.length}` : null,
  ].filter(Boolean).join(' · ') || '未配置';

  return (
    <div className={`border rounded ${phase.enabled && !forbidden ? 'border-[#D97706]/50' : 'border-[#2A2E37]'} bg-[#15171C]`}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <button onClick={() => setOpen(!open)} className="text-gray-500 hover:text-white">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <span className="text-xs font-mono text-[#E2D8B3] w-28">{meta.label}</span>
        <span className="text-[11px] text-gray-400 w-12">{meta.cn}</span>
        <span className="text-[10px] text-gray-500 flex-1 truncate">{summary}</span>
        {forbidden
          ? <span className="flex items-center gap-1 text-[10px] text-red-400"><Ban className="w-3 h-3" />不可用</span>
          : <BoolField label="启用" value={!!phase.enabled} onChange={(v) => set({ enabled: v })} />}
      </div>

      {open && (
        <div className="border-t border-[#2A2E37] p-2 space-y-3">
          <p className="text-[10px] text-gray-500">{meta.desc}</p>
          {forbidden && <p className="text-[10px] text-red-400">{forbiddenReason}</p>}

          <div className="space-y-2">
            <span className="text-[11px] text-gray-400">① Pre ActionGraph</span>
            <RefListSelector label="" value={phase.pre_action_graph_ids || []} options={graphOptions} onChange={(v) => set({ pre_action_graph_ids: v })} />
          </div>

          <div className="space-y-2 border-t border-[#2A2E37] pt-2">
            <span className="text-[11px] text-gray-400">② Main Operation</span>
            <MainOperationEditor value={phase.main || { mode: 'none' }} onChange={(v) => set({ main: v })} refs={refs} />
          </div>

          <div className="space-y-2 border-t border-[#2A2E37] pt-2">
            <span className="text-[11px] text-gray-400">③ Post ActionGraph</span>
            <RefListSelector label="" value={phase.post_action_graph_ids || []} options={graphOptions} onChange={(v) => set({ post_action_graph_ids: v })} />
          </div>

          <div className="space-y-2 border-t border-[#2A2E37] pt-2">
            <span className="text-[11px] text-gray-400">④ Phase Listeners</span>
            <PhaseListenersEditor listeners={phase.listeners || []} onChange={(v) => set({ listeners: v })} refs={refs} phaseLabel={meta.label} />
          </div>
        </div>
      )}
    </div>
  );
}