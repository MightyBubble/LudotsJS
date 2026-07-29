import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { ABILITY_DEFS } from '@/lib/commandLab';

const TRIGGER_LABEL = { seen: '视野接战', damaged: '受击（还击）' };
const sel = 'rounded border border-slate-200 bg-white px-1 py-0.5 text-[10px]';

// 姿态图编辑器：直接编辑图数据（状态=候选过滤器 + 事件转移），onChange 即时生效于引擎
export default function StanceMachineEditor({ machine, onChange }) {
  const [newName, setNewName] = useState('');
  const update = (fn) => { const m = JSON.parse(JSON.stringify(machine)); fn(m); onChange(m); };
  const stateKeys = Object.keys(machine.states);
  const abilityKeys = Object.keys(ABILITY_DEFS);
  return (
    <div className="space-y-2 border-t border-slate-100 pt-2">
      {Object.entries(machine.states).map(([key, st]) => (
        <div key={key} className="rounded-md border border-slate-100 p-2 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <input className={`${sel} flex-1 font-medium`} value={st.label} onChange={(e) => update((m) => { m.states[key].label = e.target.value; })} />
            <span className="text-[9px] font-mono text-slate-400">{key}</span>
            {stateKeys.length > 1 && (
              <button onClick={() => update((m) => { delete m.states[key]; if (m.initial === key) m.initial = Object.keys(m.states)[0]; })} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
            )}
          </div>
          {(st.autocast || []).map((a, i) => (
            <div key={`a${i}`} className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400 w-14 shrink-0">autocast</span>
              <select className={sel} value={a.ability} onChange={(e) => update((m) => { m.states[key].autocast[i].ability = e.target.value; })}>
                {abilityKeys.map((k) => <option key={k} value={k}>{ABILITY_DEFS[k].label}</option>)}
              </select>
              <select className={sel} value={a.trigger} onChange={(e) => update((m) => { m.states[key].autocast[i].trigger = e.target.value; })}>
                {Object.entries(TRIGGER_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
              <button onClick={() => update((m) => { m.states[key].autocast.splice(i, 1); })} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {(st.transitions || []).map((t, i) => (
            <div key={`t${i}`} className="flex items-center gap-1 text-[10px]">
              <span className="text-slate-400 w-14 shrink-0">on</span>
              <select className={sel} value={t.on} onChange={(e) => update((m) => { m.states[key].transitions[i].on = e.target.value; })}>
                <option value="damaged">damaged（受击）</option>
              </select>
              <span className="text-slate-400">→</span>
              <select className={sel} value={t.to} onChange={(e) => update((m) => { m.states[key].transitions[i].to = e.target.value; })}>
                {stateKeys.map((k) => <option key={k} value={k}>{machine.states[k].label}</option>)}
              </select>
              <button onClick={() => update((m) => { m.states[key].transitions.splice(i, 1); })} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
            </div>
          ))}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => update((m) => { (m.states[key].autocast ||= []).push({ ability: 'atk', trigger: 'seen' }); })} className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"><Plus className="w-3 h-3" />候选</button>
            <button onClick={() => update((m) => { (m.states[key].transitions ||= []).push({ on: 'damaged', to: stateKeys[0] }); })} className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-0.5"><Plus className="w-3 h-3" />转移</button>
            <label className="flex items-center gap-1 text-[10px] text-slate-500">
              <input type="checkbox" checked={st.chase !== false} onChange={(e) => update((m) => { m.states[key].chase = e.target.checked; })} />
              追击
            </label>
            {st.chase !== false && (
              <label className="flex items-center gap-1 text-[10px] text-slate-500">
                缰绳
                <input type="number" min="1" step="0.5" className={`${sel} w-12`} placeholder="∞" value={st.leash ?? ''}
                  onChange={(e) => update((m) => { const v = parseFloat(e.target.value); if (v > 0) m.states[key].leash = v; else delete m.states[key].leash; })} />
              </label>
            )}
            {machine.initial !== key && (
              <button onClick={() => update((m) => { m.initial = key; })} className="text-[10px] text-slate-400 hover:text-slate-600 underline">设为初始</button>
            )}
          </div>
        </div>
      ))}
      <div className="flex gap-1">
        <input className={`${sel} flex-1`} placeholder="新状态名（如 Berserk）" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <button
          onClick={() => { const n = newName.trim(); if (!n || machine.states[n]) return; update((m) => { m.states[n] = { label: n, color: '#475569', autocast: [], transitions: [] }; }); setNewName(''); }}
          className="rounded border border-slate-200 px-1.5 text-slate-500 hover:border-slate-400"
        ><Plus className="w-3 h-3" /></button>
      </div>
    </div>
  );
}