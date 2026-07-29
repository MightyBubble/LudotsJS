// FSM 运行时 —— 真·层级状态机（HFSM）：状态 action 与转移 condition 全部 = 模板图，
// 与 BT / 姿态机复用同一套模板库与 HFSM 核（hfsm.js）。
//
// machine JSON：{ initial, states: { key: { label, action: '模板id', states?: {…}, initial?: '子key' } },
//                 transitions: [{ from, to, condition: '模板id', event: 'mem事件类型'(可选), within }] }
// 语义（SCXML 子集）：
//   · 状态可嵌套：进入复合态沿 initial 链下沉到叶；inst.state = 扁平路径（'Root.Calm'）；
//   · 转移冒泡/继承：机级 transitions 的 from 匹配当前叶**或其任一祖先**即命中 ——
//     定义在复合态上的出边天然被全部后代继承；from:'*' 全局；
//   · action 继承：叶未声明 action 时沿祖先链取最近声明；
//   · 进入状态即启动其 action 图（异步跨 tick）；每 tick 先评估出边（condition 图同步
//     求值，或 mem 事件命中），转移则中止当前 action。显式 setState = 最高优先级转移。

import { obtainRun, releaseRun, startRun, tickRun } from '../graph/graphvm.js';
import { normalizeHfsm, hfsmLeafOf } from './hfsm.js';

// 规整缓存（0GC：源机未变复用；WeakMap 不污染机 JSON）
const normCache = new WeakMap();
const normOf = (m) => {
  let n = normCache.get(m);
  if (!n) { n = normalizeHfsm(m); normCache.set(m, n); }
  return n;
};

// leaf 是否等于或位于 ancestor 之下（转移继承判定）
const isAtOrBelow = (norm, leaf, ancestor) => {
  if (leaf === ancestor) return true;
  let p = norm.states[leaf]?.parent;
  for (let g = 0; p && g < 16; g++) {
    if (p === ancestor) return true;
    p = norm.states[p]?.parent;
  }
  return false;
};

export function createFsmInstance(machine, templates) {
  const norm = normOf(machine);
  return { machine, norm, templates, state: hfsmLeafOf(norm, machine.initial), run: null, enteredAt: 0, lastTransition: null, actionDone: false };
}

export function setFsmState(inst, key, ctx) {
  const leaf = hfsmLeafOf(inst.norm, key);
  if (!inst.norm.states[leaf]) return false;
  if (inst.run) { releaseRun(inst.run); inst.run = null; }
  inst.state = leaf;
  inst.enteredAt = ctx?.time ?? 0;
  inst.actionDone = false;
  return true;
}

export function tickFsm(inst, ctx, dt) {
  const norm = inst.norm;
  const cur = norm.states[inst.state];
  if (!cur) return null;

  // 1. 出边评估（condition 模板同步求值 / mem 事件 / 无条件=动作完成后；from 冒泡匹配叶或祖先）
  for (const t of inst.machine.transitions || []) {
    if (t.from !== '*' && !isAtOrBelow(norm, inst.state, t.from)) continue;
    let hit = false;
    if (t.event) {
      hit = !!ctx.mem?.last(t.event) && (ctx.time - ctx.mem.last(t.event).at) < (t.within ?? 0.5);
    } else if (t.condition || t.conditions) {
      // 条件模板同步求值；conditions 数组 = 全部满足（AND，旧数组方言 condition_ids 的等价表达）
      hit = (t.conditions || [t.condition]).every((cname) => {
        const tpl = inst.templates[cname];
        if (!tpl) return false;
        const r = obtainRun(tpl.compiled);
        startRun(r, {});
        const st = tickRun(r, ctx, dt);
        const ok = st === 'success' && !!r.output;
        releaseRun(r);
        return ok;
      });
    } else {
      // 无条件出边 = "动作完成后转移"：无动作立即转移；有动作等它自然结束
      hit = !cur.action || inst.actionDone;
    }
    if (hit) {
      const from = inst.state;
      setFsmState(inst, t.to, ctx);
      inst.lastTransition = { from, to: inst.state, at: ctx.time, by: t.event || t.condition || 'auto' };
      ctx.log?.({ type: 'fsm_transition', ...inst.lastTransition });
      break;
    }
  }

  // 2. 状态 action 推进（有效 action = 叶声明，缺省沿祖先链继承；behavior 是同义别名 ——
  //    编辑器只有一个「行为图」字段，统一 FSM 与姿态机共享同一挂载点）
  const leaf = norm.states[inst.state];
  const action = leaf?.action ?? leaf?.behavior;
  if (action) {
    const tpl = inst.templates[action];
    if (!tpl) { ctx.log?.(`FSM 未知模板: ${action}`); return inst.state; }
    if (!inst.run && !inst.actionDone) {
      inst.run = obtainRun(tpl.compiled);
      startRun(inst.run, {});
    }
    if (inst.run) {
      const st = tickRun(inst.run, ctx, dt);
      if (st !== 'running') {
        releaseRun(inst.run);
        inst.run = null;
        inst.actionDone = true; // 无条件出边在下一 tick 接住
      }
    }
  }
  return inst.state;
}
