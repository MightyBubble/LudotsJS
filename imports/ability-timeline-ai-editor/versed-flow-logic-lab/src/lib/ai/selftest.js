// 引擎自检（浏览器/Node 通用）：返回 { passed, failed, failures[], logs[] }
import { compileGraph, obtainRun, releaseRun, startRun, tickRun } from './graph/graphvm.js';
import './graph/nodes.js';
import { createBitRegistry, createWorldState, createMem, createBlackboard, createKnowledge, MemClock } from './core/knowledge.js';
import { bakeBeliefs, evaluateBeliefs, beliefGet, applyCurve, applyNorm } from './core/belief.js';
import { bakeUtilitySet, evaluateUtility, utilityBest, snapshotUtility } from './utility/utility.js';
import { createTemplateLibrary, createCommandBus, BUILTIN_TEMPLATES } from './templates/library.js';
import { createBtInstance, tickBt } from './bt/bt.js';
import { createFsmInstance, tickFsm } from './fsm/fsm.js';
import { legacyToHfsm } from './fsm/hfsm.js';
import { goapPlan } from './goap/goap.js';
import { htnPlanGoal } from './htn/htn.js';
import { createDiplomacy, treatyEvent } from './diplomacy/diplomacy.js';
import { createGame } from './world4x/brain.js';
import { WS_BITS, BELIEF_DEFS, UTILITY_SETS, GOAP_ACTIONS, HTN_GRAND } from './world4x/content.js';

const n = (id, type, props) => ({ id, type, ...(props ? { props } : {}) });
const l = (f, fp, t, tp) => ({ from: [f, fp], to: [t, tp] });

export function runSelfTest() {
  let passed = 0, failed = 0;
  const failures = [];
  const logs = [];
  const ok = (name, cond) => { if (cond) passed++; else { failed++; failures.push(name); } };

  const mkCtx = (extra = {}) => ({ time: 0, dt: 0, rng: Math.random, logs: [], log(m) { this.logs.push(m); }, ...extra });
  function runToEnd(compiled, ctx, args, maxTicks = 50, dt = 0.1) {
    const r = obtainRun(compiled);
    startRun(r, args);
    let st = 'running';
    for (let i = 0; i < maxTicks && st === 'running'; i++) { ctx.time += dt; st = tickRun(r, ctx, dt); }
    const out = r.outSlots;
    releaseRun(r);
    return { st, out };
  }

  // 1. 同步图
  {
    const g = {
      name: 'math', outputs: [{ key: 'result' }],
      nodes: [
        n('s', 'flow.start'), n('e', 'flow.exit'),
        n('a', 'data.const', { value: 2 }), n('b', 'data.const', { value: 3 }),
        n('add', 'data.math', { op: 'add' }), n('c', 'data.const', { value: 4 }),
        n('mul', 'data.math', { op: 'mul' }), n('o', 'data.output', { key: 'result' }),
      ],
      links: [
        l('s', 'then', 'e', 'exec'),
        l('a', 'value', 'add', 'a'), l('b', 'value', 'add', 'b'),
        l('add', 'value', 'mul', 'a'), l('c', 'value', 'mul', 'b'),
        l('mul', 'value', 'o', 'value'),
      ],
    };
    const { st, out } = runToEnd(compileGraph(g), mkCtx());
    ok('GraphVM 同步数学图 (2+3)*4=20', st === 'success' && out?.result === 20);
  }
  // 2. 异步 + 分支保持
  {
    const g = {
      name: 'async',
      nodes: [
        n('s', 'flow.start'), n('seq', 'flow.sequence', { count: 2 }),
        n('d', 'flow.delay', { seconds: 0.2 }),
        n('la', 'act.log', { msg: 'A' }), n('lb', 'act.log', { msg: 'B' }),
      ],
      links: [l('s', 'then', 'seq', 'exec'), l('seq', 's0', 'd', 'exec'), l('d', 'then', 'la', 'exec'), l('seq', 's1', 'lb', 'exec')],
    };
    const ctx = mkCtx();
    const c = compileGraph(g);
    const r = obtainRun(c);
    startRun(r, {});
    let st = 'running';
    for (let i = 0; i < 8 && st === 'running'; i++) { ctx.time += 0.1; st = tickRun(r, ctx, 0.1); }
    ok('异步 delay + sequence 分支保持（A 先 B 后）', st === 'success' && ctx.logs.join(',') === 'A,B');
    releaseRun(r);
  }
  // 3. forEach
  {
    const mem = createMem(16);
    const g = {
      name: 'foreach',
      nodes: [
        n('s', 'flow.start'), n('arr', 'data.const', { value: [10, 20, 30] }),
        n('fe', 'flow.forEach'), n('ma', 'kb.memAdd', { type: 'item' }), n('e', 'flow.exit'),
      ],
      links: [
        l('s', 'then', 'fe', 'exec'), l('arr', 'value', 'fe', 'list'),
        l('fe', 'body', 'ma', 'exec'), l('fe', 'item', 'ma', 'data'),
        l('ma', 'then', 'fe', 'exec'), l('fe', 'done', 'e', 'exec'),
      ],
    };
    const { st } = runToEnd(compileGraph(g), mkCtx({ mem }));
    ok('forEach 循环（体可回连）', st === 'success' && mem.count('item') === 3 && mem.last('item').data === 30);
  }
  // 4. 函数 + 宏
  {
    const fnGraph = {
      name: 'double', kind: 'function',
      inputs: [{ key: 'x', type: 'number', default: 0 }], outputs: [{ key: 'result' }],
      nodes: [n('s', 'flow.start'), n('e', 'flow.exit'), n('i', 'data.input', { key: 'x' }), n('m', 'data.math', { op: 'mul', b: 2 }), n('o', 'data.output', { key: 'result' })],
      links: [l('s', 'then', 'e', 'exec'), l('i', 'value', 'm', 'a'), l('m', 'value', 'o', 'value')],
    };
    const macroGraph = {
      name: 'max2', kind: 'macro',
      nodes: [n('in', 'macro.in'), n('out', 'macro.out'), n('cmp', 'data.compare', { op: '>=' }), n('sel', 'data.select')],
      links: [l('in', 'a', 'cmp', 'a'), l('in', 'b', 'cmp', 'b'), l('cmp', 'value', 'sel', 'cond'), l('in', 'a', 'sel', 'a'), l('in', 'b', 'sel', 'b'), l('sel', 'value', 'out', 'max')],
    };
    const resolve = (id) => (id === 'double' ? fnGraph : id === 'max2' ? macroGraph : null);
    const g = {
      name: 'useBoth', outputs: [{ key: 'v' }, { key: 'm' }],
      nodes: [
        n('s', 'flow.start'), n('e', 'flow.exit'),
        n('c1', 'data.const', { value: 21 }), n('f', 'flow.callFunction', { graph: 'double' }),
        n('c2', 'data.const', { value: 7 }), n('c3', 'data.const', { value: 9 }), n('mx', 'macro.ref', { macro: 'max2' }),
        n('o1', 'data.output', { key: 'v' }), n('o2', 'data.output', { key: 'm' }),
      ],
      links: [
        l('s', 'then', 'f', 'exec'), l('f', 'then', 'e', 'exec'),
        l('c1', 'value', 'f', 'x'), l('f', 'result', 'o1', 'value'),
        l('c2', 'value', 'mx', 'a'), l('c3', 'value', 'mx', 'b'), l('mx', 'max', 'o2', 'value'),
      ],
    };
    const { st, out } = runToEnd(compileGraph(g, resolve), mkCtx());
    ok('自定义函数（CallFunction 子图）', st === 'success' && out?.v === 42);
    ok('自定义宏（编译期内联）', out?.m === 9);
  }
  // 5. 知识三层 + Belief
  {
    const kb = createKnowledge({ bits: WS_BITS });
    kb.ws.set('at_war', true);
    MemClock.time = 10;
    kb.mem.add('attacked', {}); kb.mem.add('attacked', {});
    kb.bb.set('gold', 36);
    ok('WorldState 纯位读写/satisfies', kb.ws.get('at_war') && kb.ws.satisfies([{ bit: 'at_war' }, { bit: 'has_3cities', val: false }]));
    ok('Mem TTL 计数', kb.mem.count('attacked', 20) === 2);
    const beliefs = bakeBeliefs(BELIEF_DEFS);
    evaluateBeliefs(beliefs, { bb: kb.bb, mem: kb.mem, ws: kb.ws });
    ok('Belief 曲线映射（threat 被推高）', beliefGet(beliefs, 'threat') > 0.15);
    ok('曲线/归一化与参考项目同公式', Math.abs(applyCurve(0.5, 'logistic', -1, 1, 0, 1) - 0.5) < 0.01 && applyNorm(-100, 'range', 50, -100) === 1);
    ok('类型码双兼容（数字码烘焙）', Math.abs(applyCurve(0.5, 2, -1, 1, 0, 1) - applyCurve(0.5, 'logistic', -1, 1, 0, 1)) < 1e-9);
  }
  // 6. Utility
  {
    const set = bakeUtilitySet(UTILITY_SETS.diplomacy);
    const beliefs = bakeBeliefs(BELIEF_DEFS);
    const bb = createBlackboard(); bb.set('gold', 100); bb.set('army_count', 5);
    const ws = createWorldState(createBitRegistry(WS_BITS));
    evaluateBeliefs(beliefs, { bb, mem: createMem(), ws });
    const ctx = { bb, mem: createMem(), ws, time: 0, beliefs: { get: (k) => beliefGet(beliefs, k) }, self: { team: 'qin' }, dist: (s, t) => t.dist };
    const far = { id: 'qi', name: '齐', rel: 10, power: 55, dist: 17 };
    const near = { id: 'chu', name: '楚', rel: -40, power: 18, dist: 6 };
    evaluateUtility(set, ctx, [far, near]);
    const snap = snapshotUtility(set, ctx, [far, near]);
    const ally = snap[0].decisions.find((d) => d.name === '提议结盟');
    const war = snap[0].decisions.find((d) => d.name === '宣战');
    ok('远交（结盟选远而强）', ally.perTarget[0]?.target === '齐');
    ok('近攻（宣战选近而弱）', war.perTarget[0]?.target === '楚');
    ok('补偿因子（单项短板不归零）', war.perTarget[0].score > 0);
    const store = {};
    evaluateUtility(set, ctx, [far, near], store);
    ok('动量状态按调用方隔离', !!Object.values(store.current)[0] && !!utilityBest(set, '外交决策')?.command?.name);
  }
  // 7. 模板库 / 总线 / BT / FSM
  {
    const game = createGame(20260726);
    const lib = game.library;
    ok('模板库（内置+4X+指令索引）', !!lib.templates['cond.always'] && !!lib.templates['cmd.besiege'] && !!lib.byCommand['goto_site']);
    game.step();
    const qin = game.brains[0];
    const bus = createCommandBus(lib);
    bus.issue('train_worker', {}, qin.makeCtx());
    ok('指令总线（同步完成 + 状态归一化 done）', bus.status() === 'done');
    const warrior = (() => { const u = game.world.units; for (let i = 0; i < u.alive.length; i++) if (u.alive[i] && u.faction[i] === 0 && u.type[i] === 'warrior') return i; return -1; })();
    const bt = createBtInstance({
      type: 'selector',
      children: [{ type: 'condition', template: 'cond.hp_low' }, { type: 'action', template: 'act.log', params: { msg: 'bt-ok' } }],
    }, lib.templates);
    ok('BT 叶子=模板图（cond 同步 / act 执行）', tickBt(bt, qin.makeCtx(warrior), 1) === 'success' && game.world.events.some((e) => e.msg === 'bt-ok'));
    const fsm = createFsmInstance({
      initial: 'a', states: { a: { action: 'act.log' }, b: {} },
      transitions: [{ from: 'a', to: 'b', condition: 'cond.always' }],
    }, lib.templates);
    tickFsm(fsm, qin.makeCtx(), 1);
    ok('FSM 复用同一 cond 模板转移', fsm.state === 'b');
    const hfsm = createFsmInstance({
      initial: 'Root',
      states: { Root: { initial: 'Calm', states: { Calm: {}, Alert: { action: 'act.log' } } } },
      transitions: [{ from: 'Root', to: 'Alert', condition: 'cond.always' }],
    }, lib.templates);
    ok('HFSM 复合态沿 initial 下沉初始叶', hfsm.state === 'Root.Calm');
    tickFsm(hfsm, qin.makeCtx(), 1);
    ok('HFSM 转移冒泡（父级出边被子态继承命中）', hfsm.state === 'Root.Alert');
    // 旧数组方言（FsmEditor 早期资产）→ HFSM：载入转换 + conditions[] AND 求值
    const legacy = legacyToHfsm({
      states: [{ id: 's1', name: '平静', is_initial: true }, { id: 's2', name: '警觉' }],
      transitions: [{ id: 't1', from: 's1', to: 's2', condition_ids: ['c1', 'c2'] }],
    }, (id) => ({ c1: 'cond.always', c2: 'cond.always' }[id]));
    const fsm2 = createFsmInstance(legacy, lib.templates);
    tickFsm(fsm2, qin.makeCtx(), 1);
    ok('旧数组方言转换 + conditions[]（AND）求值', fsm2.state === '警觉');
    const bt2 = createBtInstance({ type: 'condition', template: 'cond.under_attack' }, lib.templates);
    ok('cond.under_attack 和平期为 false', tickBt(bt2, qin.makeCtx(warrior), 1) === 'failure');
  }
  // 8. GOAP / HTN / 外交
  {
    const game = createGame(20260726);
    game.step();
    const ws = game.brains[0].knowledge.ws;
    const plan = goapPlan({ actions: GOAP_ACTIONS.filter((a) => ['goto_site', 'found_city'].includes(a.name)), ws, goal: [{ bit: 'has_2cities' }], maxDepth: 8 });
    ok('GOAP 规划（位状态 A*，深度≤8）', plan?.length === 2 && plan[0].name === 'goto_site');
    ok('GOAP 不可达返回 null / 已达成返回 []', goapPlan({ actions: GOAP_ACTIONS.filter((a) => a.name === 'heal'), ws, goal: [{ bit: 'north_conquered' }] }) === null && goapPlan({ actions: GOAP_ACTIONS, ws, goal: [{ bit: 'has_city' }] })?.length === 0);
    const dec = htnPlanGoal(HTN_GRAND, ws, {});
    ok('HTN 分解（goal 选择 + 原语指令队列 + MTR）', dec?.goal?.id === 'conquer_north' && dec.commands[0]?.name === 'train_settler' && dec.mtr.length > 0);
    const htnSig = dec?.commands.map((c) => c.name) || [];
    ok('HTN 前效后效位模拟（效果预测打通后续前件→偷袭/宣战/攻城）', htnSig.includes('sabotage') && htnSig.includes('declare_war') && htnSig.includes('besiege'));
    const dip = createDiplomacy(['qin', 'chu', 'qi']);
    treatyEvent(dip, 'qin', 'chu', 'declare_war');
    treatyEvent(dip, 'qin', 'qi', 'accept_alliance');
    ok('外交条约机（war/alliance + 关系联动）', dip.get('qin', 'qi') > 10 && dip.get('qin', 'chu') < -20 && dip.treatyOf('qin', 'chu') === 'war' && treatyEvent(dip, 'qin', 'chu', 'declare_war') === false);
  }
  // 9. 4X 300 回合冒烟
  {
    const game = createGame(20260726);
    game.run(300);
    const ev = game.world.events;
    const count = (type, kw) => ev.filter((e) => e.type === type && (!kw || e.msg.includes(kw))).length;
    const c = {
      found: count('city', '建立城市'), train: count('econ', '训练出'), build: count('econ', '建成'),
      diplo: count('diplo'), covert: count('covert'), war: count('war'), plan: count('plan'), mission: count('mission'),
    };
    logs.push(`4X 冒烟：${JSON.stringify(c)} 城市=${game.world.cities.alive.reduce((a, b) => a + b, 0)} 单位=${game.world.units.alive.reduce((a, b) => a + b, 0)}`);
    for (const b of game.brains) logs.push(`${b.name}: 战略=${b.strategyChoice?.name || '-'} 中观=${b.midChoice?.name || '-'} 外交=${b.diploChoice?.name || '-'} 小队=${b.squads.map((s) => s.label).join('/') || '-'}`);
    ok('经济发展（建城/训练/建筑）', c.found >= 2 && c.train >= 3 && c.build >= 1);
    ok('外交远交近攻（宣战/结盟/送礼）', c.diplo >= 1);
    ok('小队任务（偷袭/攻城编组）', c.mission >= 1);
    ok('军事行动（破坏/攻城/战斗）', c.covert + c.war >= 1);
    ok('五层运转（战略分解日志）', c.plan >= 3);
    ok('主观信念值域 [0,1]', game.brains[0].beliefs.out.every((v) => v >= 0 && v <= 1));
  }

  return { passed, failed, failures, logs };
}
