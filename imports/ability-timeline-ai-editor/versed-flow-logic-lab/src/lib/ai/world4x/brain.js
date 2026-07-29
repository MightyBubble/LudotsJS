// 阵营大脑 —— 五层架构的装配与驱动（每层可替换可插拔）：
//  ┌ 战略层：HTN（method 由 utility grand_strategy 选择）   每 10 回合
//  ├ 中观层：HTN + Utility（建造优先级/小队任务编组）        每 4 回合
//  ├ 半自主单位层：GOAP（工人/定居者/间谍/外交官/商队/侦察兵） 每回合
//  ├ 战术层：BT（攻城小队）+ FSM（间谍小队）                 每回合
//  └ 外交层：关系值 + 条约 FSM + Utility 提案评估            每 6 回合
// 所有层共享同一份知识包（BB/Mem/WS/Belief），所有"做"都经由指令总线 → 模板图。

import { createKnowledge, createBitRegistry, MemClock } from '../core/knowledge.js';
import { bakeBeliefs, evaluateBeliefs, beliefGet } from '../core/belief.js';
import { bakeUtilitySet, evaluateUtility, utilityBest, snapshotUtility } from '../utility/utility.js';
import { createGoapController } from '../goap/goap.js';
import { createHtnController } from '../htn/htn.js';
import { createBtInstance, tickBt } from '../bt/bt.js';
import { createFsmInstance, tickFsm } from '../fsm/fsm.js';
import { createCommandBus, createTemplateLibrary, BUILTIN_TEMPLATES } from '../templates/library.js';
import { createDiplomacy } from '../diplomacy/diplomacy.js';
import { createWorld, UNIT_TYPES, TERRAIN } from './world.js';
import { TEMPLATES_4X } from './templates4x.js';
import { WS_BITS, BELIEF_DEFS, UTILITY_SETS, GOAP_ACTIONS, HTN_GRAND, SIEGE_SQUAD_BT, SPY_FSM } from './content.js';

const CITY_NAMES = ['咸阳', '洛阳', '成都', '邯郸', '临淄', '郢都', '姑苏', '大梁', '蓟城', '会稽', '晋阳', '宛城'];

// 单位 GOAP：角色 → { 目标(函数), 动作子集 }
const ROLE_GOALS = {
  settler: (agent) => [['has_city'], ['has_2cities'], ['has_3cities']].find(([b]) => !agent.knowledge.ws.get(b))?.map((bit) => ({ bit })) || [{ bit: 'has_3cities' }],
  worker: (agent) => [['farm_built'], ['mine_built'], ['market_built'], ['walls_built'], ['barracks_built']].find(([b]) => !agent.knowledge.ws.get(b))?.map((bit) => ({ bit })) || [{ bit: 'walls_built' }],
  scout: () => [{ bit: 'north_scouted' }],
  spy: () => [{ bit: 'enemy_weak' }],
  diplomat: () => [{ bit: 'embassy_qi' }],
  caravan: () => [{ bit: 'trade_route_active' }],
};
const ROLE_ACTIONS = {
  settler: ['goto_site', 'found_city'],
  worker: ['goto_own_city', 'build_farm', 'build_mine', 'build_market', 'build_barracks', 'build_walls'],
  scout: ['scout_north'],
  spy: ['sneak_to_enemy', 'sabotage'],
  diplomat: ['embassy_qi'],
  caravan: ['trade_route'],
};

export function createScenario(world, library) {
  world.factions = [
    { id: 'qin', name: '秦', color: '#ef4444', gold: 40 },
    { id: 'chu', name: '楚', color: '#3b82f6', gold: 40 },
    { id: 'qi', name: '齐', color: '#22c55e', gold: 40 },
  ];
  world.diplomacy = createDiplomacy(world.factions.map((f) => f.id));
  const bitReg = createBitRegistry(WS_BITS);
  const utilitySets = Object.fromEntries(Object.entries(UTILITY_SETS).map(([k, v]) => [k, bakeUtilitySet(v)]));

  // 初始：秦据南方 (11,10)，楚据北方 (11,3)，齐据东南 (18,11)
  const seeds = [
    { f: 0, city: [10, 10], units: [['settler', 12, 11], ['warrior', 10, 9]] },
    { f: 1, city: [11, 3], units: [['settler', 13, 2], ['warrior', 12, 4]] },
    { f: 2, city: [18, 11], units: [['warrior', 17, 10], ['scout', 16, 12]] },
  ];
  seeds.forEach((s) => {
    world.foundCity(s.f, CITY_NAMES[s.f * 3], s.city[0], s.city[1]);
    s.units.forEach(([t, x, y]) => world.spawnUnit(s.f, t, x, y));
  });

  const brains = world.factions.map((f, i) => createBrain(world, i, f, library, bitReg, utilitySets));
  return { brains, bitReg, utilitySets };
}

// 一站式装配：世界 + 模板库 + 三阵营大脑 + 推进函数（UI/自检共用入口）
export function createGame(seed = 20260726, entityGraphs = []) {
  const world = createWorld(seed);
  const library = createTemplateLibrary(entityGraphs, BUILTIN_TEMPLATES);
  for (const g of TEMPLATES_4X) library.register(g, g.kind);
  const { brains, bitReg, utilitySets } = createScenario(world, library);
  const game = {
    world, library, brains, bitReg, utilitySets,
    step() {
      world.tickTurn();
      for (const b of brains) b.tick();
    },
    run(turns) { for (let i = 0; i < turns; i++) this.step(); },
  };
  return game;
}

function createBrain(world, factionIdx, faction, library, bitReg, utilitySets) {
  const knowledge = createKnowledge({ registry: bitReg });
  const beliefs = bakeBeliefs(BELIEF_DEFS); // 每阵营独立的主观认识状态（曲线输出/EMA 不共享）
  // 每阵营克隆 HTN 域：宣战/建交目标 = 最近的对手（秦↔楚，齐→楚；齐的使馆改派秦）
  const htnDomain = JSON.parse(JSON.stringify(HTN_GRAND));
  htnDomain.tasks.p_declare_war.params = { faction: factionIdx === 2 ? 1 : factionIdx === 1 ? 0 : 1 };
  htnDomain.tasks.p_embassy_qi.params = { faction: factionIdx === 2 ? 0 : 2 };
  const agent = {
    id: faction.id, name: faction.name, factionIdx, key: `f${factionIdx}`,
    knowledge, world,
    cityCount: 0,
    cityName: () => CITY_NAMES[(factionIdx * 4 + (++agent.cityCount)) % CITY_NAMES.length],
    capital() {
      const c = world.cities;
      for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.faction[i] === factionIdx) return { x: c.x[i], y: c.y[i], id: i };
      return null;
    },
    sensors: [],
    buses: { strategic: createCommandBus(library), mid: createCommandBus(library), diplo: createCommandBus(library) },
    htn: null, units: new Map(), squads: [],
    beliefs, utilitySets,
    uStore: { grand: {}, mid: {}, diplo: {} }, // 动量状态按阵营隔离（baked set 共享，状态不共享）
    beliefsView: { get: (k) => beliefGet(beliefs, k) },
    strategyChoice: null, diploChoice: null, midChoice: null,
  };

  agent.htn = createHtnController({
    domain: htnDomain,
    // GOAL 由 utility 切换：战略抉择结果（conquer_north/economic_boom/diplomatic_play）直接映射 goal 加分
    goalScore: (goal) => (agent.strategyChoice?.id === goal.id ? 1.5 : 0),
    onEvent: (e) => {
      if (e.type === 'htn_planned') {
        // 计划签名去重：同样的原语序列只播报一次（防事件流洪峰）
        const sig = e.trace.filter((t) => t.kind === 'primitive').map((t) => t.command).join('→');
        if (sig !== agent._lastHtnSig) {
          agent._lastHtnSig = sig;
          world.log('plan', `${faction.name} 战略分解[${e.goalName || e.goal}]（${sig}）`, faction.id);
        }
      }
    },
  });

  // 传感器：视野 + 阵营事实同步（世界 → 知识包的唯一通道）
  agent.syncKnowledge = () => {
    const bb = knowledge.bb, ws = knowledge.ws;
    MemClock.time = world.time;
    // 视野传感器
    const perceived = world.perceiveFor(factionIdx);
    const prev = bb.get('perceived') || [];
    const prevIds = new Set(prev.map((s) => `${s.kind}${s.id}`));
    for (const s of perceived) {
      if (!prevIds.has(`${s.kind}${s.id}`)) knowledge.mem.add('spotted', { kind: s.kind, id: s.id }, world.time);
    }
    bb.set('perceived', perceived);
    // 阵营客观事实 → BB（belief/utility 的输入）
    const c = world.cities, u = world.units;
    let cityCount = 0, army = 0, caravans = 0, gold = faction.gold;
    for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.faction[i] === factionIdx) cityCount++;
    for (let i = 0; i < u.alive.length; i++) {
      if (!u.alive[i] || u.faction[i] !== factionIdx) continue;
      const role = UNIT_TYPES[u.type[i]].role;
      if (role === 'army' || role === 'siege') army++;
      if (u.type[i] === 'caravan') caravans++;
    }
    bb.set('gold', gold); bb.set('city_count', cityCount); bb.set('army_count', army);
    const others = world.factions.filter((x) => x.id !== faction.id);
    bb.set('min_relation', Math.min(...others.map((o) => world.diplomacy.get(faction.id, o.id))));
    // 事实 → WS 位（GOAP/HTN 的客观词汇）
    const anyBuilding = (b) => { for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.faction[i] === factionIdx && c.buildings[i].includes(b)) return true; return false; };
    const anyUnit = (t) => { for (let i = 0; i < u.alive.length; i++) if (u.alive[i] && u.faction[i] === factionIdx && u.type[i] === t) return true; return false; };
    ws.set('has_city', cityCount >= 1); ws.set('has_2cities', cityCount >= 2); ws.set('has_3cities', cityCount >= 3);
    ws.set('farm_built', anyBuilding('farm')); ws.set('mine_built', anyBuilding('mine'));
    ws.set('market_built', anyBuilding('market')); ws.set('barracks_built', anyBuilding('barracks')); ws.set('walls_built', anyBuilding('walls'));
    ws.set('has_army', army >= 2); ws.set('has_siege', anyUnit('catapult'));
    ws.set('has_spy', anyUnit('spy')); ws.set('has_diplomat', anyUnit('diplomat'));
    ws.set('has_caravan', anyUnit('caravan')); ws.set('has_scout', anyUnit('scout'));
    ws.set('trade_route_active', caravans > 0 && world.turn % 20 < 17); // 商路周期性中断，商队定期重跑
    ws.set('enemy_city_known', perceived.some((s) => s.kind === 'city'));
    ws.set('enemy_weak', knowledge.mem.count('sabotage_done', 40) > 0 || perceived.some((s) => s.kind === 'city' && s.hp < 12 && !s.walls));
    let ownNorth = false;
    for (let i = 0; i < u.alive.length; i++) if (u.alive[i] && u.faction[i] === factionIdx && u.y[i] < 6) { ownNorth = true; break; }
    ws.set('north_scouted', perceived.some((s) => s.y < 6) || ownNorth);
    ws.set('at_war', others.some((o) => world.diplomacy.atWar(faction.id, o.id)));
    ws.set('allied_qi', world.diplomacy.allied(faction.id, 'qi'));
    const cap = agent.capital();
    ws.set('capital_safe', !cap || !perceived.some((s) => s.kind === 'unit' && world.dist(s.x, s.y, cap.x, cap.y) <= 4));
    ws.set('north_conquered', cityCount > 0 && world.factions.every((f, fi) => fi === factionIdx || !hasNorthCity(world, fi)));
    ws.set('army_healthy', army === 0 || avgArmyHp(world, factionIdx) >= 0.7);
    // 受击传感器：世界 hits 缓冲 → mem 记录（cond.under_attack / belief:threat 的输入）
    for (let i = 0; i < u.alive.length; i++) {
      if (!u.alive[i] || u.faction[i] !== factionIdx) continue;
      const hs = world.hits.get(`u${i}`);
      if (hs?.length) {
        for (const h of hs) knowledge.mem.add('attacked', h, world.time);
        world.hits.set(`u${i}`, []);
      }
    }
    // 主观认识
    evaluateBeliefs(beliefs, { bb, mem: knowledge.mem, ws, beliefs: agent.beliefsView });
  };

  // ── 各层 tick ──
  agent.tick = () => {
    agent.syncKnowledge();
    const turn = world.turn;
    const ctxBase = makeCtx(agent, null, agent.buses.strategic);

    // 战略层（每 10 回合）：utility 展示抉择 → HTN 分解执行
    if (turn % 10 === 1) {
      const u = utilitySets.grand_strategy;
      evaluateUtility(u, ctxBase, [], agent.uStore.grand);
      agent.strategyChoice = utilityBest(u, '战略抉择');
    }
    agent.buses.strategic.tick(ctxBase, 1);
    agent.htn.tick(agent, ctxBase);

    // 中观层（每 4 回合）：建造优先级 + 小队任务编组
    if (turn % 4 === 2) {
      const u = utilitySets.city_build;
      evaluateUtility(u, ctxBase, [], agent.uStore.mid);
      const best = utilityBest(u, '建造决策');
      agent.midChoice = best;
      const midCmd = best?.command?.name;
      if (midCmd && best.score > 0.25) {
        if (midCmd.startsWith('build_')) {
          // 建造是工人级动作：投递给空闲工人的指令总线（与其 GOAP 同一总线，抢占式）
          const wIdx = findFreeUnit(agent, 'worker');
          const ua = wIdx >= 0 ? agent.units.get(wIdx) : null;
          if (ua) ua.bus.issue(midCmd, { origin: 'utility:mid' }, makeCtx(agent, wIdx, ua.bus));
        } else {
          agent.buses.mid.issue(midCmd, { origin: 'utility:mid' }, makeCtx(agent, null, agent.buses.mid));
        }
      }
      assignSquadMissions(agent);
    }
    agent.buses.mid.tick(makeCtx(agent, null, agent.buses.mid), 1);

    // 外交层（每 6 回合）
    if (turn % 6 === 3) {
      const targets = world.factions.filter((f, fi) => fi !== factionIdx).map((f, fi2) => {
        const cap = agent.capital();
        const oc = otherCapital(world, f.id);
        const power = factionPower(world, world.factions.findIndex((x) => x.id === f.id));
        return { id: f.id, name: f.name, rel: world.diplomacy.get(faction.id, f.id), power, treaty: world.diplomacy.treatyOf(faction.id, f.id), dist: cap && oc ? world.dist(cap.x, cap.y, oc.x, oc.y) : 10 };
      });
      const u = utilitySets.diplomacy;
      const ctx = { ...ctxBase, self: { team: faction.id }, dist: (s, t) => t?.dist ?? 10 };
      evaluateUtility(u, ctx, targets, agent.uStore.diplo);
      const best = utilityBest(u, '外交决策');
      agent.diploChoice = best ? { ...best, target: best.target } : null;
      if (best && best.score > 0.12 && best.target) {
        const tIdx = world.factions.findIndex((x) => x.id === best.target.id);
        const cmd = best.command?.name;
        // 不重复已成立的条约
        const treaty = world.diplomacy.treatyOf(faction.id, best.target.id);
        if (cmd && !(cmd === 'declare_war' && treaty === 'war') && !(cmd === 'propose_alliance' && treaty === 'alliance')) {
          agent.buses.diplo.issue(cmd, { faction: tIdx, origin: 'utility' }, makeCtx(agent, null, agent.buses.diplo));
        }
      }
    }
    agent.buses.diplo.tick(makeCtx(agent, null, agent.buses.diplo), 1);

    // 半自主单位层（每回合）：GOAP 单位 + 战术小队
    syncUnitAgents(agent, library, bitReg, beliefs);
    for (const [, ua] of agent.units) ua.tick();
    for (const sq of agent.squads) sq.tick();
  };

  // UI/自检用：构造图运行上下文
  agent.makeCtx = (unitIdx = null, bus = null, target = null) =>
    makeCtx(agent, unitIdx, bus || agent.buses.strategic, target);

  return agent;
}

function hasNorthCity(world, factionIdx) {
  const c = world.cities;
  for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.faction[i] === factionIdx && c.y[i] < 6) return true;
  return false;
}
// 中观层用工：找不在小队中的空闲己方单位
function findFreeUnit(agent, type) {
  const u = agent.world.units;
  const busy = new Set(agent.squads.flatMap((s) => s.members));
  for (let i = 0; i < u.alive.length; i++) {
    if (u.alive[i] && u.faction[i] === agent.factionIdx && u.type[i] === type && !busy.has(i)) return i;
  }
  return -1;
}
function avgArmyHp(world, factionIdx) {
  const u = world.units;
  let sum = 0, n = 0;
  for (let i = 0; i < u.alive.length; i++) {
    if (u.alive[i] && u.faction[i] === factionIdx && ['army', 'siege'].includes(UNIT_TYPES[u.type[i]].role)) { sum += u.hp[i] / UNIT_TYPES[u.type[i]].hp; n++; }
  }
  return n ? sum / n : 1;
}
function otherCapital(world, factionId) {
  const fi = world.factions.findIndex((x) => x.id === factionId);
  const c = world.cities;
  for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.faction[i] === fi) return { x: c.x[i], y: c.y[i] };
  return null;
}
function factionPower(world, factionIdx) {
  const u = world.units, c = world.cities;
  let p = 0;
  for (let i = 0; i < u.alive.length; i++) if (u.alive[i] && u.faction[i] === factionIdx) p += UNIT_TYPES[u.type[i]].atk + 5;
  for (let i = 0; i < c.alive.length; i++) if (c.alive[i] && c.faction[i] === factionIdx) p += c.size[i] * 8;
  return p;
}

// 图运行 ctx：bb/mem/ws/beliefs/utility/commands + 世界操作面
function makeCtx(agent, unitIdx, bus, target = null) {
  return {
    time: agent.world.time, dt: 1, rng: agent.world.rng,
    bb: agent.knowledge.bb, mem: agent.knowledge.mem, ws: agent.knowledge.ws,
    beliefs: agent.beliefsView,
    utility: {
      score: (name, t) => 0, best: () => null,
    },
    commands: bus || agent.buses.strategic,
    world: agent.world, agent, unitIdx, target,
    self: agent,
    log: (msg) => agent.world.log('graph', typeof msg === 'string' ? msg : JSON.stringify(msg), agent.id),
  };
}

// 单位 agent 同步：新单位建 GOAP 控制器，死单位移除
function syncUnitAgents(agent, library, bitReg, beliefs) {
  const u = agent.world.units;
  const seen = new Set();
  for (let i = 0; i < u.alive.length; i++) {
    if (!u.alive[i] || u.faction[i] !== agent.factionIdx) continue;
    const type = u.type[i];
    const role = UNIT_TYPES[type].role;
    seen.add(i);
    if (agent.units.has(i) || agent.squads.some((s) => s.members.includes(i))) continue;
    if (!ROLE_GOALS[type]) continue; // army/siege 由小队编组接管
    const knowledge = createKnowledge({ registry: bitReg, shareWs: agent.knowledge.ws, memCap: 32 });
    const bus = createCommandBus(library);
    const ua = {
      id: `u${i}`, unitIdx: i, type, knowledge, bus,
      goap: createGoapController({
        actions: GOAP_ACTIONS.filter((a) => ROLE_ACTIONS[type].includes(a.name)),
        goal: () => ROLE_GOALS[type]({ knowledge }),
        maxDepth: 8,
        onEvent: (e) => {
          if (e.type === 'planned') {
            const sig = e.plan.join('→');
            if (sig !== ua._lastPlanSig) {
              ua._lastPlanSig = sig;
              agent.world.log('plan', `${agent.name} 的${UNIT_TYPES[type].label} 规划：${sig}`, agent.id);
            }
          }
        },
      }),
      tick() {
        knowledge.bb.set('x', u.x[i]); knowledge.bb.set('y', u.y[i]);
        const ctx = makeCtx(agent, i, bus);
        ctx.mem = knowledge.mem; // 单位自己的 mem（受击等）
        bus.tick(ctx, 1);
        this.goap.tick({ id: `u${i}`, knowledge }, ctx);
      },
    };
    agent.units.set(i, ua);
  }
  for (const [i] of agent.units) if (!seen.has(i)) agent.units.delete(i);
}

// 中观层：小队任务编组（偷袭 / 攻城）
function assignSquadMissions(agent) {
  const u = agent.world.units;
  const ws = agent.knowledge.ws;
  const busy = new Set(agent.squads.flatMap((s) => s.members));
  const free = (pred) => {
    for (let i = 0; i < u.alive.length; i++) {
      if (u.alive[i] && u.faction[i] === agent.factionIdx && !busy.has(i) && pred(u.type[i], i)) return i;
    }
    return -1;
  };

  // 偷袭任务：间谍 + 已知敌城 + 未在任务中 → 间谍 FSM 小队
  if (ws.get('has_spy') && ws.get('enemy_city_known') && !agent.squads.some((s) => s.kind === 'spy')) {
    const spyIdx = free((t) => t === 'spy');
    if (spyIdx >= 0) {
      agent.units.delete(spyIdx); // 从 GOAP 接管
      const fsm = createFsmInstance(SPY_FSM, agent.buses.mid.library.templates);
      const squad = {
        kind: 'spy', label: '偷袭小队', members: [spyIdx], fsm,
        tick: () => {
          const ctx = makeCtx(agent, spyIdx, agent.buses.mid);
          tickFsm(fsm, ctx, 1);
          if (fsm.state === 'done' || !u.alive[spyIdx]) {
            agent.squads = agent.squads.filter((s) => s !== squad);
            if (u.alive[spyIdx]) agent.world.log('mission', `${agent.name} 的间谍完成破坏后撤离归队`, agent.id);
          }
        },
      };
      agent.squads.push(squad);
      agent.world.log('mission', `${agent.name} 组织了一次偷袭：间谍渗透敌城`, agent.id);
    }
  }

  // 攻城任务：交战 + 投石车 + 敌城已知 → BT 攻城小队（勇士×2 + 投石车）
  if (ws.get('at_war') && ws.get('has_siege') && ws.get('enemy_city_known') && !agent.squads.some((s) => s.kind === 'siege')) {
    const cata = free((t) => t === 'catapult');
    const w1 = free((t) => t === 'warrior');
    const w2 = w1 >= 0 ? free((t, i) => t === 'warrior' && i !== w1) : -1;
    if (cata >= 0 && w1 >= 0) {
      const members = [cata, w1, ...(w2 >= 0 ? [w2] : [])];
      members.forEach((m) => agent.units.delete(m));
      // 目标 = 感知中最近的敌城
      const enemyCity = (agent.knowledge.bb.get('perceived') || []).find((s) => s.kind === 'city');
      const target = enemyCity ? { kind: 'city', id: enemyCity.id } : null;
      const bts = members.map((m) => createBtInstance(SIEGE_SQUAD_BT, agent.buses.mid.library.templates));
      const buses = members.map(() => createCommandBus(agent.buses.mid.library));
      const squad = {
        kind: 'siege', label: '攻城小队', members, bts, buses, target,
        tick: () => {
          members.forEach((m, k) => {
            if (!u.alive[m]) return;
            const ctx = makeCtx(agent, m, buses[k], target);
            buses[k].tick(ctx, 1);
            tickBt(bts[k], ctx, 1);
          });
          const targetCity = target && agent.world.cities.alive[target.id] && agent.world.cities.faction[target.id] !== agent.factionIdx;
          if (members.every((m) => !u.alive[m]) || !targetCity) {
            agent.squads = agent.squads.filter((s) => s !== squad);
            agent.world.log('mission', `${agent.name} 的攻城小队任务结束`, agent.id);
          }
        },
      };
      agent.squads.push(squad);
      agent.world.log('mission', `${agent.name} 组建了攻城小队（${members.length} 单位）直取敌城`, agent.id);
    }
  }
}
