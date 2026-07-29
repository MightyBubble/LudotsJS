// tick 级自检套件 —— 引擎是纯函数+确定性 tick，用固定 dt 步进断言状态。
// 每个用例独立 createLabState，不触碰实验室场景状态。
import { createLabState as createEngineState, tick, pressInput, releaseInput, issueMove, issueAttackMove, issuePatrol, stopUnit, getUnit, getControlled, switchControl, smartOrder, commitPending, cancelPending, getAutoTarget, orderAbility } from './engine';
import { effectiveTags, grantTimedTag } from './tags';
import { normalizeStanceMachine } from './stances';
import { STANCE_MACHINE_PRESET, PALADIN_EXAMPLE } from './stancePresets.js';
import { CONTEXT_ROUTES } from './contextRouting';
import { buildStanceBehaviorGraph } from './stanceBehavior';
import { planStanceBehaviorDefs } from './stanceBehaviorDefs.js';
import { STANCE_CONDITION_DEFS } from './stanceConditionDefs.js';
import { ABILITY_DEFS, MEMORY_TTL } from './abilityDefs';
import { CURVE_NODES } from './targetSelector';
import { applyCurve } from '../ai/core/scoring.js';
import { buildAbilityTemplates, labGraphCtx } from './abilityTemplates';
import { createTemplateLibrary, createCommandBus, BUILTIN_TEMPLATES } from '../ai/templates/library.js';
import { compileGraph } from '../ai/graph/graphvm.js';
import { evaluateUtility, utilityBest } from '../ai/utility/utility.js';
import { createChainDemo, CHAIN_MAKER } from './chainDemo.js';

// 引擎无任何兜底（姿态机/行为图/条件图/路由表全部须显式注入）：测试夹具用与生产 seed
// 同一来源的预设 + 规划器构造模板库，注入方式与实验室载入完全一致。
const buildTestLib = (machine, extra = []) => createTemplateLibrary([
  ...extra,
  ...planStanceBehaviorDefs(machine, new Set(extra.map((x) => x.name))).map((d, i) => ({ id: `tb${i}`, name: d.name, data: d.data })),
  ...STANCE_CONDITION_DEFS.map((d, i) => ({ id: `tc${i}`, name: d.name, data: d.data })),
], []);
const setMachine = (s, machine, extra = []) => {
  s.stanceMachine = machine;
  s.tplLib = buildTestLib(machine, extra);
};
const createLabState = () => {
  const s = createEngineState();
  setMachine(s, STANCE_MACHINE_PRESET);
  s.routes = { 'Input.Smart': CONTEXT_ROUTES['Input.Smart'] };
  return s;
};

const CFG = { bufferWindow: 0.5, bufferSize: 3 };
const step = (s, seconds, dt = 0.05) => { for (let t = 0; t < seconds - 1e-9; t += dt) tick(s, dt, CFG); };
// 预热一帧：感知/意图黑板由 tick 建立，下达指令前世界必须先运转（与真实运行一致）
const prime = (s) => step(s, 0.05);

export function runSelfTests() {
  const results = [];
  const test = (name, fn) => {
    try { fn(); results.push({ name, pass: true }); }
    catch (e) { results.push({ name, pass: false, error: e.message }); }
  };
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  test('近战：自动取目标 → 时间线命中', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 1.0);
    assert(getUnit(s, 'E1').health === 70, `E1 血量应为 70，实际 ${getUnit(s, 'E1').health}`);
  });

  test('门禁：施法中再按 → 进缓冲', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 0.1);
    pressInput(s, 'Input.Skill1', CFG);
    assert(getUnit(s, 'P1').buffer.length === 1, '缓冲应有 1 条');
  });

  test('缓冲：窗口过期即丢弃（冷却未解锁）', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 0.1);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 1.0);
    assert(getUnit(s, 'P1').buffer.length === 0, '缓冲应已过期清空');
    assert(getUnit(s, 'E1').health === 70, '只应命中一次');
  });

  test('感知：出视野入记忆，TTL 后作废', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -3;
    step(s, 0.1);
    const p = getUnit(s, 'P1');
    assert(p.blackboard.perceived.some((x) => x.id === 'E1'), '应感知到 E1');
    e.x = 20;
    step(s, 0.1);
    assert(!p.blackboard.perceived.some((x) => x.id === 'E1'), '应已脱离感知');
    assert(p.blackboard.memory.E1, '应保留记忆快照');
    step(s, MEMORY_TTL + 0.3);
    assert(!p.blackboard.memory.E1, '记忆应已过期');
  });

  test('repeat：按住循环，松开打完本轮结束', () => {
    const s = createLabState();
    pressInput(s, 'Input.Skill5', CFG);
    step(s, 0.9);
    const a = getUnit(s, 'P1').ability;
    assert(a && a.id === 'repeatfire', '按住期间应持续引导');
    assert(a.elapsed < 0.36, '应已续轮（elapsed 归零过）');
    releaseInput(s, 'Input.Skill5');
    step(s, 0.5);
    assert(!getUnit(s, 'P1').ability, '松开后应结束');
  });

  test('beam steer：光束沿瞄准方向逐 tick 伤害', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -2;
    s.controller.aim = { x: -2, z: -2 };
    pressInput(s, 'Input.Skill6', CFG);
    step(s, 1.7);
    assert(getUnit(s, 'E1').health < 100, `E1 应被激光命中，实际 ${getUnit(s, 'E1').health}`);
    releaseInput(s, 'Input.Skill6');
    step(s, 0.1);
    assert(!getUnit(s, 'P1').ability, '松开应立断');
  });

  test('死亡：引擎统一清理 + 打 State.Dead', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -3.5;
    e.health = 5;
    prime(s);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 1.0);
    assert(effectiveTags(e, s.time).includes('State.Dead'), '应带 State.Dead');
    assert(!e.alive && e.queue.length === 0, '应清空队列且 alive=false');
    assert(!getUnit(s, 'P1').blackboard.perceived.some((x) => x.id === 'E1'), '死者不应再被感知');
  });

  test('队列：shift 排队 + stop 清空', () => {
    const s = createLabState();
    issueMove(s, 0, 0, false);
    issueMove(s, 2, 2, true);
    assert(getUnit(s, 'P1').queue.length === 2, '队列应有 2 条');
    stopUnit(s);
    assert(getUnit(s, 'P1').queue.length === 0, 'stop 应清空队列');
  });

  test('combo：窗口内再按续下一段', () => {
    const s = createLabState();
    pressInput(s, 'Input.Skill4', CFG);
    step(s, 0.35);
    pressInput(s, 'Input.Skill4', CFG);
    step(s, 0.3);
    const a = getUnit(s, 'P1').ability;
    assert(a && a.stage >= 1, `应已进入二段，实际 stage=${a ? a.stage : 'null'}`);
  });

  test('确认层：抬起施法（onRelease）', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    s.prefs.melee.castMode = 'onRelease';
    pressInput(s, 'Input.Skill1', CFG);
    assert(s.controller.pending?.id === 'melee', '按下应进入待确认态');
    assert(!getUnit(s, 'P1').ability && getUnit(s, 'P1').queue.length === 0, '未确认不应下达');
    releaseInput(s, 'Input.Skill1');
    assert(!s.controller.pending, '抬起应 commit');
    step(s, 1.0);
    assert(getUnit(s, 'E1').health === 70, `应命中，实际 ${getUnit(s, 'E1').health}`);
  });

  test('确认层：点击确认（confirm）+ 取消', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    s.prefs.melee.castMode = 'confirm';
    pressInput(s, 'Input.Skill1', CFG);
    releaseInput(s, 'Input.Skill1');
    assert(s.controller.pending?.id === 'melee', '抬起不应 commit（等待点击）');
    cancelPending(s, 'test');
    assert(!s.controller.pending, '应可取消');
    pressInput(s, 'Input.Skill1', CFG);
    commitPending(s, { targetId: 'E1' });
    step(s, 1.0);
    assert(getUnit(s, 'E1').health === 70, `点击确认后应命中，实际 ${getUnit(s, 'E1').health}`);
  });

  test('上下文路由：右键敌=攻击，地面=移动', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    smartOrder(s, { targetId: 'E1' });
    assert(getUnit(s, 'P1').queue[0]?.type === 'attack', '敌方应路由为攻击');
    smartOrder(s, { x: 0, z: 0 });
    assert(getUnit(s, 'P1').queue[0]?.type === 'move', '地面应路由为移动');
  });

  test('打断策略：移动打断施法 → 移动完自动续跑', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    s.prefs.melee.onInterrupt = 'resume';
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 0.1); // 施法中（命中帧 0.28 尚未触发）
    const p = getUnit(s, 'P1');
    issueMove(s, p.x + 1, p.z, false);
    assert(!p.ability, '移动应打断当前施法');
    assert(p.queue.length === 2 && p.queue[1].type === 'ability' && p.queue[1].resume, '队列应为 [移动, 续跑施法]');
    step(s, 2.0);
    assert(getUnit(s, 'E1').health === 70, `续跑后应命中一次，实际 ${getUnit(s, 'E1').health}`);
  });

  test('上下文路由：治疗者右键残血友军=治疗', () => {
    const s = createLabState();
    const p1 = getUnit(s, 'P1');
    p1.health = 40;
    switchControl(s, 'P2');
    prime(s);
    smartOrder(s, { targetId: 'P1' });
    const head = getUnit(s, 'P2').queue[0];
    assert(head?.type === 'ability' && head.id === 'heal', `应路由为治疗，实际 ${head?.type}/${head?.id}`);
    step(s, 1.5);
    assert(p1.health === 65, `P1 应被治疗到 65，实际 ${p1.health}`);
  });

  test('utility：曲线权重改变自动取目标', () => {
    const s = createLabState();
    const e1 = getUnit(s, 'E1'); e1.x = -3.5; e1.z = -2;              // 近但满血（距 1.5）
    const e2 = getUnit(s, 'E2'); e2.x = -2; e2.z = -2; e2.health = 20; // 远但残血（距 3）
    prime(s);
    const p = getUnit(s, 'P1');
    assert(getAutoTarget(s, p, s.prefs.melee)?.id === 'E1', '默认距离曲线应选最近的 E1');
    s.prefs.melee.selector = { considerations: [
      { input: 'distance', curve: { type: 'inverse' }, weight: 0.2 },
      { input: 'hp', curve: { type: 'inverse' }, weight: 0.8 },
    ] };
    assert(getAutoTarget(s, p, s.prefs.melee)?.id === 'E2', '血量权重加大后应选残血的 E2');
  });

  test('硬过滤：满血友军被治疗 selector 出局', () => {
    const s = createLabState();
    switchControl(s, 'P2');
    prime(s);
    const p2 = getUnit(s, 'P2');
    assert(!getAutoTarget(s, p2, s.prefs.heal), 'P1 满血应被 hpBelow 门过滤出局');
    getUnit(s, 'P1').health = 40;
    step(s, 0.1);
    assert(getAutoTarget(s, p2, s.prefs.heal)?.id === 'P1', '受伤后应重新纳入并胜出');
  });

  test('受迫打断：眩晕标签强制打断引导 + 冻结执行槽', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = 20; getUnit(s, 'E2').x = 20;
    prime(s);
    pressInput(s, 'Input.Skill3', CFG); // 引导风暴（interrupt 缺省 = drop）
    step(s, 0.2);
    const p = getUnit(s, 'P1');
    assert(p.ability, '应在引导中');
    grantTimedTag(p, 'State.Stunned', s.time + 1);
    step(s, 0.2);
    assert(!p.ability, '眩晕应强制打断引导（丢弃）');
    const x0 = p.x;
    issueMove(s, p.x + 3, p.z, false);
    step(s, 0.3);
    assert(Math.abs(p.x - x0) < 0.01, '眩晕期间不应移动');
    step(s, 1.0);
    assert(p.x > x0 + 0.5, '眩晕结束应恢复执行队列');
  });

  test('受迫打断：resume 策略 —— 眩晕过后自动续跑', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -3.5; e.stance = 'HoldFire';
    prime(s);
    pressInput(s, 'Input.Skill1', CFG); // 近战 interrupt: resume
    step(s, 0.1);
    const p = getUnit(s, 'P1');
    grantTimedTag(p, 'State.Stunned', s.time + 0.5);
    step(s, 0.1);
    assert(!p.ability && p.queue[0]?.resume, '应挂起为续跑指令（进度快照入队首）');
    step(s, 2.0);
    assert(e.health === 70, `眩晕结束应续跑命中，实际 ${e.health}`);
  });

  test('眩晕镖：applyTag 效果 → 目标硬控 + 还击姿态反打', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -3;
    prime(s);
    pressInput(s, 'Input.Skill7', CFG);
    step(s, 0.5);
    assert(effectiveTags(e, s.time).includes('State.Stunned'), 'E1 应带 State.Stunned');
    step(s, 2.5);
    assert(getUnit(s, 'P1').health < 100, '眩晕结束后 E1（还击姿态）应反击');
  });

  test('姿态：HoldFire 不还手 / ReturnFire 还击', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -3.5; e.stance = 'HoldFire';
    prime(s);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 2.0);
    assert(getUnit(s, 'P1').health === 100, 'HoldFire 不应还手');
    e.stance = 'ReturnFire';
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 2.0);
    assert(getUnit(s, 'P1').health < 100, 'ReturnFire 应还击');
  });

  test('姿态 FSM：事件转移（damaged → 换状态 → 主动接战）', () => {
    const s = createLabState();
    setMachine(s, {
      initial: 'Passive',
      states: {
        Passive: { label: '静默', autocast: [], transitions: [{ on: 'damaged', to: 'Enraged' }] },
        Enraged: { label: '激怒', autocast: [{ ability: 'atk', trigger: 'seen' }], transitions: [] },
      },
    });
    const e = getUnit(s, 'E1');
    e.x = -3.5; e.stance = 'Passive';
    prime(s);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 1.0);
    assert(e.stance === 'Enraged', `受击应转移到 Enraged，实际 ${e.stance}`);
    step(s, 1.0);
    assert(getUnit(s, 'P1').health < 100, 'Enraged 应主动接战');
  });

  test('姿态：原地防守（chase=false）射程外不接战、不追击', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -1; e.z = -2; e.stance = 'HoldPosition'; // 距 P1 4：索敌范围内、射程外
    getUnit(s, 'E2').x = 20;
    prime(s);
    const x0 = e.x;
    step(s, 1.5);
    assert(Math.abs(e.x - x0) < 0.01 && getUnit(s, 'P1').health === 100, '射程外不应接战/追击');
    e.stance = 'AttackAnything';
    step(s, 3.0);
    assert(getUnit(s, 'P1').health < 100, '主动接战应追击并攻击');
  });

  test('姿态：警戒（缰绳）追击有限，脱战自动归位', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -1; e.z = -2; e.stance = 'Guard'; // 距 P1 4：索敌内、射程外 → 接战追击
    getUnit(s, 'E2').x = 20;
    const p = getUnit(s, 'P1');
    p.queue = [{ type: 'move', x: -11, z: -2 }]; // P1 同速逃跑（追不上 → 必然超缰绳）
    prime(s);
    step(s, 4.0);
    assert(p.health === 100, '同速逃跑不应被追上击中');
    step(s, 3.0);
    assert(Math.hypot(e.x + 1, e.z + 2) < 0.5, `超出缰绳应归位锚点，实际 (${e.x.toFixed(1)}, ${e.z.toFixed(1)})`);
  });

  test('巡逻：路线点间循环往返（持续指令）', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = 20; getUnit(s, 'E2').x = 20;
    prime(s);
    issuePatrol(s, 0, -2); // P1 (-5,-2) ↔ (0,-2)
    const p = getUnit(s, 'P1');
    let reachedB = false, backA = false;
    for (let i = 0; i < 120; i++) {
      step(s, 0.05);
      if (!reachedB && Math.hypot(p.x, p.z + 2) < 0.35) reachedB = true;
      else if (reachedB && Math.hypot(p.x + 5, p.z + 2) < 0.35) backA = true;
    }
    assert(reachedB && backA, `应往返巡逻（到B=${reachedB} 回A=${backA}）`);
    assert(p.queue[0]?.type === 'patrol', '巡逻应为持续指令（不自行完成）');
  });

  test('巡逻接战性格由姿态声明：HoldFire 只走路，AttackAnything 接战', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -2.5; e.z = -2; e.stance = 'HoldFire'; // 正处于巡逻路线上
    getUnit(s, 'E2').x = 20;
    prime(s);
    issuePatrol(s, 0, -2); // P1 (-5,-2) ↔ (0,-2)，穿过 E1 身边
    step(s, 3.0);
    assert(e.health === 100, 'HoldFire 巡逻不应接战');
    getUnit(s, 'P1').stance = 'AttackAnything';
    step(s, 4.0);
    assert(e.health < 100, 'AttackAnything 巡逻应沿途接战');
  });

  test('巡逻中插入 interleave 技能：插队首，巡逻保留续跑', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = 20; getUnit(s, 'E2').x = 20;
    prime(s);
    issuePatrol(s, 0, -2);
    step(s, 0.5);
    pressInput(s, 'Input.Skill3', CFG); // 引导风暴 queueMode=interleave
    step(s, 0.1);
    const p = getUnit(s, 'P1');
    assert(p.ability?.id === 'channel', '应立即引导（插入队首）');
    assert(p.queue[0]?.type === 'patrol', '巡逻应保留在队列');
    const x0 = p.x;
    step(s, 3.0);
    assert(!p.ability && p.queue[0]?.type === 'patrol', '引导结束巡逻仍在');
    assert(Math.abs(p.x - x0) > 0.5, '巡逻应恢复行进');
  });

  test('计划模式插队：interleave 技能进队首，普通指令排队尾', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = 20; getUnit(s, 'E2').x = 20;
    prime(s);
    pressInput(s, 'Input.Plan', CFG);
    issueMove(s, -2, -2, false);
    issueMove(s, 0, -2, false);
    pressInput(s, 'Input.Skill3', CFG); // interleave → 插队首
    const p = getUnit(s, 'P1');
    assert(p.queue.length === 3, `计划应 3 条入队，实际 ${p.queue.length}`);
    assert(p.queue[0]?.type === 'ability' && p.queue[0]?.id === 'channel', '计划中 interleave 技能应插队首');
    assert(!p.ability, '计划模式不应执行');
    releaseInput(s, 'Input.Plan');
    step(s, 0.2);
    assert(p.ability?.id === 'channel', '松开后应先执行插队的技能');
  });

  test('计划模式：按住 Z 指令只入队冻结，松开按序执行', () => {
    const s = createLabState();
    prime(s);
    pressInput(s, 'Input.Plan', CFG);
    issueMove(s, -2, -2, false);
    issueMove(s, -2, 0, false);
    const p = getUnit(s, 'P1');
    assert(p.queue.length === 2, `计划中指令应全部入队，实际 ${p.queue.length}`);
    const x0 = p.x;
    step(s, 0.5);
    assert(Math.abs(p.x - x0) < 0.01, '计划模式下不应执行');
    releaseInput(s, 'Input.Plan');
    step(s, 3.0);
    assert(Math.hypot(p.x + 2, p.z) < 0.35, `松开后应按计划走完，实际 (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  });

  test('A-move：途中自动接战，清场后到达目的地', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = 0; e.z = 0; e.health = 20; e.stance = 'HoldFire';
    getUnit(s, 'E2').x = 20;
    prime(s);
    issueAttackMove(s, 6, 0, false);
    step(s, 4.0);
    assert(effectiveTags(e, s.time).includes('State.Dead'), 'A-move 应接战击杀 E1');
    step(s, 3.0);
    const p = getUnit(s, 'P1');
    assert(Math.hypot(p.x - 6, p.z) < 0.4, `清场后应到达目的地，实际 (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  });

  test('圣骑士姿态（内容层配置注入）：先治疗残血队友，奶满后远程接战', () => {
    const s = createLabState();
    // 职业不是引擎预设：作为游戏内容注入姿态机（与编辑器存库后实验室载入同一路径）
    setMachine(s, { initial: STANCE_MACHINE_PRESET.initial, states: { ...STANCE_MACHINE_PRESET.states, Paladin: PALADIN_EXAMPLE } });
    const p1 = getUnit(s, 'P1'); p1.health = 60;
    const p2 = getUnit(s, 'P2'); p2.stance = 'Paladin';
    const e = getUnit(s, 'E1'); e.x = -3; e.z = 2; e.stance = 'HoldFire';
    getUnit(s, 'E2').x = 20;
    prime(s);
    step(s, 2.0);
    assert(p1.health === 85, `应优先治疗队友（85），实际 ${p1.health}`);
    assert(e.health === 100, '有治疗需求时不应接战');
    step(s, 6.0);
    assert(p1.health >= 100, `队友应被奶满，实际 ${p1.health}`);
    assert(e.health < 100, '满血后治疗意图过期，应轮到远程候选接战');
  });

  test('分轨并行：移动中施放远程（异轨），移动不被打断', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = 0; e.z = -2; e.stance = 'HoldFire';
    getUnit(s, 'E2').x = 20;
    prime(s);
    issueMove(s, -5, 4, false);
    step(s, 0.2);
    pressInput(s, 'Input.Skill2', CFG); // 远程 tracks:['arms']
    step(s, 0.1);
    const p = getUnit(s, 'P1');
    assert(p.ability?.id === 'ranged', '应在移动中施放远程');
    assert(p.queue[0]?.type === 'move', '移动计划应保留（不被替换/打断）');
    const z0 = p.z;
    step(s, 0.3);
    assert(p.z > z0 + 0.3, '施法期间应继续移动（legs 未被占用）');
    step(s, 1.5);
    assert(e.health < 100, `远程应命中，实际 ${e.health}`);
  });

  test('分轨并行：侵略姿态行军途中路过敌人，边走边打不停步', () => {
    const s = createLabState();
    const e = getUnit(s, 'E1');
    e.x = -1.5; e.z = -1.2; e.health = 20; e.stance = 'HoldFire'; // 一击即倒：验证击杀后行军不间断
    getUnit(s, 'E2').x = 20;
    const p = getUnit(s, 'P1');
    p.stance = 'AttackAnything';
    prime(s);
    issueMove(s, 3, -2, false);
    step(s, 2.5);
    assert(effectiveTags(e, s.time).includes('State.Dead'), `途经敌人应边走边打击杀（并行 autocast），实际血量 ${e.health}`);
    assert(Math.hypot(p.x - 3, p.z + 2) < 0.4, `全程 2s 行军不应停步，应到达目的地，实际 (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
  });

  test('统一管线：selector 曲线词汇与 scoring 原语逐项数值等价', () => {
    const near = (a, b) => Math.abs(a - b) < 1e-9;
    for (const x of [0, 0.13, 0.42, 0.77, 1]) {
      assert(near(CURVE_NODES.linear(x), applyCurve(x, 'linear', 1, 1, 0, 0)), `linear@${x}`);
      assert(near(CURVE_NODES.inverse(x), applyCurve(x, 'inverse')), `inverse@${x}`);
      assert(near(CURVE_NODES.poly(x, { exp: 3 }), applyCurve(x, 'exponential', 1, 3, 0, 1)), `poly@${x}`);
      assert(near(CURVE_NODES.invpoly(x, { exp: 3 }), applyCurve(x, 'invpoly', 1, 3, 0, 1)), `invpoly@${x}`);
      assert(near(CURVE_NODES.logistic(x, { k: 12, mid: 0.4 }), applyCurve(x, 'logistic', -1.2, 1, -0.1, 1)), `logistic@${x}`);
      assert(near(CURVE_NODES.step(x, { at: 0.5 }), applyCurve(x, 'step', 1, 1, 0.5, 1)), `step@${x}`);
    }
  });

  test('selector 资产引用：{ref} 经资产表解析后与内联行为等价', () => {
    const s = createLabState();
    s.selectorAssets = { 残血友军优先: { filters: [{ type: 'hpBelow', ratio: 1 }], considerations: [{ input: 'hp', curve: { type: 'inverse' }, weight: 1 }] } };
    switchControl(s, 'P2');
    prime(s);
    const p2 = getUnit(s, 'P2');
    const profRef = { ...s.prefs.heal, selector: { ref: '残血友军优先' } };
    assert(!getAutoTarget(s, p2, profRef), '满血友军应被资产硬门过滤出局');
    getUnit(s, 'P1').health = 40;
    step(s, 0.1);
    assert(getAutoTarget(s, p2, profRef)?.id === 'P1', '资产解析后应选中残血 P1');
    assert(getAutoTarget(s, p2, s.prefs.heal)?.id === 'P1', '内联 selector 行为不变');
  });

  test('知识层桥接：传感器镜像 → WS 位 + Mem 记录 + Belief 主观派生', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    const k = getUnit(s, 'P1').knowledge;
    assert(k.bb.get('perceived')?.some((x) => x.id === 'E1'), '知识 BB 应镜像感知快照');
    assert(k.bb.get('perceivedEnemy') === 1, `敌计数应为 1，实际 ${k.bb.get('perceivedEnemy')}`);
    assert(k.ws.get('engaged') === true, 'engaged 位应置位');
    assert(k.mem.count('spotted') >= 2, `应有 spotted 记录，实际 ${k.mem.count('spotted')}`);
    // 受击 → mem 'attacked' 记录 + threat 主观上升 + confidence 链式派生
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 1.2);
    const ek = getUnit(s, 'E1').knowledge;
    assert(ek.mem.count('attacked', 4, s.time) >= 1, 'E1 应有 attacked 记录');
    const ti = ek.beliefs.byKey.threat, ci = ek.beliefs.byKey.confidence;
    assert(ek.beliefs.out[ti] > 0.05, `E1 threat 应上升，实际 ${ek.beliefs.out[ti]}`);
    assert(Math.abs(ek.beliefs.out[ci] - (1 - ek.beliefs.out[ti])) < 1e-6, 'confidence 应由 threat 链式派生（=1−threat）');
  });

  test('姿态候选级 selector：覆盖窄化还击目标（满血不还击 / 残血还击）', () => {
    const s = createLabState();
    setMachine(s, {
      initial: 'ReturnFire',
      states: {
        ReturnFire: { label: '还击', chase: true, autocast: [{ ability: 'atk', trigger: 'damaged', selector: { filters: [{ type: 'hpBelow', ratio: 0.5 }], considerations: [{ input: 'distance', curve: { type: 'inverse' }, weight: 1 }] } }], transitions: [] },
      },
    });
    const e = getUnit(s, 'E1');
    e.x = -3.5; e.stance = 'ReturnFire';
    const p = getUnit(s, 'P1');
    prime(s);
    pressInput(s, 'Input.Skill1', CFG); // 满血 P1 先打 E1 一拳
    step(s, 2.0);
    assert(p.health === 100, `满血 P1 不应被还击（候选 selector 硬门），实际 ${p.health}`);
    p.health = 40;
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 2.5);
    assert(p.health < 40, `残血 P1 应被还击命中，实际 ${p.health}`);
  });

  test('姿态机扩展方言：utility 块 + 机级事件转移经适配器规整执行', () => {
    const s = createLabState();
    setMachine(s, {
      initial: 'Passive',
      states: {
        Passive: { label: '静默', utility: { autocast: [] } },
        Enraged: { label: '激怒', utility: { autocast: [{ ability: 'atk', trigger: 'seen' }], chase: true } },
      },
      transitions: [{ from: 'Passive', to: 'Enraged', event: 'damaged' }],
    });
    const e = getUnit(s, 'E1');
    e.x = -3.5; e.stance = 'Passive';
    prime(s);
    pressInput(s, 'Input.Skill1', CFG);
    step(s, 1.0);
    assert(e.stance === 'Enraged', `机级事件转移应生效，实际 ${e.stance}`);
    step(s, 1.5);
    assert(getUnit(s, 'P1').health < 100, 'utility 块的 autocast 应接战');
  });

  test('HFSM：复合态下沉初始叶 + 子状态未命中转移上抛父级 + 性格继承', () => {
    const s = createLabState();
    setMachine(s, {
      initial: 'Calm',
      states: {
        Calm: { label: '平静', autocast: [] },
        Combat: {
          label: '战斗', color: '#ef4444', chase: true, initial: 'Watch',
          states: {
            Watch: { label: '戒备', autocast: [] },
            Rage: { label: '暴怒', autocast: [{ ability: 'atk', trigger: 'seen' }] },
          },
          transitions: [{ on: 'damaged', to: 'Rage' }],
        },
      },
    });
    const e = getUnit(s, 'E1');
    e.x = -3.5; e.stance = 'Combat'; // 直接赋复合态 → 应沿 initial 下沉到 Combat.Watch
    prime(s);
    assert(e.stance === 'Combat.Watch', `复合态应下沉初始叶，实际 ${e.stance}`);
    step(s, 0.5);
    assert(getUnit(s, 'P1').health === 100, 'Watch 无候选不应接战');
    pressInput(s, 'Input.Skill1', CFG); // P1 打 E1 → damaged 事件
    step(s, 1.0);
    assert(e.stance === 'Combat.Rage', `子状态未命中应上抛父级转移，实际 ${e.stance}`);
    step(s, 1.5);
    assert(getUnit(s, 'P1').health < 100, 'Rage 应继承父级 chase 并主动接战');
  });

  test('HFSM：叶状态 behavior 覆盖 = 自定义 GraphVM 图实执行（写 BB/Mem）', () => {
    const s = createLabState();
    const probe = {
      name: 'probe.behavior', kind: 'action',
      inputs: [], outputs: [],
      nodes: [
        { id: 's', type: 'flow.start' },
        { id: 'c', type: 'data.const', props: { value: 'ran' } },
        { id: 'b', type: 'kb.bbSet', props: { key: 'probeRan' } },
        { id: 'm', type: 'kb.memAdd', props: { type: 'probe' } },
        { id: 'e', type: 'flow.exit', props: { status: 'success' } },
      ],
      links: [
        { from: ['s', 'then'], to: ['b', 'exec'] },
        { from: ['c', 'value'], to: ['b', 'value'] },
        { from: ['b', 'then'], to: ['m', 'exec'] },
        { from: ['m', 'then'], to: ['e', 'exec'] },
      ],
    };
    setMachine(s, {
      initial: 'Idle',
      states: { Idle: { label: '静默', autocast: [], behavior: 'probe.behavior' } },
    }, [{ id: 'g1', name: 'probe.behavior', data: probe }]);
    const e = getUnit(s, 'E1');
    e.stance = 'Idle';
    step(s, 0.2);
    assert(e.knowledge.bb.get('probeRan') === 'ran', '覆盖行为图应实执行写 BB');
    assert(e.knowledge.mem.count('probe', 10) >= 1, '覆盖行为图应实执行写 Mem');
    assert(getUnit(s, 'P1').health === 100, '覆盖图整体替换生成图（无接战逻辑不应接战）');
  });

  test('姿态行为图生成：判定链结构 = 配置推导（改配置即改图，无引擎硬编码分支）', () => {
    // Guard（chase+leash）：锚点归位 + engage 携缰绳常量，无射程门
    const g1 = buildStanceBehaviorGraph('Guard', { key: 'Guard', autocast: [{ ability: 'atk', trigger: 'seen' }], chase: true, leash: 4 });
    const types1 = g1.nodes.map((n) => n.type);
    assert(types1.includes('lab.anchorReturn') && types1.includes('lab.gates'), '应有归位与闸门节点');
    assert(types1.includes('lab.candTarget') && types1.includes('lab.engage'), '应有索敌与接战节点');
    assert(g1.nodes.some((n) => n.id === 'leash' && n.props.value === 4), '缰绳应烘焙为图参数');
    assert(!types1.includes('data.compare'), 'chase≠false 不应有射程门');
    compileGraph(g1, () => null);
    // HoldPosition（chase=false）：射程门 = data.compare(<=)
    const g2 = buildStanceBehaviorGraph('HoldPosition', { key: 'HoldPosition', autocast: [{ ability: 'atk', trigger: 'seen' }], chase: false });
    assert(g2.nodes.some((n) => n.type === 'data.compare' && n.props.op === '<='), 'chase=false 应有射程门');
    compileGraph(g2, () => null);
    // Paladin 层级示例：叶状态有效配置（继承复合态性格）生成 3 候选链
    const m = normalizeStanceMachine({ initial: 'HoldFire', states: { ...STANCE_MACHINE_PRESET.states, Paladin: PALADIN_EXAMPLE } });
    const leaf = m.states['Paladin.Field'];
    assert(leaf && leaf.isLeaf && leaf.chase === true && leaf.leash === 6, '叶应继承复合态性格');
    assert((leaf.autocast || []).length === 3, '叶应有 3 候选');
    const g3 = buildStanceBehaviorGraph(leaf.key, leaf);
    assert(g3.nodes.filter((n) => n.type === 'lab.candTarget').length === 3, '3 候选 = 3 索敌节点');
    compileGraph(g3, () => null);
  });

  test('姿态行为图资产化：命名约定 GraphDef（stance.behavior.<叶>）无需声明即覆盖生成图', () => {
    const s = createLabState();
    // 状态不声明 behavior/action —— 仅靠命名约定吃到 GraphDef 资产（= 落库真图的运行语义）
    const probe = {
      name: 'stance.behavior.Guard', kind: 'action',
      inputs: [], outputs: [],
      nodes: [
        { id: 's', type: 'flow.start' },
        { id: 'c', type: 'data.const', props: { value: 'asset' } },
        { id: 'b', type: 'kb.bbSet', props: { key: 'assetRan' } },
        { id: 'e', type: 'flow.exit', props: { status: 'success' } },
      ],
      links: [
        { from: ['s', 'then'], to: ['b', 'exec'] },
        { from: ['c', 'value'], to: ['b', 'value'] },
        { from: ['b', 'then'], to: ['e', 'exec'] },
      ],
    };
    setMachine(s, {
      initial: 'Guard',
      states: { Guard: { label: '警戒', autocast: [{ ability: 'atk', trigger: 'seen' }], chase: true, leash: 4 } },
    }, [{ id: 'ga', name: 'stance.behavior.Guard', data: probe }]);
    const e = getUnit(s, 'E1');
    e.stance = 'Guard';
    step(s, 0.2);
    assert(e.knowledge.bb.get('assetRan') === 'asset', '命名约定图资产应实执行写 BB');
    assert(getUnit(s, 'P1').health === 100, '图资产整体替换生成图（无接战逻辑不应接战）');
  });

  test('姿态行为资产规划 planStanceBehaviorDefs：跳过显式挂图/已有资产/复合态，叶继承生效', () => {
    const machine = {
      initial: 'A',
      states: {
        A: { autocast: [{ ability: 'atk', trigger: 'seen' }], chase: true },
        B: { autocast: [], behavior: 'custom.graph' },
        C: { initial: 'D', chase: false, states: { D: { autocast: [{ ability: 'atk' }] } } },
      },
    };
    const plan = planStanceBehaviorDefs(machine, new Set(['stance.behavior.A']));
    // A 已有同名资产跳过；B 显式挂图跳过；C 复合态跳过；仅叶 C.D（继承 chase=false）需新建
    assert(plan.length === 1 && plan[0].name === 'stance.behavior.C.D', `规划应只含 C.D，实际 ${plan.map((p) => p.name).join(',')}`);
    assert(plan[0].kind === 'action' && plan[0].data.name === 'stance.behavior.C.D', '资产形状应为 action GraphDef');
    assert(plan[0].data.nodes.some((n) => n.type === 'data.compare' && n.props.op === '<='), 'C.D 继承 chase=false 应生成射程门');
    compileGraph(plan[0].data, () => null);
    // 空 existing：五个内置姿态叶全量规划（含无候选的 HoldFire）
    const full = planStanceBehaviorDefs(STANCE_MACHINE_PRESET, new Set());
    assert(full.length === 5, `内置机应规划 5 张叶行为图，实际 ${full.length}`);
    for (const d of full) compileGraph(d.data, () => null);
  });

  test('姿态子状态机：转移条件 = 条件蓝图（GraphVM 求值驱动子状态流转）', () => {
    const s = createLabState();
    setMachine(s, {
      initial: 'Watch',
      states: {
        Watch: {
          label: '警戒', chase: true, initial: 'Idle',
          states: { Idle: { label: '待机' }, Acquire: { label: '索敌' } },
        },
      },
      transitions: [
        { from: 'Watch.Idle', to: 'Watch.Acquire', condition: 'cond.stance.seen' },
        { from: 'Watch.Acquire', to: 'Watch.Idle', condition: 'cond.stance.targetLost' },
      ],
    });
    const e = getUnit(s, 'E1');
    e.stance = 'Watch';
    getUnit(s, 'E2').x = 20;
    const p = getUnit(s, 'P1');
    p.x = 20; // 先脱离视野
    prime(s);
    assert(e.stance === 'Watch.Idle', `复合态应下沉初始叶，实际 ${e.stance}`);
    step(s, 0.3);
    assert(e.stance === 'Watch.Idle', '无目标不应转移');
    p.x = 3; p.z = -2; // 进入 E1 视野
    step(s, 0.3);
    assert(e.stance === 'Watch.Acquire', `视野发现条件蓝图应驱动 Idle→Acquire，实际 ${e.stance}`);
    p.x = 30; // 脱离视野与记忆索敌范围
    step(s, 0.3);
    assert(e.stance === 'Watch.Idle', `目标失效条件蓝图应驱动 Acquire→Idle，实际 ${e.stance}`);
  });

  test('技能指令化：9 个 command 均有内置模板图且可编译', () => {
    const lib = createTemplateLibrary([], [...BUILTIN_TEMPLATES, ...buildAbilityTemplates()]);
    for (const [id, d] of Object.entries(ABILITY_DEFS)) {
      assert(d.command === `ability.${id}`, `${id} command 命名不规范: ${d.command}`);
      const t = lib.byCommand[d.command];
      assert(t, `${id} 缺少指令模板 ${d.command}`);
      assert(t.compiled.nodes.length >= 5, `${d.command} 图节点过少`);
    }
  });

  test('指令总线：ability.melee 异步执行 trace + 知识层写入', () => {
    const s = createLabState();
    prime(s);
    const u = getControlled(s);
    const lib = createTemplateLibrary([], [...BUILTIN_TEMPLATES, ...buildAbilityTemplates()]);
    const bus = createCommandBus(lib);
    bus.traceEnabled = true;
    u.knowledge.ws.set('engaged', true); // 前置位：有敌情
    const done = bus.issue('ability.melee', { origin: 'selftest' }, labGraphCtx(s, u, bus));
    assert(done === false, '含异步节点的图应挂起');
    for (let i = 0; i < 60 && bus.run; i++) bus.tick(labGraphCtx(s, u, bus), 0.05);
    assert(bus.st === 'done', `指令应成功，实际 ${bus.st}`);
    const lt = bus.lastTrace;
    assert(lt && lt.command === 'ability.melee', '应有 lastTrace');
    assert(lt.trace.length >= 6, `trace 应 ≥6 节点，实际 ${lt.trace.length}`);
    assert(lt.trace.some((x) => x.type === 'flow.delay'), 'trace 应含异步延迟节点');
    assert(lt.trace.some((x) => x.type === 'kb.wsGet' || x.type === 'flow.branch'), 'trace 应含前置校验');
    assert(u.knowledge.mem.count('command', 10) >= 1, 'Mem 应有 command 记录');
    assert(u.knowledge.bb.get('lastCommand') === 'ability.melee', 'BB 应写入 lastCommand');
  });

  test('指令总线：WS 前置位不满足 → 指令失败且不写 BB', () => {
    const s = createLabState();
    prime(s);
    const u = getControlled(s);
    const lib = createTemplateLibrary([], buildAbilityTemplates());
    const bus = createCommandBus(lib);
    bus.traceEnabled = true;
    // engaged 缺省 false → branch false → exit failure
    bus.issue('ability.melee', {}, labGraphCtx(s, u, bus));
    for (let i = 0; i < 60 && bus.run; i++) bus.tick(labGraphCtx(s, u, bus), 0.05);
    assert(bus.st === 'failed', `应失败，实际 ${bus.st}`);
    assert(bus.lastTrace?.result === 'failed', 'lastTrace 应记录失败');
    assert(u.knowledge.bb.get('lastCommand') === undefined, 'BB 不应写入 lastCommand');
  });

  test('指令总线：同步图 issue 即完成且捕获 trace（实例归还）', () => {
    const s = createLabState();
    prime(s);
    const u = getControlled(s);
    const lib = createTemplateLibrary([], BUILTIN_TEMPLATES);
    const bus = createCommandBus(lib);
    bus.traceEnabled = true;
    const done = bus.issue('log', { msg: 'hi' }, labGraphCtx(s, u, bus));
    assert(done === true, '同步图应一次完成');
    assert(bus.run === null, '运行实例应已归还池');
    assert(bus.lastTrace?.result === 'done' && bus.lastTrace.trace.length >= 3, '同步 trace 应已捕获');
  });

  test('全链路：Utility 解算 → 指令 → GraphVM trace → 引擎命中', () => {
    const s = createLabState();
    getUnit(s, 'E1').x = -3.5;
    prime(s);
    const u = getControlled(s);
    u.knowledge.ws.set('engaged', true);
    // ① Utility 解算（知识层 ctx：敌情 1 + 自信 1 → 强攻突进胜出）
    const set = createChainDemo();
    const lib = createTemplateLibrary([], [...BUILTIN_TEMPLATES, ...buildAbilityTemplates()]);
    const bus = createCommandBus(lib);
    bus.traceEnabled = true;
    evaluateUtility(set, labGraphCtx(s, u, bus), []);
    const best = utilityBest(set, CHAIN_MAKER);
    assert(best?.command, '应有最优决策与指令');
    assert(best.id === 'melee', `敌情+自信下应为强攻突进，实际 ${best.id}`);
    // ②③ GraphVM 指令执行 + trace
    bus.issue(best.command.name, { origin: 'selftest' }, labGraphCtx(s, u, bus));
    for (let i = 0; i < 60 && bus.run; i++) bus.tick(labGraphCtx(s, u, bus), 0.05);
    assert(bus.st === 'done' && bus.lastTrace?.trace?.length >= 6, '图 trace 应完整');
    // ④ 引擎同语义施放 → 效果命中
    const ability = best.command.name.replace('ability.', '');
    const hpBefore = getUnit(s, 'E1').health;
    orderAbility(s, ability, false, 'utility', null, 'E1');
    step(s, 2.0);
    assert(getUnit(s, 'E1').health < hpBefore, `指令引擎执行应命中 E1（${hpBefore}→${getUnit(s, 'E1').health}）`);
  });

  return results;
}