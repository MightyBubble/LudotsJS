export default function PerformerMiniStateMachine({ layer, activeStateId, activeTransitionId, onSelect }) {
  const states = (layer?.states || []).filter(state => ['Normal', 'BlendTree'].includes(state.type));
  return <div className="overflow-x-auto border border-[#424a55] bg-[#0D0F14] p-3">
    <div className="flex min-w-max items-center gap-2">
      {states.map((state, index) => {
        const incoming = (layer.transitions || []).find(transition => transition.to_state_id === state.id);
        const activeEdge = incoming?.id === activeTransitionId;
        return <div key={state.id} className="flex items-center gap-2">
          {index > 0 && <div className={`h-0.5 w-8 ${activeEdge ? 'bg-emerald-400' : 'bg-[#424a55]'}`} />}
          <button type="button" onClick={() => onSelect(state.packed_state_index)} className={`min-w-24 border px-3 py-2 text-left ${activeStateId === state.id ? 'border-emerald-400 bg-emerald-950 text-emerald-200' : 'border-[#424a55] bg-[#171b21] text-gray-300'}`}>
            <span className="block text-xs font-semibold">{state.name}</span><span className="text-[10px] text-gray-500">packed {state.packed_state_index}</span>
          </button>
        </div>;
      })}
    </div>
  </div>;
}