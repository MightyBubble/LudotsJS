import React from 'react';
import { Switch } from '@/components/ui/switch';
import { ABILITY_DEFS } from '@/lib/commandLab';
import SelectorEditor from '@/components/lab/SelectorEditor';

const MODES = [['unit', '单位'], ['point', '地点'], ['direction', '方向']];
// ③确认层：commit 边沿声明（引导/按住型技能占用抬起语义，锁定为即时，不出现此选项）
const CAST_MODES = [['instant', '即时'], ['onRelease', '抬起'], ['confirm', '点击确认']];
// 打断策略：施法中来了新指令（移动/攻击等非 shift 指令）怎么办
const INTERRUPTS = [['none', '不可打断'], ['drop', '丢弃'], ['restart', '重来'], ['resume', '续跑']];

const Tog = ({ label, v, on }) => (
  <label className="flex items-center gap-1 text-[10px] text-slate-600">
    <Switch checked={!!v} onCheckedChange={on} className="scale-75" />
    {label}
  </label>
);

// 施法偏好：三种距离分开展示（施放 / 候选纳入 / 效果）
// 自动取目标=从黑板按候选范围+优先级取 · 悬停施法=悬停敌人纳入候选且鼠标附近优先
// 追踪吸附=效果层补正 · 穿插队列=不清原指令插队首（SC2 式）· 失效重取=自动来源目标执行期重决议
export default function CastPrefsPanel({ prefs, assets = {}, onChange }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-slate-500">施法偏好（per 技能）</div>
      <div className="space-y-1.5">
        {Object.entries(ABILITY_DEFS).filter(([k]) => k !== 'atk').map(([id, def]) => {
          const p = prefs[id] || {};
          const mode = p.targetMode || 'unit';
          const fe = def.stages[0].timeline[0]?.effect;
          const effRange = fe?.range ?? fe?.radius;
          return (
            <div key={id} className="rounded-md border border-slate-200 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: def.color }}>{def.label}</span>
                <span className="text-[9px] text-slate-400">
                  {def.cast?.targeted
                    ? `施放 ${def.cast.range} · 候选 ${def.acquire?.range ?? '—'} · 效果 ${effRange ?? '—'}`
                    : '自身型'}
                </span>
              </div>
              {def.cast?.targeted && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[9px] text-slate-400 mr-0.5">目标模式:</span>
                  {MODES.map(([m, lbl]) => (
                    <button
                      key={m}
                      onClick={() => onChange(id, 'targetMode', m)}
                      className={`text-[9px] rounded px-1.5 py-0.5 border ${mode === m ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-500 border-slate-200'}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
              {'castMode' in (def.cast || {}) && (
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="text-[9px] text-slate-400 mr-0.5">确认方式:</span>
                  {CAST_MODES.map(([m, lbl]) => (
                    <button
                      key={m}
                      onClick={() => onChange(id, 'castMode', m)}
                      className={`text-[9px] rounded px-1.5 py-0.5 border ${(p.castMode || 'instant') === m ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-500 border-slate-200'}`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[9px] text-slate-400 mr-0.5">被打断时:</span>
                {INTERRUPTS.map(([m, lbl]) => (
                  <button
                    key={m}
                    onClick={() => onChange(id, 'onInterrupt', m)}
                    className={`text-[9px] rounded px-1.5 py-0.5 border ${(p.onInterrupt || 'none') === m ? 'bg-slate-800 text-white border-slate-800' : 'text-slate-500 border-slate-200'}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              {def.cast?.targeted && mode === 'unit' && def.acquire && p.selector && (
                <SelectorEditor selector={p.selector} assets={assets} onChange={(sel) => onChange(id, 'selector', sel)} />
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                {def.cast?.targeted && mode !== 'direction' && (
                  <Tog label="接近施法" v={p.approach} on={(v) => onChange(id, 'approach', v)} />
                )}
                {def.cast?.targeted && mode === 'unit' && (
                  <>
                    <Tog label="自动取目标" v={p.autoAcquire} on={(v) => onChange(id, 'autoAcquire', v)} />
                    <Tog label="失效重取" v={p.rebind?.target === 'onInvalid'} on={(v) => onChange(id, 'rebind', { ...p.rebind, target: v ? 'onInvalid' : 'commit' })} />
                    <Tog label="悬停施法" v={p.hoverCast} on={(v) => onChange(id, 'hoverCast', v)} />
                  </>
                )}
                {def.cast?.targeted && (
                  <Tog label="追踪吸附" v={p.track} on={(v) => onChange(id, 'track', v)} />
                )}
                <Tog label="穿插队列" v={p.queueMode === 'interleave'} on={(v) => onChange(id, 'queueMode', v ? 'interleave' : 'replace')} />
                {'hold' in (def.cast || {}) && (
                  <Tog label="按住引导" v={p.hold} on={(v) => onChange(id, 'hold', v)} />
                )}
                {def.cast?.channel && def.cast?.targeted && (
                  <Tog label="跟随鼠标" v={p.rebind?.direction === 'tick'} on={(v) => onChange(id, 'rebind', { ...p.rebind, direction: v ? 'tick' : 'commit' })} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}