import React, { useEffect, useRef, useState } from 'react';
import { createGame } from '@/lib/ai/world4x/brain.js';
import { UNIT_TYPES, TERRAIN, MAP_W, MAP_H, BUILDINGS } from '@/lib/ai/world4x/world.js';
import { WS_BITS, BELIEF_DEFS } from '@/lib/ai/world4x/content.js';
import { snapshotUtility } from '@/lib/ai/utility/utility.js';
import { beliefGet } from '@/lib/ai/core/belief.js';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, StepForward, RotateCcw, Crown, Factory, Handshake, Users, Crosshair } from 'lucide-react';
import { UE } from '@/components/aieditor/theme.js';

const CS = 30; // 单元格像素
const W = MAP_W * CS, H = MAP_H * CS;
const TERRAIN_COLOR = { [TERRAIN.PLAIN]: '#1c2b23', [TERRAIN.FOREST]: '#17351f', [TERRAIN.HILL]: '#3a3128', [TERRAIN.WATER]: '#0e3a52' };
const EV_COLOR = { plan: '#8b949e', diplo: '#d29922', econ: '#3fb950', city: '#3fb950', covert: '#a371f7', mission: '#58a6ff', war: '#f85149', graph: '#6e7681' };
const SEEDS = [20260726, 1, 7, 42, 777, 12345];

function drawMap(canvas, world, selected) {
  const g = canvas.getContext('2d');
  g.fillStyle = '#0d1117'; g.fillRect(0, 0, W, H);
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    g.fillStyle = TERRAIN_COLOR[world.terrain[y * MAP_W + x]] || '#222';
    g.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2);
  }
  const c = world.cities, u = world.units;
  // 城市
  for (let i = 0; i < c.alive.length; i++) {
    if (!c.alive[i]) continue;
    const f = world.factions[c.faction[i]];
    const cx = c.x[i] * CS + CS / 2, cy = c.y[i] * CS + CS / 2;
    const sel = selected?.kind === 'city' && selected.idx === i;
    g.beginPath(); g.arc(cx, cy, 7 + Math.min(6, c.size[i]), 0, 7);
    g.fillStyle = f.color; g.fill();
    g.lineWidth = sel ? 3 : 1.5; g.strokeStyle = sel ? '#fff' : '#0008'; g.stroke();
    g.fillStyle = '#fff'; g.font = 'bold 10px sans-serif'; g.textAlign = 'center';
    g.fillText(`${c.name[i]}${c.size[i] > 1 ? c.size[i] : ''}`, cx, cy - 11);
    if (c.hp[i] < 20) {
      g.fillStyle = '#000a'; g.fillRect(cx - 12, cy + 11, 24, 3);
      g.fillStyle = '#f85149'; g.fillRect(cx - 12, cy + 11, 24 * Math.max(0, c.hp[i]) / 20, 3);
    }
  }
  // 单位（同格错位）
  const byPos = {};
  for (let i = 0; i < u.alive.length; i++) {
    if (!u.alive[i]) continue;
    const k = u.x[i] + ',' + u.y[i]; const n = byPos[k] || 0; byPos[k] = n + 1;
    const f = world.factions[u.faction[i]];
    const t = UNIT_TYPES[u.type[i]];
    const cx = u.x[i] * CS + CS / 2 + (n % 2 ? 7 : -7), cy = u.y[i] * CS + CS / 2 + (n > 1 ? 6 : 0);
    const sel = selected?.kind === 'unit' && selected.idx === i;
    g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fillStyle = '#0d1117dd'; g.fill();
    g.lineWidth = sel ? 3 : 2; g.strokeStyle = sel ? '#fff' : f.color; g.stroke();
    g.font = '11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(t.glyph, cx, cy + 0.5);
    g.textBaseline = 'alphabetic';
    if (u.hp[i] < t.hp) {
      g.fillStyle = '#000a'; g.fillRect(cx - 9, cy + 11, 18, 2.5);
      g.fillStyle = '#3fb950'; g.fillRect(cx - 9, cy + 11, 18 * Math.max(0, u.hp[i]) / t.hp, 2.5);
    }
  }
}

function Bar({ v, color = '#58a6ff', right }) {
  const pct = Math.round(Math.max(0, Math.min(1, v)) * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background: '#26262c' }}>
        <div className="h-full rounded" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="text-[10px] w-9 text-right" style={{ color: UE.dim }}>{right ?? v.toFixed(2)}</span>
    </div>
  );
}

function Panel({ icon, title, children }) {
  return (
    <div className="rounded-md p-2.5 space-y-1.5" style={{ background: UE.panel, border: `1px solid ${UE.border}` }}>
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: UE.text }}>{icon}{title}</div>
      {children}
    </div>
  );
}

export default function GrandStrategy() {
  const [seed, setSeed] = useState(20260726);
  const gameRef = useRef(null);
  if (!gameRef.current) gameRef.current = createGame(seed);
  const game = gameRef.current;
  const [turn, setTurn] = useState(game.world.turn);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [faction, setFaction] = useState(0);
  const [selected, setSelected] = useState(null); // {kind:'unit'|'city', idx}
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => { game.run(speed); setTurn(game.world.turn); }, 350);
    return () => clearInterval(iv);
  }, [playing, speed, game]);

  useEffect(() => { if (canvasRef.current) drawMap(canvasRef.current, game.world, selected); });

  const reset = (s) => { setPlaying(false); gameRef.current = createGame(s); setTurn(gameRef.current.world.turn); setSelected(null); };
  const world = game.world;
  const brain = game.brains[faction];
  const u = world.units, c = world.cities;

  const clickMap = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / CS), y = Math.floor((e.clientY - r.top) / CS);
    for (let i = 0; i < u.alive.length; i++) if (u.alive[i] && u.x[i] === x && u.y[i] === y) return setSelected({ kind: 'unit', idx: i });
    for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.x[i] === x && c.y[i] === y) return setSelected({ kind: 'city', idx: i });
    setSelected(null);
  };

  // 战略分解明细（调试图，低频允许分配）
  let stratDecisions = [];
  try { stratDecisions = snapshotUtility(game.utilitySets.grand_strategy, brain.makeCtx())[0]?.decisions || []; } catch (e) { stratDecisions = []; }

  const events = world.events.slice(-80).reverse();
  const selU = selected?.kind === 'unit' && u.alive[selected.idx] ? selected.idx : null;
  const selC = selected?.kind === 'city' && c.alive[selected.idx] ? selected.idx : null;
  const selFaction = selU !== null ? u.faction[selU] : selC !== null ? c.faction[selC] : null;
  const selBrain = selFaction !== null ? game.brains[selFaction] : null;
  const selUa = selU !== null ? selBrain?.units.get(selU) : null;
  const selSquad = selU !== null ? selBrain?.squads.find((s) => s.members.includes(selU)) : null;
  const wsSnap = selBrain ? selBrain.knowledge.ws.snapshot() : {};

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]" style={{ background: UE.canvas, color: UE.text }}>
      <div className="flex items-center gap-2 px-3 py-2 flex-wrap" style={{ background: UE.toolbar, borderBottom: `1px solid ${UE.border}` }}>
        <Crown className="w-5 h-5 text-yellow-500" />
        <h1 className="font-semibold text-sm">大战略 4X · 五层 AI 原型</h1>
        <Badge variant="outline">回合 {turn}</Badge>
        <div className="flex-1" />
        <Button size="sm" variant={playing ? 'secondary' : 'default'} onClick={() => setPlaying(!playing)}>
          {playing ? <><Pause className="w-4 h-4 mr-1" />暂停</> : <><Play className="w-4 h-4 mr-1" />运行</>}
        </Button>
        <Button size="sm" variant="outline" className="border-[#2e2e36]" onClick={() => { game.step(); setTurn(game.world.turn); }}><StepForward className="w-4 h-4 mr-1" />单步</Button>
        <Select value={String(speed)} onValueChange={(v) => setSpeed(+v)}>
          <SelectTrigger className="w-28 h-8 bg-[#0E0F12] border-[rgba(255,255,255,0.08)]"><SelectValue /></SelectTrigger>
          <SelectContent>{[1, 3, 10, 30].map((s) => <SelectItem key={s} value={String(s)}>{s} 回合/tick</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(seed)} onValueChange={(v) => { setSeed(+v); reset(+v); }}>
          <SelectTrigger className="w-36 h-8 bg-[#0E0F12] border-[rgba(255,255,255,0.08)]"><SelectValue /></SelectTrigger>
          <SelectContent>{SEEDS.map((s) => <SelectItem key={s} value={String(s)}>种子 {s}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="border-[#2e2e36]" onClick={() => reset(seed)}><RotateCcw className="w-4 h-4 mr-1" />重置</Button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* 左：地图 + 事件流 */}
        <div className="flex flex-col min-w-0 flex-1" style={{ borderRight: `1px solid ${UE.border}` }}>
          <div className="p-2 overflow-auto">
            <canvas ref={canvasRef} width={W} height={H} onClick={clickMap} className="rounded cursor-pointer" style={{ maxWidth: '100%', border: `1px solid ${UE.border}` }} />
            <div className="flex gap-3 mt-1.5 text-[10px] flex-wrap" style={{ color: UE.dim }}>
              {world.factions.map((f, i) => {
                let alive = false;
                for (let k = 0; k < c.alive.length; k++) if (c.alive[k] && c.faction[k] === i) { alive = true; break; }
                return <span key={f.id} className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: f.color }} />{f.name} · {Math.round(f.gold)}金{alive ? '' : '（已灭亡）'}</span>;
              })}
              <span>平原·森林·丘陵·海峡 | 点击单位/城市查看决策状态</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-1 text-[11px] space-y-0.5" style={{ borderTop: `1px solid ${UE.border}` }}>
            {events.map((e, i) => <div key={i} style={{ color: EV_COLOR[e.type] || '#8b949e' }}><span className="opacity-50 mr-1">[{e.t}]</span>{e.msg}</div>)}
          </div>
        </div>

        {/* 右：五层决策面板 */}
        <div className="w-[380px] shrink-0 overflow-y-auto p-2 space-y-2">
          <div className="flex gap-1">
            {world.factions.map((f, i) => (
              <button key={f.id} onClick={() => setFaction(i)}
                className="flex-1 text-xs py-1.5 rounded"
                style={faction === i
                  ? { color: f.color, border: `1px solid ${UE.selected}`, background: 'rgba(255,255,255,0.08)', fontWeight: 600 }
                  : { color: f.color, border: `1px solid ${UE.border}` }}>{f.name}</button>
            ))}
          </div>

          <Panel icon={<Crown className="w-3.5 h-3.5 text-yellow-500" />} title="战略层 · HTN（Utility 选 GOAL → 任务分解）">
            {brain.strategyChoice ? (
              <>
                <div className="text-xs">当前战略：<b>{brain.strategyChoice.name}</b> <span className="text-[#84848e]">{brain.strategyChoice.score.toFixed(2)}</span></div>
                {stratDecisions.map((d) => (
                  <div key={d.name} className="text-[11px]">
                    <div className={'flex justify-between ' + (d.name === brain.strategyChoice.name ? 'font-semibold' : 'text-[#84848e]')}><span>{d.name}</span></div>
                    <Bar v={d.final} color={d.name === brain.strategyChoice.name ? '#d29922' : '#30363d'} />
                  </div>
                ))}
                {brain.htn.lastTrace && (
                  <div className="text-[10px] text-[#84848e] pt-1">
                    HTN 分解：{brain.htn.lastTrace.filter((t) => t.kind === 'primitive').map((t) => t.command).join(' → ') || '（空）'}
                  </div>
                )}
              </>
            ) : <div className="text-[11px] text-[#84848e]">尚未开局评估</div>}
          </Panel>

          <Panel icon={<Factory className="w-3.5 h-3.5 text-green-500" />} title="中观层 · HTN + Utility（建造/编组，每 4 回合）">
            {brain.midChoice ? (
              <div className="text-xs">指令：<b>{brain.midChoice.command?.name || brain.midChoice.name}</b> <span className="text-[#84848e]">{brain.midChoice.score.toFixed(2)}</span></div>
            ) : <div className="text-[11px] text-[#84848e]">空闲（无评分达阈的决策）</div>}
          </Panel>

          <Panel icon={<Handshake className="w-3.5 h-3.5 text-blue-400" />} title="外交层 · 关系值 + 条约 FSM（远交近攻）">
            <div className="space-y-1">
              {world.factions.filter((f) => f.id !== world.factions[faction].id).map((f) => {
                const rel = world.diplomacy.get(world.factions[faction].id, f.id);
                const treaty = world.diplomacy.treatyOf(world.factions[faction].id, f.id);
                return (
                  <div key={f.id} className="text-[11px]">
                    <div className="flex justify-between"><span>对 {f.name}</span><span>{Math.round(rel)} · {treaty}</span></div>
                    <Bar v={(rel + 100) / 200} color={treaty === 'war' ? '#f85149' : treaty === 'alliance' ? '#3fb950' : '#58a6ff'} right={String(Math.round(rel))} />
                  </div>
                );
              })}
            </div>
            {brain.diploChoice && <div className="text-[11px]">外交行动：<b>{brain.diploChoice.name}</b>{brain.diploChoice.target ? ` → ${brain.diploChoice.target.name}` : ''}</div>}
          </Panel>

          <Panel icon={<Users className="w-3.5 h-3.5 text-purple-400" />} title="战术层 · Squad（偷袭 FSM / 攻城 BT）">
            <div className="space-y-1 text-[11px]">
              {brain.squads.map((s, i) => (
                <div key={i} className="flex justify-between border-b border-[#2e2e36] pb-0.5">
                  <span>{s.label}（{s.members.length} 单位）</span>
                  <span className="text-[#84848e]">
                    {s.fsm ? `FSM:${s.fsm.state}` : `BT:${s.bts?.map((b) => b.lastStatus || 'run').join('/')}`}
                  </span>
                </div>
              ))}
              {!brain.squads.length && <span className="text-[#84848e]">无在编小队（条件：间谍+敌城已知 / 交战+投石车）</span>}
            </div>
          </Panel>

          <Panel icon={<Crosshair className="w-3.5 h-3.5 text-red-400" />} title="单位层 · GOAP（点选地图单位）">
            {selU !== null ? (() => {
              const t = UNIT_TYPES[u.type[selU]];
              const g = selUa?.goap;
              const wsOn = WS_BITS.filter((b) => wsSnap[b]);
              return (
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span><span style={{ color: world.factions[u.faction[selU]].color }}>{t.glyph}</span> <b>{t.label}</b> #{selU}</span>
                    <span className="text-[#84848e]">({u.x[selU]},{u.y[selU]}) HP {Math.round(u.hp[selU])}/{t.hp}{u.fortified[selU] ? ' · 驻防' : ''}</span>
                  </div>
                  {selSquad && <div>小队：<b>{selSquad.label}</b>{selSquad.fsm ? ` · FSM ${selSquad.fsm.state}` : ' · BT 驱动'}</div>}
                  {g && (
                    <>
                      <div>GOAP 计划：{g.plan ? <b>{g.plan.map((a) => a.name).join(' → ')}</b> : <span className="text-[#84848e]">待机/目标已达成（重规划 {g.replans} 次）</span>}</div>
                      {g.plan && <div className="text-[#84848e]">进度 {Math.min(g.idx, g.plan.length)}/{g.plan.length} · 深度 ≤ 8</div>}
                    </>
                  )}
                  {!g && !selSquad && <div className="text-[#84848e]">（{t.role === 'army' || t.role === 'siege' ? '战斗单位：等待小队编组接管' : '待机'}）</div>}
                  {selBrain && (
                    <>
                      <div className="pt-1 text-[#84848e]">WorldState 位（{world.factions[selFaction].name} 阵营客观）：{wsOn.length ? wsOn.join(' · ') : '（空）'}</div>
                      <div className="space-y-0.5">
                        <div className="text-[#84848e]">信念（黑板→曲线的主观映射）：</div>
                        {BELIEF_DEFS.map((b) => (
                          <div key={b.key}>
                            <div className="flex justify-between text-[10px]"><span>{b.key}</span></div>
                            <Bar v={beliefGet(selBrain.beliefs, b.key)} color="#a371f7" />
                          </div>
                        ))}
                      </div>
                      {selUa && selUa.knowledge.mem.recent(3).length > 0 && (
                        <div className="text-[#84848e]">Mem：{selUa.knowledge.mem.recent(3).map((r) => r.type).join('；')}</div>
                      )}
                    </>
                  )}
                </div>
              );
            })() : selC !== null ? (
              <div className="space-y-1 text-[11px]">
                <div><b style={{ color: world.factions[c.faction[selC]].color }}>{c.name[selC]}</b>（{world.factions[c.faction[selC]].name}）规模 {c.size[selC]} · 城防 {Math.round(c.hp[selC])}/20</div>
                <div className="text-[#84848e]">建筑：{c.buildings[selC].length ? c.buildings[selC].map((b) => BUILDINGS[b]?.label || b).join('、') : '无'}</div>
                <div className="text-[#84848e]">队列：{c.queue[selC].length ? c.queue[selC].map((q) => UNIT_TYPES[q]?.label || BUILDINGS[q]?.label || q).join(' → ') : '空'} · 粮 {Math.round(c.food[selC])} 锤 {Math.round(c.prod[selC])}</div>
              </div>
            ) : <div className="text-[11px] text-[#84848e]">点击地图上的单位或城市查看详情</div>}
          </Panel>
        </div>
      </div>
    </div>
  );
}
