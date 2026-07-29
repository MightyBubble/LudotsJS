// Utility 新旧路径等价性自检（沙盒 node 直跑，不走浏览器）：
// 对 content.js 三套 UTILITY_SETS，老路径 bakeUtilitySet 与新路径
// （内存模拟 seedassets 转换 → bakeUtilityAssets）在相同 ctx/目标下逐决策比对得分。
// 任何数值差异 > 1e-9 即失败退出 1。
import { bakeUtilitySet, bakeUtilityAssets, evaluateUtility, snapshotUtility } from '/app/src/lib/ai/utility/utility.js';
import { bakeBeliefs, evaluateBeliefs, beliefGet } from '/app/src/lib/ai/core/belief.js';
import { UTILITY_SETS, BELIEF_DEFS, WS_BITS } from '/app/src/lib/ai/world4x/content.js';
import { createBitRegistry, createWorldState, createMem, createBlackboard } from '/app/src/lib/ai/core/knowledge.js';

const CURVE_NAME = { linear: 'Linear', exponential: 'Exponential', logistic: 'Logistic' };

// 与 seedassets.js 相同的转换逻辑（内存版，id 用序号）
function toAssets(setDef) {
  let seq = 0;
  const id = () => 'id' + ++seq;
  const inputBySource = {}, normByKey = {}, taskByCommand = {};
  const inputs = [], norms = [], cons = [], decs = [], tasks = [], filters = [
    { id: 'f_any', name: '任意目标', type: 'AnyFilter' },
    { id: 'f_enemy', name: '敌方', type: 'EnemyFilter' },
    { id: 'f_ally', name: '友方', type: 'AllyFilter' },
  ];
  const filterId = { any: 'f_any', enemy: 'f_enemy', ally: 'f_ally' };
  const makers = (setDef.makers || []).map((m) => {
    const decisionIds = [];
    for (const d of m.decisions || []) {
      const consIds = [];
      for (const c of d.considerations || []) {
        let input = inputBySource[c.source];
        if (!input) { input = { id: id(), name: c.source, source: c.source }; inputBySource[c.source] = input; inputs.push(input); }
        const nk = `${c.norm?.type || 'range'}|${c.norm?.min ?? 0}|${c.norm?.max ?? 100}`;
        let norm = normByKey[nk];
        if (!norm) {
          norm = { id: id(), name: nk, type: c.norm?.type || 'range', min_value: c.norm?.min ?? 0, max_value: c.norm?.max ?? 100 };
          normByKey[nk] = norm; norms.push(norm);
        }
        const con = {
          id: id(), name: c.name || c.source, has_no_target: false,
          input_id: input.id, input_normalization_id: norm.id,
          response_curve: {
            type: CURVE_NAME[c.curve?.type] || 'Logistic',
            slope: c.curve?.slope ?? -1, exponent: c.curve?.exponent ?? 1,
            x_shift: c.curve?.xShift ?? 0, y_shift: c.curve?.yShift ?? 1,
          },
        };
        cons.push(con); consIds.push(con.id);
      }
      const actionIds = [];
      if (d.command?.name) {
        let task = taskByCommand[d.command.name];
        if (!task) { task = { id: id(), name: d.command.name, category: '内置', command: d.command.name }; taskByCommand[d.command.name] = task; tasks.push(task); }
        actionIds.push(task.id);
      }
      const dec = {
        id: id(), name: d.name, weight: d.weight ?? 1, has_no_target: !!d.noTarget,
        enable_cache_per_target: false,
        target_filters: d.noTarget ? [] : [filterId[d.targetFilter || 'any']],
        considerations: consIds,
        actions: { execution_mode: 'Sequence', keep_running_until_finished: false, max_repeat_count: 1, action_list: actionIds },
      };
      decs.push(dec); decisionIds.push(dec.id);
    }
    return { id: m.id || m.name, name: m.name, decisions: decisionIds };
  });
  const agent = {
    id: 'agent1', name: setDef.name,
    compensation_factor: setDef.compensation !== false,
    momentum_bonus: setDef.momentum ?? 1.1,
    makers,
  };
  return { agent, decisions: decs, considerations: cons, inputs, normalizations: norms, filters, actionTasks: tasks };
}

function makeCtx() {
  const beliefs = bakeBeliefs(BELIEF_DEFS);
  const bb = createBlackboard();
  Object.entries({ gold: 80, city_count: 2, army_count: 3, min_relation: -20 }).forEach(([k, v]) => bb.set(k, v));
  const ws = createWorldState(createBitRegistry(WS_BITS));
  ws.set('has_city', true);
  evaluateBeliefs(beliefs, { bb, mem: createMem(), ws });
  return {
    bb, mem: createMem(), ws, time: 0,
    beliefs: { get: (k) => beliefGet(beliefs, k) },
    self: { team: 'qin' }, dist: (s, t) => t?.dist ?? 10,
  };
}

const targets = [
  { id: 'chu', name: '楚', rel: -30, power: 25, dist: 7, team: 'chu' },
  { id: 'qi', name: '齐', rel: 20, power: 45, dist: 15, team: 'qi' },
];

let pass = 0, fail = 0;
const ok = (cond, label) => { if (cond) { pass++; console.log('  ✓', label); } else { fail++; console.log('  ✗', label); } };

for (const [key, setDef] of Object.entries(UTILITY_SETS)) {
  console.log(`集 ${key}:`);
  const oldSet = bakeUtilitySet(setDef);
  const assets = toAssets(setDef);
  const newSet = bakeUtilityAssets(assets);
  const ctx1 = makeCtx(), ctx2 = makeCtx();
  evaluateUtility(oldSet, ctx1, targets, {});
  evaluateUtility(newSet, ctx2, targets, {});
  const snapOld = snapshotUtility(oldSet, ctx1, targets);
  const snapNew = snapshotUtility(newSet, ctx2, targets);
  ok(snapOld.length === snapNew.length, `maker 数一致（${snapOld.length}）`);
  for (let i = 0; i < snapOld.length; i++) {
    const mo = snapOld[i], mn = snapNew[i];
    ok(mo.best === mn.best, `${mo.maker} 最优决策一致（${mo.best} vs ${mn.best}）`);
    for (let j = 0; j < mo.decisions.length; j++) {
      const d1 = mo.decisions[j], d2 = mn.decisions.find((x) => x.name === d1.name);
      if (!d2) { fail++; console.log('  ✗ 决策缺失', d1.name); continue; }
      const ds = Math.abs(d1.score - d2.score), df = Math.abs(d1.final - d2.final);
      ok(ds < 1e-9 && df < 1e-9, `${d1.name} 得分一致 score=${d1.score.toFixed(6)} final=${d1.final.toFixed(6)}`);
      ok(String(d1.command?.name || '') === String(d2.command?.name || ''), `${d1.name} 指令桥一致（${d1.command?.name || '无'}）`);
      ok((d2.actions?.length || 0) === (d1.command ? 1 : 0), `${d1.name} action_list 生成正确`);
    }
  }
}
console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
globalThis.process?.exit(fail ? 1 : 0);